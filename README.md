# Code Smell and Refactoring Tool

## Overview

This tool is designed to help developers identify and refactor code smells in their software projects. It supports detection of common code smells like Data Class, Blob, Long Method, and Feature Envy and offers automated suggestions for improvements.

### Features

- *Code Smell Detection:* Automatically detects various code smells in your codebase.
- *Automated Refactoring Suggestions:* Provides suggestions to refactor detected code smells.
- *User Feedback Analysis:* Collects and analyzes feedback for continuous tool improvement.

## Technologies

- *Backend:* Flask, PyTorch, Hugging Face Transformers, OpenAI Python SDK, Flask-CORS
- *Frontend:* React

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+

### Installation

#### Backend

1. Clone the repository:
   ```bash
   git clone https://github.com/manankathrecha/Code-Smell-and-Refactoring-Tool.git
   cd Code-Smell-and-Refactoring-Tool/backend
Setup the Python virtual environment:

bash
Copy code
python -m venv .venv
source .venv/bin/activate # Linux/Mac
.\.venv\Scripts\activate # Windows
Install dependencies:

bash
Copy code
pip install -r requirements.txt
Set your OpenAI API key:

bash
Copy code
export OPENAI_API_KEY=your_openai_api_key # Linux/Mac
set OPENAI_API_KEY=your_openai_api_key # Windows
Run the backend server:

bash
Copy code
python app.py
Frontend
Navigate to the frontend directory:

bash
Copy code
cd ../frontend
Install dependencies:

bash
Copy code
npm install
Start the frontend development server:

bash
Copy code
npm start
Usage
For backend testing, set up a POST request to http://127.0.0.1:5000/refactor with your code sample as JSON. For frontend usage, simply input the code into the provided field and evaluate it.

Contributing
Contributions are welcome! Please feel free to submit pull requests or create issues for bugs and feature requests.

License
Distributed under the MIT License. See LICENSE for more information.

vbnet
Copy code

Feel free to adjust the content according to your specific needs or let me know if you need additional sections or modifications!
