# Code Smell and Refactoring Tool

## Overview

This project is a **Code Smell and Refactoring Tool** designed to:
- Detect code smells such as **Data Class**, **Blob**, **Long Method**, and **Feature Envy**.
- Provide automated refactoring suggestions to improve code quality.
- Collect and analyze user feedback for insights and further improvement.

The project comprises a backend implemented using Flask with a Hugging Face model and OpenAI API, and a React-based frontend.

**GitHub Repository:** [Code-Smell-and-Refactoring-Tool](https://github.com/manankathrecha/Code-Smell-and-Refactoring-Tool)

---

## Dependencies

### General Requirements
- **Backend**
  - Python 3.9+
  - Flask
  - PyTorch
  - Transformers (Hugging Face)
  - OpenAI Python SDK
  - Flask-CORS
- **Frontend**
  - Node.js 16+
  - React

---

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/manankathrecha/Code-Smell-and-Refactoring-Tool.git
   cd Code-Smell-and-Refactoring-Tool cd backend

2.	**Backend Setup**:
-**Navigate to the backend directory**:
   ```
  	cd backend
   ```
-	**Set up a Python virtual environment**:
   ```
  	python -m venv .venv
   source .venv/bin/activate  # For Linux/Mac
   .\.venv\Scripts\activate   # For Windows
```
-	Install backend dependencies:
```pip install -r requirements.txt```
-	Set the environment variable for the OpenAI API key:
    - Linux/Mac: export OPENAI_API_KEY=your_openai_api_key
    - Windows: set OPENAI_API_KEY=your_openai_api_key
- Run the backend server:
```python app.py```
3.	Frontend Setup:
   - Navigate to the frontend directory:
```cd ../frontend```
   - Install frontend dependencies:
```npm install```
   - Run the frontend development server:
```npm start```
4.	The application will start and can be accessed in your browser.
________________________________________
Testing Instructions
1.	Backend Testing:
   - Set up Postman:
      - Download and Install Postman: Postman Download.
      - Open Postman and create a new POST request.
   - Test the /refactor endpoint:
   - Request Setup:
   - Method: ```POST```
   - URL: ```http://127.0.0.1:5000/refactor```
   - Headers:
      - Key: ```Content-Type```
      - Value: ```application/json```
   - Body:
      - Select raw format and set it to JSON.
      - Example JSON Body:
      ```
      {
        "code": "def add_numbers(a, b): result = a + b; return result"
      }
      ```
   - Send the Request: Click the Send button.
   - Expected Response: If everything is set up correctly, you should see a JSON response.
2.	Frontend Testing:
   - Open the application in the browser.
   - Paste a sample code snippet in the input field and click the "Analyze Code" button.
   - Verify that the detected code smells and refactoring suggestions are displayed correctly.
________________________________________
Configuration Files
•	Backend:
   - ```requirements.txt```: Contains all the dependencies for the backend.
•	Frontend:
   - ```package.json```: Manages frontend dependencies and scripts.

