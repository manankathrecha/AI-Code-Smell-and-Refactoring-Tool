import logging
import traceback
import json
import os
import datetime
from dotenv import load_dotenv
from pymongo import MongoClient
from typing import List, Dict, Any
import requests
from difflib import SequenceMatcher  # Make sure this import is present
import re
import unicodedata
from difflib import SequenceMatcher
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from schemas import HunterIOSearchRequest, HunterIOSearchResponse
from auth import get_current_user
from find_email import search_hunterio_domain, validate_single_email
from utils import check_and_increment_usage
from database import users_collection
from message import get_contact_linkedin_info  # Import the LinkedIn scraping function

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()

# Connect to MongoDB for caching
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    logger.error("MONGO_URI is not set in the environment.")
    raise Exception("MongoDB URI not configured.")
client = MongoClient(MONGO_URI, tls=True, tlsAllowInvalidCertificates=True)
db = client["network_management"]
hunter_cache = db["hunterio_cache"]
linkedin_cache = db["linkedin_cache"]  # Add a cache collection for LinkedIn data

def normalize(text: str) -> str:
    t = unicodedata.normalize("NFKC", text or "")
    t = t.lower()
    t = re.sub(r"[^\w\s]", " ", t)
    return re.sub(r"\s+", " ", t).strip()

def tokens(text: str) -> List[str]:
    stop = {"and","the","of","in","for","to","with"}
    return [tok for tok in normalize(text).split() if len(tok)>2 and tok not in stop]

def make_acronym(text: str) -> str:
    return "".join(tok[0] for tok in tokens(text)).lower()

def skill_match(a: str, b: str,
                token_thresh: float = 0.2,
                fuzzy_thresh: float = 0.75) -> bool:
    na, nb = normalize(a), normalize(b)
    ta, tb = set(tokens(na)), set(tokens(nb))

    # 1) Acronym
    if na and nb and (na == make_acronym(nb) or nb == make_acronym(na)):
        return True

    # 2) Token overlap
    if ta and tb:
        overlap = len(ta & tb)
        if overlap / min(len(ta), len(tb)) >= token_thresh:
            return True

    # 3) Fuzzy
    if SequenceMatcher(None, na, nb).ratio() >= fuzzy_thresh:
        return True

    return False


def find_linkedin_url(first_name: str, last_name: str, company_name: str) -> str:
    """
    Uses Google Custom Search API to look up a LinkedIn URL
    for the provided first name, last name, and company name.
    """
    query = f'site:linkedin.com/in "{first_name} {last_name}" "{company_name}"'
    search_url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "q": query,
        "key": os.getenv("GOOGLE_API_KEY"),
        "cx": os.getenv("GOOGLE_CSE_ID"),
        "num": 1
    }
    try:
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        items = data.get("items", [])
        if items:
            return items[0].get("link", "")
    except Exception as e:
        logger.error(f"Error in find_linkedin_url: {e}")
    return ""

def get_cached_linkedin_data(linkedin_url: str) -> Dict[str, Any]:
    """
    Check if we have cached LinkedIn data for this URL
    """
    if not linkedin_url:
        return None
    
    cached_data = linkedin_cache.find_one({"linkedin_url": linkedin_url})
    if cached_data:
        # Check if cache is still valid (7 days)
        cache_time = cached_data.get("timestamp")
        if cache_time and (datetime.datetime.utcnow() - cache_time).days < 7:
            logger.info(f"Using cached LinkedIn data for {linkedin_url}")
            return cached_data.get("linkedin_data")
    
    return None

def cache_linkedin_data(linkedin_url: str, linkedin_data: Dict[str, Any]) -> None:
    """
    Cache LinkedIn data for future use
    """
    if not linkedin_url or not linkedin_data:
        return
    
    try:
        linkedin_cache.update_one(
            {"linkedin_url": linkedin_url},
            {"$set": {
                "linkedin_data": linkedin_data,
                "timestamp": datetime.datetime.utcnow()
            }},
            upsert=True
        )
        logger.info(f"Cached LinkedIn data for {linkedin_url}")
    except Exception as e:
        logger.error(f"Error caching LinkedIn data: {e}")

def calculate_similarity_score(user_linkedin_data: Dict[str, Any], contact_linkedin_data: Dict[str, Any]) -> Dict[str, Any]:
    result = {}

    # Education: match schoolName only
    ueds = [edu.get("schoolName","") for edu in user_linkedin_data.get("educations",[])]
    ceds = [edu.get("schoolName","") for edu in contact_linkedin_data.get("educations",[])]
    edu_matches = sum(
        1 for us in ueds for cs in ceds if skill_match(us, cs, token_thresh=0.2, fuzzy_thresh=0.8)
    )
    edu_score = min(1.0, edu_matches / max(1, len(ueds)))
    result["education"] = {"score": round(edu_score,2), "matches": edu_matches}

    # Experience: match companyName only
    upos = [pos.get("companyName","") for pos in user_linkedin_data.get("fullPositions",[])]
    cpos = [pos.get("companyName","") for pos in contact_linkedin_data.get("fullPositions",[])]
    exp_matches = sum(
        1 for uc in upos for cc in cpos if skill_match(uc, cc, token_thresh=0.2, fuzzy_thresh=0.8)
    )
    exp_score = min(1.0, exp_matches / max(1, len(upos)))
    result["experience"] = {"score": round(exp_score,2), "matches": exp_matches}

    # Industry: fuzzy match on industry field
    ui = user_linkedin_data.get("industry","")
    ci = contact_linkedin_data.get("industry","")
    ind_match = skill_match(ui, ci, token_thresh=0.2, fuzzy_thresh=0.8) if ui and ci else False
    result["industry"] = {"score": 1.0 if ind_match else 0.0, "matches": 1 if ind_match else 0}

    # Skills: match each skill via skill_match
    usk = [s.get("name","") for s in user_linkedin_data.get("skills",[])]
    csk = [s.get("name","") for s in contact_linkedin_data.get("skills",[])]
    skill_matches = 0
    for us in usk:
        if any(skill_match(us, cs, token_thresh=0.2, fuzzy_thresh=0.75) for cs in csk):
            skill_matches += 1
    skill_score = min(1.0, skill_matches / max(1, len(usk)))
    result["skills"] = {"score": round(skill_score,2), "matches": skill_matches}

    # Overall weighted
    w = {"education":0.4, "experience":0.2, "industry":0.1, "skills":0.1}
    overall = (
        edu_score * w["education"] +
        exp_score * w["experience"] +
        (1.0 if ind_match else 0.0) * w["industry"] +
        skill_score * w["skills"]
    )
    result["overall"] = round(overall,2)

    return result


@router.post("/hunterio/search", response_model=HunterIOSearchResponse)
def hunterio_search_endpoint(
    search_request: HunterIOSearchRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        check_and_increment_usage(
            users_collection,
            user_email=current_user["email"],
            usage_type="emails"
        )
        # Extract search parameters
        company_name = search_request.company_name
        domain = search_request.domain
        limit = search_request.limit       # Number of emails requested per page
        offset = search_request.offset     # Number of emails to skip
        email_type = search_request.email_type
        seniority = search_request.seniority
        department = search_request.department

        # Assuming 'required_field' is an attribute of the search_request.
        required_field = getattr(search_request, "required_field", None)

        # Get API key from environment variable
        hunterio_api_key = os.getenv("HUNTERIO_API_KEY")
        if not hunterio_api_key:
            raise HTTPException(status_code=500, detail="Hunter.io API key not configured.")

        # Determine primary_domain
        if not domain:
            suffixes = [".com", ".org", ".net", ".io", ".co"]
            guessed_domains = [f"{company_name.lower()}{suf}" for suf in suffixes]
            primary_domain = guessed_domains[0]
            logger.debug(f"Guessed primary_domain: {primary_domain}")
        else:
            primary_domain = domain
            logger.debug(f"Using provided domain: {primary_domain}")

        # Build the cache query: exact match on all filtering criteria
        cache_query = {
            "company_name": company_name,
            "domain": primary_domain,
            "email_type": email_type,
            "seniority": seniority,
            "department": department,
            "required_field": required_field,
            "page_offset": offset,  # Add page offset to cache key
            "page_limit": limit     # Add page limit to cache key
        }

        # Retrieve or initialize the cache document for this specific page
        cache_doc = hunter_cache.find_one(cache_query)
        
        # If we don't have this page cached, fetch it from Hunter.io
        if not cache_doc or not cache_doc.get("emails"):
            logger.info(f"Cache miss for page with offset {offset}, limit {limit}. Fetching from Hunter.io.")
            
            # Create a new cache document for this page
            if not cache_doc:
                cache_doc = {
                    "company_name": company_name,
                    "domain": primary_domain,
                    "email_type": email_type,
                    "seniority": seniority,
                    "department": department,
                    "required_field": required_field,
                    "page_offset": offset,
                    "page_limit": limit,
                    "emails": [],
                    "timestamp": None
                }
                hunter_cache.insert_one(cache_doc)
                cache_doc = hunter_cache.find_one(cache_query)
            
            # Fetch this specific page from Hunter.io
            hunterio_result = search_hunterio_domain(
                domain=primary_domain,
                company=company_name,
                limit=limit,
                offset=offset,
                email_type=email_type,
                seniority=seniority,
                department=department,
                required_field=required_field,
                api_key=hunterio_api_key
            )
            
            if hunterio_result is None:
                logger.warning(f"No emails found or Hunter.io search failed for offset {offset}.")
                return HunterIOSearchResponse(additional_info={}, emails=[], similarity_scores={})
            
            # Store the emails for this page in the cache
            new_emails = hunterio_result.get("emails", [])
            hunter_cache.update_one(
                {"_id": cache_doc["_id"]},
                {"$set": {"emails": new_emails, "timestamp": datetime.datetime.utcnow()}}
            )
            
            # Refresh the cache document
            cache_doc = hunter_cache.find_one(cache_query)
        else:
            logger.info(f"Using cached data for page with offset {offset}, limit {limit}.")
        
        # Get the emails for this page from the cache
        emails_for_page = cache_doc.get("emails", [])
        
        # Get user's LinkedIn data
        user_data = users_collection.find_one({"email": current_user["email"]})
        user_linkedin_data = user_data.get("linkedin_data", {}) if user_data else {}
        
        # Process the emails to add LinkedIn data and other details
        detailed_emails: List[Dict[str, Any]] = []
        similarity_scores = {}
        
        for e in emails_for_page:
            email_val = e.get("value")
            if email_val:
                is_valid, validated_or_error = validate_single_email(email_val)
                if is_valid:
                    # Find or fetch LinkedIn URL
                    linkedin_url = e.get("linkedin", "")
                    if not linkedin_url:
                        linkedin_url = find_linkedin_url(
                            e.get("first_name", ""),
                            e.get("last_name", ""),
                            company_name
                        )
                    
                    # Get LinkedIn data if URL is available
                    linkedin_data = None
                    linkedin_data_fetched = False
                    
                    if linkedin_url:
                        # Check cache first
                        linkedin_data = get_cached_linkedin_data(linkedin_url)
                        
                        # If not in cache, fetch from API
                        if linkedin_data is None:
                            try:
                                logger.info(f"Fetching LinkedIn data for {linkedin_url}")
                                linkedin_data = get_contact_linkedin_info(linkedin_url)
                                if linkedin_data:
                                    linkedin_data_fetched = True
                                    # Cache the data for future use
                                    cache_linkedin_data(linkedin_url, linkedin_data)
                                    # Also update in hunter_cache
                                    update_linkedin_data_in_hunter_cache(primary_domain, email_val, linkedin_data, offset, limit)
                                else:
                                    logger.warning(f"No LinkedIn data found for {linkedin_url}")
                            except Exception as linkedin_err:
                                logger.error(f"Error fetching LinkedIn data for {linkedin_url}: {linkedin_err}")
                        else:
                            linkedin_data_fetched = True
                            # Update in hunter_cache even if from cache
                            update_linkedin_data_in_hunter_cache(primary_domain, email_val, linkedin_data, offset, limit)
                    
                    # Calculate similarity score if we have LinkedIn data for both user and contact
                    if linkedin_data and user_linkedin_data:
                        score = calculate_similarity_score(user_linkedin_data, linkedin_data)
                        # Save the full details (including per-category matches and overall score)
                        similarity_scores[email_val] = score
                    
                    email_details = {
                        "value": validated_or_error,
                        "type": e.get("type"),
                        "confidence": e.get("confidence"),
                        "sources": e.get("sources", []),
                        "first_name": e.get("first_name", ""),
                        "last_name": e.get("last_name", ""),
                        "position": e.get("position", ""),
                        "seniority": e.get("seniority", ""),
                        "department": e.get("department", ""),
                        "linkedin_url": linkedin_url,
                        "twitter": e.get("twitter", ""),
                        "phone_number": e.get("phone_number", ""),
                        "verification": e.get("verification", {}),
                        "linkedin_data": linkedin_data,
                        "linkedin_data_fetched": linkedin_data_fetched,
                        "similarity_score": similarity_scores.get(email_val, {}).get("overall", 0.0)
                    }
                    detailed_emails.append(email_details)
                    logger.info(f"[Hunter.io] Found VALID email: {validated_or_error}")
                else:
                    logger.info(f"[Hunter.io] Invalid email '{email_val}': {validated_or_error}")

        return HunterIOSearchResponse(
            additional_info={},
            emails=detailed_emails,
            similarity_scores=similarity_scores
        )

    except HTTPException as he:
        logger.error(f"HTTPException in hunterio_search_endpoint: {he.detail}")
        raise he
    except Exception as e:
        logger.error(f"Error in hunterio_search_endpoint: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Update the LinkedIn data update function to include pagination parameters
def update_linkedin_data_in_hunter_cache(domain, email_value, linkedin_data, offset=None, limit=None):
    """Update LinkedIn data for a specific email in the hunter_cache collection"""
    try:
        # Find the cache document containing this email with pagination parameters
        query = {
            "domain": domain,
            "emails.value": email_value
        }
        
        # Add pagination parameters if provided
        if offset is not None and limit is not None:
            query["page_offset"] = offset
            query["page_limit"] = limit
        
        cache_doc = hunter_cache.find_one(query)
        
        if cache_doc:
            # Update the specific email in the emails array
            hunter_cache.update_one(
                {
                    "_id": cache_doc["_id"],
                    "emails.value": email_value
                },
                {
                    "$set": {
                        "emails.$.linkedin_data": linkedin_data,
                        "emails.$.linkedin_data_fetched": True
                    }
                }
            )
            logger.info(f"Updated LinkedIn data in hunter_cache for {email_value}")
        else:
            logger.warning(f"Could not find email {email_value} in hunter_cache")
    except Exception as e:
        logger.error(f"Error updating LinkedIn data in hunter_cache: {e}")

@router.post("/fetch-linkedin-data")
async def fetch_linkedin_data(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch LinkedIn data for a specific contact and update the cache
    """
    try:
        linkedin_url = request.get("linkedin_url")
        email = request.get("email")
        
        if not linkedin_url:
            raise HTTPException(status_code=400, detail="LinkedIn URL is required")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Check if we already have cached data
        linkedin_data = get_cached_linkedin_data(linkedin_url)
        
        # If not in cache, fetch from LinkedIn
        if linkedin_data is None:
            try:
                linkedin_data = get_contact_linkedin_info(linkedin_url)
                if linkedin_data:
                    # Cache the data for future use
                    cache_linkedin_data(linkedin_url, linkedin_data)
            except Exception as e:
                logger.error(f"Error fetching LinkedIn data: {e}")
                raise HTTPException(status_code=500, detail=f"Error fetching LinkedIn data: {str(e)}")
        
        # Update the hunter cache with this LinkedIn data
        if linkedin_data:
            # Find the domain for this email
            cache_entry = hunter_cache.find_one({"emails.value": email})
            if cache_entry:
                domain = cache_entry.get("domain")
                # Update the LinkedIn data in the cache
                hunter_cache.update_one(
                    {"domain": domain, "emails.value": email},
                    {"$set": {
                        "emails.$.linkedin_data": linkedin_data,
                        "emails.$.linkedin_data_fetched": True
                    }}
                )
        
        return {"linkedin_data": linkedin_data}
    
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in fetch-linkedin_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))