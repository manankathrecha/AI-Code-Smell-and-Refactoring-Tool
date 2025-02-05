import React, { useState, useCallback } from "react";
import './App.css';

function App() {
  const [inputCode, setInputCode] = useState('');
  const [detectedSmell, setDetectedSmell] = useState('');
  const [refactoringSuggestions, setRefactoringSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyzeClick = useCallback(async () => {
    if (!inputCode.trim()) {
      setError("Please enter some code to analyze.");
      return;
    }

    setLoading(true);
    setError(''); // Clear previous errors

    try {
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
      console.error("Error:", error);
      setError("An error occurred. Please try again later.");
      setDetectedSmell("Error: " + error.message);
      setRefactoringSuggestions("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [inputCode]);

  return (
    <div className="App">
      {/* Left Side: Code Input and Detected Smell */}
      <div className="left-side">
        <h1>Code Smell Detector</h1>
        <p className="subtitle">Paste your code below to detect code smells and get refactoring suggestions.</p>

        <textarea
          placeholder="Paste your code here..."
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          rows="10"
        ></textarea>

        <button onClick={handleAnalyzeClick} disabled={loading} className={loading ? "analyze-button loading" : "analyze-button"}>
          {loading ? (
            <div className="spinner"></div>
          ) : (
            "Analyze Code"
          )}
        </button>

        {error && <p className="error">{error}</p>}

        {/* Detected Code Smell */}
        <div className="detected-smell">
          <h2>Detected Code Smell</h2>
          <div className="output-content">
            {detectedSmell || "No code smell detected yet."}
          </div>
        </div>
      </div>

      {/* Right Side: Refactoring Suggestions */}
      <div className="right-side">
        <h2>Refactoring Suggestions</h2>
        <div className="output-content">
          {refactoringSuggestions || "Refactoring suggestions will appear here after analysis."}
        </div>
      </div>
    </div>
  );
}

export default App;