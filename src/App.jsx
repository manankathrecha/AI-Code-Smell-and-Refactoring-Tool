import React, { useState } from "react";
import './App.css';

function App() {
  const [inputCode, setInputCode] = useState('');
  const [detectedSmell, setDetectedSmell] = useState('');
  const [refactoringSuggestions, setRefactoringSuggestions] = useState('');

  const handleAnalyzeClick = async () => {
    try {
      // Sending the request to Flask backend
      const response = await fetch("http://127.0.0.1:5000/refactor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: inputCode }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze code");
      }

      const data = await response.json();

      if (data.detected_smell && data.refactoring_suggestions) {
        setDetectedSmell(data.detected_smell);
        setRefactoringSuggestions(data.refactoring_suggestions);
      } else {
        setDetectedSmell("No detected smell returned.");
        setRefactoringSuggestions("No refactoring suggestions returned.");
      }
    } catch (error) {
      setDetectedSmell("Error: " + error.message);
      setRefactoringSuggestions("Error: " + error.message);
      console.error(error);
    }
  };

  return (
    <div className="App">
      <h1>Code Smell Detection and Refactoring Tool</h1>

      {/* Textarea for the user to input code */}
      <textarea
        placeholder="Paste your code here..."
        value={inputCode}
        onChange={(e) => setInputCode(e.target.value)}
        rows="10"
        cols="50"
      ></textarea>

      {/* Button to trigger the analyze action */}
      <button onClick={handleAnalyzeClick}>Analyze Code</button>

      {/* Display the detected code smell */}
      <div className="output">
        <h3>Detected Code Smell:</h3>
        <textarea
          readOnly
          value={detectedSmell}
          rows="2"
          cols="50"
        ></textarea>
      </div>

      {/* Display the refactoring suggestions */}
      <div className="output">
        <h3>Refactoring Suggestions:</h3>
        <textarea
          readOnly
          value={refactoringSuggestions}
          rows="10"
          cols="50"
        ></textarea>
      </div>
    </div>
  );
}

export default App;
