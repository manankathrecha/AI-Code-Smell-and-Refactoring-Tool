# Code Smell and Refactoring Tool

## Overview
This project is a Code Smell and Refactoring Tool designed to:
1. Detect code smells such as Data Class, Blob, Long Method, and Feature Envy.
2. Provide automated refactoring suggestions to improve code quality.
3. Collect and analyze user feedback for insights and further improvement.

The project comprises a backend implemented using Flask with a Hugging Face model and OpenAI API, and a React-based frontend.

**GitHub Repository**: [Code-Smell-and-Refactoring-Tool](https://github.com/manankathrecha/Code-Smell-and-Refactoring-Tool)

---

## Dependencies

### Backend
- Python 3.9+
- Flask
- PyTorch
- Transformers (Hugging Face)
- OpenAI Python SDK
- Flask-CORS

Install dependencies using:
```bash
pip install -r requirements.txt
Frontend
Node.js 16+
React
Install frontend dependencies using:

bash
Copy code
npm install
Setup Instructions
Backend Setup
Clone the repository:
bash
Copy code
git clone https://github.com/manankathrecha/Code-Smell-and-Refactoring-Tool.git
cd Code-Smell-and-Refactoring-Tool/backend
Set up the Python virtual environment:
bash
Copy code
python -m venv .venv
source .venv/bin/activate  # For Linux/Mac
.\\.venv\\Scripts\\activate  # For Windows
Install required dependencies:
bash
Copy code
pip install -r requirements.txt
Set the environment variable for the OpenAI API key:
bash
Copy code
export OPENAI_API_KEY=your_openai_api_key  # Linux/Mac
set OPENAI_API_KEY=your_openai_api_key    # Windows
Run the backend server:
bash
Copy code
python app.py
Frontend Setup
Navigate to the frontend directory:
bash
Copy code
cd ../frontend
Install dependencies:
bash
Copy code
npm install
Run the frontend development server:
bash
Copy code
npm start
The application will start.
Testing Instructions
Backend
Setup Postman

Download and Install Postman: Postman Download.
Open Postman and create a new POST request.
Test the /refactor Endpoint

Request Setup:

Method: POST
URL: http://127.0.0.1:5000/refactor
Headers:
Key: Content-Type
Value: application/json
Body:
Select raw format and set it to JSON.
Example JSON Body:
json
Copy code
{
  "code": "def add_numbers(a, b): result = a + b; return result"
}
Send the Request

Click the Send button.
The backend should process the request and return a response.
Expected Response If everything is set up correctly, you should see a JSON response like this:

json
Copy code
{
  "detected_smell": "long method",
  "refactoring_suggestions": "Consider breaking the method into smaller modular functions to improve readability."
}
Frontend
Open the application in the browser.
Paste a sample code snippet in the input field and click the "Analyze Code" button.
Verify that the detected code smell and refactoring suggestions are displayed correctly.
Configuration Files
Backend
requirements.txt: Contains all the dependencies for the backend.
apikey.txt: Contains the API key.
Frontend
package.json: Manages frontend dependencies and scripts.