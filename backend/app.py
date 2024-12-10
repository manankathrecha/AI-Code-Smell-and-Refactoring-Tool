from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import BertTokenizer, BertForSequenceClassification
import os
import openai  # Import OpenAI API

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# OpenAI API key setup
openai.api_key = "*"
# Load the tokenizer and trained model
MODEL_PATH = "code_smell_detection_model.pth"
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

# Define the number of classes (update this based on your trained model)
num_classes = 4  # Adjust according to your dataset
model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=num_classes)

# Load the trained model weights
if os.path.exists(MODEL_PATH):
    model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
    model.eval()  # Set model to evaluation mode
    print("Model loaded successfully!")
else:
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

# Define the smell categories (update based on your mappings)
smell_mapping = {0: "data class", 1: "blob", 2: "long method", 3: "feature envy"}

# Function to get refactoring suggestions
def get_refactoring_suggestions(code: str):
    prompt = f"Given the following Python code, provide suggestions for improving code quality, readability, and performance. Explain why these changes are beneficial. \n\nCode:\n{code}\n\nRefactoring suggestions:"

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4-0613",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=150,
            n=1
        )
        return response.choices[0].message['content'].strip()
    except Exception as e:
        return f"Error generating refactoring suggestions: {str(e)}"

@app.route("/refactor", methods=["POST"])
def refactor_code():
    try:
        data = request.get_json()
        input_code = data.get("code")

        if not input_code:
            return jsonify({"error": "No code provided"}), 400

        # Tokenize the input code
        inputs = tokenizer(input_code, return_tensors="pt", max_length=512, truncation=True, padding="max_length")

        # Perform inference
        with torch.no_grad():
            outputs = model(inputs["input_ids"], attention_mask=inputs["attention_mask"])
            predictions = torch.argmax(outputs.logits, dim=1)
            detected_smell = smell_mapping[int(predictions.item())]

        # Get refactoring suggestions
        refactoring_suggestions = get_refactoring_suggestions(input_code)

        return jsonify({
            "detected_smell": detected_smell,
            "refactoring_suggestions": refactoring_suggestions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
