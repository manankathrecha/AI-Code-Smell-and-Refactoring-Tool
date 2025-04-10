import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';


const SENIORITY_OPTIONS = ['junior', 'senior', 'executive'];
const DEPARTMENT_OPTIONS = [
  'executive', 'it', 'finance', 'management', 'sales', 'legal',
  'support', 'hr', 'marketing', 'communication', 'education', 'design',
  'health', 'operations'
];
const LIMIT_OPTIONS = [10, 20, 30, 40, 50];

// --- Custom MultiSelectDropdown Component ---
const MultiSelectDropdown = ({ options, name, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    let newSelected;
    if (selected.includes(option)) {
      newSelected = selected.filter(item => item !== option);
    } else {
      newSelected = [...selected, option];
    }
    onChange(name, newSelected);
  };

  // Default to displaying "All" if all options are selected or none selected
  const displayText =
    selected.length === options.length || selected.length === 0
      ? 'All'
      : selected.join(', ');

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="border border-gray-300 rounded px-3 py-2 cursor-pointer bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}>
        {displayText}
      </div>
      {isOpen && (
        <div className="absolute mt-1 w-full border border-gray-300 bg-white shadow-lg z-10 max-h-48 overflow-y-auto rounded">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => toggleOption(option)}
              className={`px-4 py-2 cursor-pointer ${selected.includes(option)
                ? "bg-gray-200 text-black font-medium"
                : "hover:bg-gray-100"
                }`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
// --- End MultiSelectDropdown Component ---
/**
 * SimilarityScore Component
 * Visual representation of similarity score with color-coded bar
 * @param {number} score - Similarity score between 0 and 1
 */
const SimilarityScore = ({ score }) => {
  // Color coding based on score ranges
  const getScoreColor = (score) => {
    if (score >= 0.8) return 'bg-green-500';  // High similarity (80-100%)
    if (score >= 0.6) return 'bg-blue-500';   // Good similarity (60-79%)
    if (score >= 0.4) return 'bg-yellow-500'; // Moderate similarity (40-59%)
    return 'bg-gray-500';                     // Low similarity (0-39%)
  };

  const scorePercentage = Math.round(score * 100);

  return (
    <div className="flex items-center space-x-2">
      <div className={`h-2 w-20 rounded-full ${getScoreColor(score)}`}>
        <div 
          className="h-full rounded-full bg-opacity-50"
          style={{ width: `${scorePercentage}%` }}
        />
      </div>
      <span className="text-sm font-medium">{scorePercentage}%</span>
    </div>
  );
};

/**
 * SimilarityControls Component
 * Controls for filtering and sorting contacts based on similarity
 * @param {number} threshold - Minimum similarity score threshold
 * @param {function} onThresholdChange - Handler for threshold changes
 * @param {function} onSortChange - Handler for sort order changes
 */
const SimilarityControls = ({ threshold, onThresholdChange, onSortChange }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-4">
      {/* Similarity threshold slider control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Minimum Similarity Score: {threshold * 100}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={threshold}
          onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Sort order selection dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sort By
        </label>
        <select
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="similarity">Similarity Score (High to Low)</option>
          <option value="similarityAsc">Similarity Score (Low to High)</option>
          <option value="name">Name</option>
          <option value="company">Company</option>
        </select>
      </div>
    </div>
  );
};
/**
 * SimilarityDetailsModal Component
 * Displays detailed breakdown of similarity scores
 * @param {Object} contact - Contact object containing similarity scores
 * @param {function} onClose - Handler for closing the modal
 */
const SimilarityDetailsModal = ({ contact, onClose }) => {
  if (!contact) return null;

  // Define scoring categories with their respective weights
  const categories = [
    { name: 'Education', score: contact.similarityScore.education, weight: '40%' },
    { name: 'Experience', score: contact.similarityScore.experience, weight: '20%' },
    { name: 'Industry', score: contact.similarityScore.industry, weight: '10%' },
    { name: 'Skills', score: contact.similarityScore.skills, weight: '10%' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        {/* Modal header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Similarity Score Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ×
          </button>
        </div>

        {/* Score breakdown by category */}
        <div className="space-y-4">
          {categories.map(category => (
            <div key={category.name} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-gray-500">Weight: {category.weight}</p>
              </div>
              <SimilarityScore score={category.score} />
            </div>
          ))}
          
          {/* Overall score display */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Overall Score</p>
              <SimilarityScore score={contact.similarityScore.overall} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const CreateContactPage = () => {
  console.log("🔥 CreateContactPage mounted");

  const navigate = useNavigate();

  const [companySearchParams, setCompanySearchParams] = useState(() => {
    const stored = sessionStorage.getItem('companySearchParams');
    return stored ? JSON.parse(stored) : {
      search_term: '',
      max_tokens: 150,
      temperature: 0.2,
      location: '',
      company_size: ''
    };
  });
 // State variables for similarity score features
const [sortOrder, setSortOrder] = useState('similarity');  // Controls the sort order of contacts
const [similarityThreshold, setSimilarityThreshold] = useState(0);  // Minimum similarity score filter
const [showSimilarityControls, setShowSimilarityControls] = useState(false);  // Toggle for similarity control panel
  useEffect(() => {
    sessionStorage.setItem('companySearchParams', JSON.stringify(companySearchParams));
  }, [companySearchParams]);

  const [isCompanyLoading, setIsCompanyLoading] = useState(() => {
    const stored = sessionStorage.getItem('isCompanyLoading');
    return stored ? JSON.parse(stored) : false;
  });

  
  useEffect(() => {
    sessionStorage.setItem('isCompanyLoading', JSON.stringify(isCompanyLoading));
  }, [isCompanyLoading]);

  // const [generatedCompanies, setGeneratedCompanies] = useState(() => {
  //   const stored = sessionStorage.getItem('generatedCompanies');
  //   return stored ? JSON.parse(stored) : [];
  // });
  
  const [generatedCompanies, setGeneratedCompanies] = useState([
    {
      "Company Name": "Tech Corp",
      "Company URL": "https://domainurl.com"
    },
    {
      "Company Name": "InnoVibe AI",
      "Company URL": "https://innovibe.ai"
    },
    {
      "Company Name": "Quantum Solutions",
      "Company URL": "https://quantumsol.com"
    }
  ]);
  useEffect(() => {
    sessionStorage.setItem('generatedCompanies', JSON.stringify(generatedCompanies));
  }, [generatedCompanies]);

  const [contactSearchParams, setContactSearchParams] = useState(() => {
    const stored = sessionStorage.getItem('contactSearchParams');
    return stored
      ? JSON.parse(stored)
      : {
        company_name: '',
        domain: '',
        limit: 10,
        offset: 0,
        email_type: '',
        seniority: [...SENIORITY_OPTIONS],
        department: [...DEPARTMENT_OPTIONS]
      };
  });
  useEffect(() => {
    sessionStorage.setItem('contactSearchParams', JSON.stringify(contactSearchParams));
  }, [contactSearchParams]);

  const [isContactLoading, setIsContactLoading] = useState(() => {
    const stored = sessionStorage.getItem('isContactLoading');
    return stored ? JSON.parse(stored) : false;
  });
  useEffect(() => {
    sessionStorage.setItem('isContactLoading', JSON.stringify(isContactLoading));
  }, [isContactLoading]);

  // const [searchResults, setSearchResults] = useState(() => {
  //   const stored = sessionStorage.getItem('searchResults');
  //   return stored ? JSON.parse(stored) : [];
  // });

  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    full_name: '',
    email: '',
    company: '',
    role: '',
    linkedin_url: '',
    phone: ''
  });
  const [searchResults, setSearchResults] = useState([
    {
      value: "samantha@example.com",
      first_name: "Samantha",
      last_name: "Lee",
      position: "Head of Marketing",
      seniority: "Senior",
      department: "Marketing",
      linkedin_url: "https://linkedin.com/in/samanthalee"
    },
    {
      value: "tom.jenkins@example.com",
      first_name: "Tom",
      last_name: "Jenkins",
      position: "Engineering Manager",
      seniority: "Manager",
      department: "Engineering",
      linkedin_url: "https://linkedin.com/in/tomjenkins"
    },
    {
      value: "diana.carter@example.com",
      first_name: "Diana",
      last_name: "Carter",
      position: "Product Designer",
      seniority: "Mid-Level",
      department: "Product",
      linkedin_url: ""
    }
  ]);

  useEffect(() => {
    sessionStorage.setItem('searchResults', JSON.stringify(searchResults));
  }, [searchResults]);

  const [selectedContacts, setSelectedContacts] = useState(() => {
    const stored = sessionStorage.getItem('selectedContacts');
    return stored ? JSON.parse(stored) : [];
  });
  useEffect(() => {
    sessionStorage.setItem('selectedContacts', JSON.stringify(selectedContacts));
  }, [selectedContacts]);

  // State for saved searches
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSavedDropdown, setShowSavedDropdown] = useState(false);

  const [lastContactSearchParams, setLastContactSearchParams] = useState(null);

  const { register, handleSubmit } = useForm();

  const jwt_token = localStorage.getItem('jwt_token');

  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${jwt_token}`,
    };
    return fetch(url, { ...options, headers, credentials: 'include' });
  };

  // Fetch saved searches from backend
  const fetchSavedSearches = async () => {
    try {
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL}/perplexity/saved-searches`, {
        method: 'GET',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch saved searches.');
      }
      const data = await response.json();
      // Sort by created_at descending (most recent first)
      const sorted = data.saved_searches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setSavedSearches(sorted);
    } catch (error) {
      console.error('Error fetching saved searches:', error);
      toast.error(error.message || 'Error fetching saved searches.');
    }
  };

  // Fetch saved searches on component mount
  useEffect(() => {
    fetchSavedSearches();
  }, []);

  // Toggle saved searches dropdown
  const toggleSavedDropdown = () => {
    setShowSavedDropdown(prev => !prev);
  };


  /**
 * Handles sorting of contacts based on different criteria
 * @param {string} sortType - Type of sort to apply (similarity, name, company)
 */
  const handleSortChange = (sortType) => {
    setSortOrder(sortType);
    const sortedContacts = [...searchResults].sort((a, b) => {
      switch (sortType) {
        case 'similarity':
          return (b.similarityScore?.overall || 0) - (a.similarityScore?.overall || 0);
        case 'similarityAsc':
          return (a.similarityScore?.overall || 0) - (b.similarityScore?.overall || 0);
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        default:
          return 0;
      }
    });
    setSearchResults(sortedContacts);
  };
  

  // Handle selection of a saved search
  const handleSavedSearchSelect = async (saved) => {
    try {
      // Determine the saved search ID from _id or id
      const savedId = saved._id || saved.id;
      if (!savedId) {
        throw new Error('Saved search ID is missing.');
      }

      // Update the search form fields with the saved search values
      setCompanySearchParams({
        ...companySearchParams,
        search_term: saved.search_term,
        location: saved.location,
        company_size: saved.company_size,
      });

      let companies = [];
      // If caches exist, attempt to fetch the aggregated companies
      if (saved.caches && saved.caches.length > 0) {
        const response = await fetchWithAuth(
          `${process.env.REACT_APP_API_URL}/perplexity/saved-search/${savedId}`,
          { method: 'GET' }
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to fetch saved search details.');
        }
        const data = await response.json();
        companies = data.companies;
      }

      // If no companies are returned, fallback to re-running the search
      if (companies.length === 0) {
        const requestBody = {
          search_term: saved.search_term,
          location: saved.location,
          company_size: saved.company_size,
          max_tokens: companySearchParams.max_tokens,
          temperature: companySearchParams.temperature,
        };
        const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL}/perplexity/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to perform search.');
        }
        const data = await response.json();
        companies = data.companies;
      }

      // Update the generated companies list with the retrieved companies
      setGeneratedCompanies(companies);
      setShowSavedDropdown(false);
      toast.info(`Loaded saved search: ${saved.search_term} (${new Date(saved.created_at).toLocaleString()})`);
    } catch (error) {
      console.error('Error loading saved search:', error);
      toast.error(error.message || 'Error loading saved search.');
    }
  };

  const handleCompanyChange = (e) => {
    const { name, value } = e.target;
    setCompanySearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleMultiSelectChange = (name, value) => {
    setContactSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompanySearch = async (e) => {
    e.preventDefault();
    const { search_term } = companySearchParams;

    if (!search_term.trim()) {
      toast.warn('Please provide a search term.');
      return;
    }

    setIsCompanyLoading(true);
    setGeneratedCompanies([]);
    console.log('Initiating Perplexity.ai Search with parameters:', companySearchParams);

    try {
      const requestBody = {
        search_term,
        max_tokens: companySearchParams.max_tokens,
        temperature: companySearchParams.temperature,
      };
      if (companySearchParams.location) {
        requestBody.location = companySearchParams.location;
      }
      if (companySearchParams.company_size) {
        requestBody.company_size = companySearchParams.company_size;
      }

      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL}/perplexity/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to perform search.');
      }

      const data = await response.json();
      setGeneratedCompanies(data.companies);
      toast.success('Search completed!');
      console.log('Search Results:', data.companies);
      // Refresh saved searches after a successful search
      fetchSavedSearches();
    } catch (error) {
      console.error('Error performing search:', error);
      toast.error(error.message || 'Failed to perform search.');
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const handleGenerateMoreCompanies = async () => {
    if (!companySearchParams.search_term.trim() || generatedCompanies.length === 0) {
      toast.warn('Search term or initial companies are missing.');
      return;
    }
    setIsCompanyLoading(true);
    try {
      const existingCompaniesFormatted = generatedCompanies.map(
        (company) => `${company["Company Name"]} - ${company["Company URL"]}`
      );

      const requestBody = {
        search_term: companySearchParams.search_term,
        existing_companies: existingCompaniesFormatted,
        max_tokens: companySearchParams.max_tokens,
        temperature: companySearchParams.temperature,
      };

      if (companySearchParams.location) {
        requestBody.location = companySearchParams.location;
      }
      if (companySearchParams.company_size) {
        requestBody.company_size = companySearchParams.company_size;
      }

      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL}/perplexity/generate-more`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate more companies.');
      }

      const data = await response.json();
      setGeneratedCompanies((prev) => {
        const prevKeys = new Set(
          prev.map((c) => `${c["Company Name"]} - ${c["Company URL"]}`)
        );
        const filtered = data.companies.filter((c) => {
          const key = `${c["Company Name"]} - ${c["Company URL"]}`;
          return !prevKeys.has(key);
        });
        return [...prev, ...filtered];
      });
      toast.success('Additional companies generated!');
      fetchSavedSearches(); // Refresh saved searches
    } catch (error) {
      console.error('Error generating more companies:', error);
      toast.error(error.message || 'Failed to generate more companies.');
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const handleSelectCompany = (company) => {
    setContactSearchParams((prev) => ({
      ...prev,
      company_name: company["Company Name"],
      domain: extractDomain(company["Company URL"]),
    }));
    toast.info(`Selected company: ${company["Company Name"]}`);
  };

  const extractDomain = (url) => {
    try {
      const { hostname } = new URL(url);
      return hostname.replace('www.', '');
    } catch (error) {
      console.error('Invalid URL:', url);
      return '';
    }
  };

  const handleContactSearch = async (e) => {
    e.preventDefault();
    setIsContactLoading(true);
    const currentSearch = { ...contactSearchParams };
    const compareCurrent = { ...currentSearch };
    delete compareCurrent.offset;
    delete compareCurrent.limit;
    let newOffset = 0;
    if (lastContactSearchParams && JSON.stringify(lastContactSearchParams) === JSON.stringify(compareCurrent)) {
      newOffset = Number(contactSearchParams.offset) + 10;
    } else {
      newOffset = 0;
      setSearchResults([]);
      setSelectedContacts([]);
    }
    setLastContactSearchParams(compareCurrent);
    const paramsForFetch = {
      ...contactSearchParams,
      offset: newOffset,
      seniority: contactSearchParams.seniority.join(","),
      department: contactSearchParams.department.join(",")
    };

    try {
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL}/hunterio/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paramsForFetch),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to perform search.');
      }
      const data = await response.json();
      if (newOffset > 0) {
        setSearchResults((prev) => [...prev, ...data.emails]);
      } else {
        setSearchResults(data.emails);
      }
      toast.success('Contact search completed!');
      console.log('Contact Search Results:', data.emails);
    } catch (error) {
      console.error('Error performing contact search:', error);
      toast.error(error.message || 'Failed to perform search.');
    } finally {
      setIsContactLoading(false);
      setContactSearchParams((prev) => ({ ...prev, offset: newOffset }));
    }
  };
  

  const handleSelect = (email) => {
    setSelectedContacts((prev) => {
      if (prev.includes(email)) {
        return prev.filter((item) => item !== email);
      } else {
        return [...prev, email];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === searchResults.length) {
      setSelectedContacts([]);
    } else {
      const allEmails = searchResults.map((contact) => contact.value);
      setSelectedContacts(allEmails);
    }
  };

  const handleAddSelected = async () => {
    if (selectedContacts.length === 0) {
      toast.warn('No contacts selected to add.');
      return;
    }

    const contactsToAdd = searchResults
      .filter((contact) => selectedContacts.includes(contact.value))
      .map((contact) => {
        const full_name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
        const verificationDate =
          contact.verification_date && contact.verification_date.trim() !== ''
            ? new Date(contact.verification_date).toISOString()
            : null;
        const sources = Array.isArray(contact.sources)
          ? contact.sources.map((s) => s.uri).filter(Boolean)
          : [];
        return {
          full_name,
          first_name: contact.first_name || '',
          last_name: contact.last_name || '',
          email: contact.value,
          where_met: 'Contact Search',
          phone: contact.phone || '',
          linkedin_url: contact.linkedin_url || '',
          company: contactSearchParams.company_name || contact.company || '',
          company_url: contact.company_url || '',
          job_title: contact.position || '',
          location: contact.location || '',
          position: contact.position || '',
          seniority: contact.seniority || '',
          department: contact.department || '',
          twitter: contact.twitter || '',
          verification_status: contact.verification_status || '',
          verification_date: verificationDate,
          sources: sources,
          tags: [],
          email_type: contact.email_type || 'generic',
          confidence: parseFloat(contact.confidence) || 0,
          connection_strength: 0.0

        };
      });

    for (const contact of contactsToAdd) {
      if (!contact.full_name || !contact.position) {
        toast.error(`Contact ${contact.email} is missing required fields (full_name, position).`);
        return;
      }
    }

    try {
      const addResponse = await fetchWithAuth(`${process.env.REACT_APP_API_URL}/contacts/bulk-add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactsToAdd),
      });
      if (!addResponse.ok) {
        const errorData = await addResponse.json();
        throw new Error(errorData.detail || 'Failed to add contacts.');
      }
      const resData = await addResponse.json();
      toast.success(`${resData.added_contacts} contacts added successfully.`);
      setSearchResults([]);
      setSelectedContacts([]);
      setContactSearchParams(prev => ({
        ...prev,
        company_name: '',
        domain: ''
      }));
    } catch (error) {
      console.error('Error adding contacts:', error);
      toast.error(error.message || 'Failed to add selected contacts.');
    }
  };

  const handleManualFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!manualFormData.full_name || !manualFormData.email) {
      toast.error('Full name and email are required.');
      return;
    }
  
    // Split full name into first and last name
    const nameParts = manualFormData.full_name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
  
    try {
      const contactData = {
        full_name: manualFormData.full_name,
        first_name: firstName,
        last_name: lastName,
        email: manualFormData.email,
        company: manualFormData.company,
        position: manualFormData.role,
        linkedin_url: manualFormData.linkedin_url,
        phone: manualFormData.phone,
        where_met: 'Manual Entry',
        tags: []
      };
  
      const response = await fetchWithAuth(`${process.env.REACT_APP_API_URL}/contacts/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add contact');
      }
  
      toast.success('Contact added successfully!');
      setShowManualForm(false);
      setManualFormData({
        full_name: '',
        email: '',
        company: '',
        role: '',
        linkedin_url: '',
        phone: ''
      });
  
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error(error.message || 'Failed to add contact');
    }
  };
  
  const handleManualFormChange = (e) => {
    const { name, value } = e.target;
    setManualFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const ManualContactForm = ({ onCancel }) => {
    const [formData, setFormData] = useState({
      full_name: '',
      email: '',
      company: '',
      role: '',
      linkedin_url: '',
      phone: ''
    });
  
    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!formData.full_name || !formData.email) {
        toast.error('Full name and email are required.');
        return;
      }
  
      try {
        const nameParts = formData.full_name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
  
        const contactData = {
          full_name: formData.full_name,
          first_name: firstName,
          last_name: lastName,
          email: formData.email,
          company: formData.company,
          position: formData.role,
          linkedin_url: formData.linkedin_url,
          phone: formData.phone,
          where_met: 'Manual Entry',
          tags: []
        };
  
        const response = await fetch(`${process.env.REACT_APP_API_URL}/contacts/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
          },
          body: JSON.stringify(contactData)
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to add contact');
        }
  
        toast.success('Contact added successfully!');
        onCancel();
      } catch (error) {
        console.error('Error adding contact:', error);
        toast.error(error.message || 'Failed to add contact');
      }
    };
  
    return (
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/3 -translate-y-1/2 bg-white shadow rounded-lg p-8 max-w-4xl w-full">
        <div className="relative w-full mb-4">
          <h2 className="text-2xl font-semibold text-center">Create Contact</h2>
          <button 
            onClick={onCancel}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 flex items-center justify-center text-gray-400 text-5xl">
            <AccountCircleOutlinedIcon style={{ fontSize: 100 }} className="h-6 w-6 text-gray-600" />
          </div>
        </div>
  
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name*</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address*</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Enter company name"
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contact Role</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="Enter Contact Role"
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">LinkedIn Profile</label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                placeholder="Enter LinkedIn URL"
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>
  
          <div className="flex justify-end mt-6 space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save Contact
            </button>
          </div>
        </form>
      </div>
    );
  };

  
  

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {!showManualForm ? (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Add Contacts</h2>
            <button
  className="flex items-center text-sm text-blue-600 hover:underline"
  onClick={() => {
    console.log("✅ Button Clicked: Add Contacts Manually");
    setShowManualForm(true);
  }}
>
  <PersonAddIcon className="h-6 w-6 text-gray-600 mb-2 gap-2 mt-2 mr-1" />
  Add Contacts Manually
</button>

          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Generate Companies</h3>
            <form onSubmit={handleCompanySearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  name="search_term"
                  value={companySearchParams.search_term}
                  onChange={handleCompanyChange}
                  placeholder='e.g., "AI Tech Giants"'
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                  required
                />
                <input
                  type="text"
                  name="location"
                  value={companySearchParams.location}
                  onChange={handleCompanyChange}
                  placeholder="Enter location"
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
                <input
                  type="text"
                  name="company_size"
                  value={companySearchParams.company_size}
                  onChange={handleCompanyChange}
                  placeholder="Any size"
                  className="border border-gray-300 rounded px-3 py-2 w-full"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
                disabled={isCompanyLoading}
              >
                {isCompanyLoading ? "Generating..." : "Generate Companies"}
              </button>
            </form>

            {generatedCompanies.length > 0 && (
              <div className="mt-6">
                <table className="w-full text-left border mt-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 font-medium">Company</th>
                      <th className="p-2 font-medium">Domain</th>
                      <th className="p-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedCompanies.map((company, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{company["Company Name"]}</td>
                        <td className="p-2">{company["Company URL"]}</td>
                        <td className="p-2">
                          <button
                            className="border px-3 py-1 rounded hover:bg-gray-100"
                            onClick={() => handleSelectCompany(company)}
                          >
                            Select this company
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  onClick={handleGenerateMoreCompanies}
                  className="mt-4 border px-4 py-2 rounded hover:bg-gray-100"
                  disabled={isCompanyLoading}
                >
                  {isCompanyLoading ? "Generating more..." : "Find more companies like this"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h3 className="text-lg font-medium mb-4">Add Contacts</h3>
            <form onSubmit={handleContactSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={contactSearchParams.company_name}
                    onChange={handleContactChange}
                    placeholder="Enter company name"
                    required
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Domain (Optional)</label>
                  <input
                    type="text"
                    name="domain"
                    value={contactSearchParams.domain}
                    onChange={handleContactChange}
                    placeholder="company.com"
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Number of Contacts</label>
                  <select
                    name="limit"
                    value={contactSearchParams.limit}
                    onChange={handleContactChange}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  >
                    {LIMIT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Email Type (Optional)</label>
                  <input
                    type="text"
                    name="email_type"
                    value={contactSearchParams.email_type}
                    onChange={handleContactChange}
                    placeholder="Enter email type"
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Seniority (Optional)</label>
                  <MultiSelectDropdown
                    options={SENIORITY_OPTIONS}
                    name="seniority"
                    selected={contactSearchParams.seniority}
                    onChange={handleMultiSelectChange}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-medium">Department (Optional)</label>
                  <MultiSelectDropdown
                    options={DEPARTMENT_OPTIONS}
                    name="department"
                    selected={contactSearchParams.department}
                    onChange={handleMultiSelectChange}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
                disabled={isContactLoading}
              >
                {isContactLoading ? 'Searching...' : 'Search Contact(s)'}
              </button>
            </form>

            {!isContactLoading && contactSearchParams.company_name && searchResults.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-700 p-4 rounded mt-4">
                No contacts found. Try adjusting your search criteria.
              </div>
            )}

{searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results</h3>
          <div className="table-actions" style={{ marginBottom: '0.5rem' }}>
            <button type="button" onClick={handleSelectAll}>
              {selectedContacts.length === searchResults.length ? 'Deselect All' : 'Select All'}
            </button>
            <button type="button" onClick={handleAddSelected} disabled={selectedContacts.length === 0} style={{ marginLeft: '1rem' }}>
              Add Selected Contacts
            </button>
          </div>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Position</th>
                  <th>Confidence</th>
                  <th>Similarity</th>
                  <th>LinkedIn</th>
                  <th>LinkedIn Data</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map(contact => (
                  <tr key={contact.value}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.value)}
                        onChange={() => handleSelect(contact.value)}
                      />
                    </td>
                    <td>{`${contact.first_name || ''} ${contact.last_name || ''}`}</td>
                    <td>{contact.value}</td>
                    <td>{contact.position || 'N/A'}</td>
                    <td>{contact.confidence || 'N/A'}</td>
                    <td>
                      {contact.similarity_score ? (
                        <button
                          onClick={() => {
                            setSelectedSimilarityData(contact.similarity_score);
                            setShowSimilarityModal(true);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: getScoreColor(contact.similarity_score.overall),
                            fontWeight: 'bold'
                          }}
                        >
                          {Math.round(contact.similarity_score.overall * 100)}%
                        </button>
                      ) : 'N/A'}
                    </td>
                    <td>
                      {contact.linkedin_url ? (
                        <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer">
                          View Profile
                        </a>
                      ) : 'N/A'}
                    </td>
                    <td>
                      {contact.linkedin_data_fetched ? (
                        contact.linkedin_data ? (
                          <button
                            onClick={() => {
                              setSelectedLinkedInData(formatLinkedInData(contact.linkedin_data));
                              setShowLinkedInModal(true);
                            }}
                            className="view-linkedin-data-btn"
                          >
                            View LinkedIn Data
                          </button>
                        ) : 'No data found'
                      ) : (
                        <span className="fetching-data">Fetching data...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {isContactLoading ? (
            <div className="loading">Loading more contacts...</div>
          ) : (
            <button type="button" onClick={() => handleContactSearch()} className="load-more-btn" style={{ marginTop: '1rem' }}>
              Load More
            </button>
          )}
        </div>
      )}
                <button
                  onClick={handleAddSelected}
                  className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
                  disabled={selectedContacts.length === 0}
                >
                  Save Contact(s)
                </button>
              </div>
            )}
          </div>
        </>
          ) : (
        <ManualContactForm onCancel={() => setShowManualForm(false)} />
      )}
    </div>
  );
};

export default CreateContactPage;
