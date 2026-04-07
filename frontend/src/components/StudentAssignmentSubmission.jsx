import { useState, useEffect } from "react";
import "./StudentAssignmentSubmission.css";

// Static simulated AI logs (identical for all students)
const SIMULATED_AI_LOGS = [
  {
    tool_name: "ChatGPT",
    description: "Used to brainstorm solution structure for assignment tasks.",
    purpose: "Clarified possible implementation approaches before coding.",
    prompt_text:
      "How should I structure a React component that fetches assignment data and handles submission states?",
    answer_text:
      "Use useEffect for fetching, keep separate loading/error/success states, and submit through an async handler with guarded error handling.",
    duration_minutes: 12,
  },
  {
    tool_name: "GitHub Copilot",
    description: "Used while writing backend route handlers.",
    purpose:
      "Accelerated boilerplate creation and improved consistency in response handling.",
    prompt_text:
      "Generate an Express POST route for assignment submission with validation and JSON responses.",
    answer_text:
      "Provided a route skeleton with required field checks, database insert flow, and 4xx/5xx response patterns.",
    duration_minutes: 8,
  },
  {
    tool_name: "ChatGPT",
    description:
      "Used to review wording and clarity of the final submission text.",
    purpose:
      "Improved readability and confidence in the submitted explanation.",
    prompt_text:
      "Suggest concise wording for explaining implementation tradeoffs in a student assignment submission.",
    answer_text:
      "Use short sections: decision, reason, impact; avoid repeated wording and keep examples concrete.",
    duration_minutes: 5,
  },
];

export default function StudentAssignmentSubmission() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [studentId, setStudentId] = useState("student_001");
  const [submitted, setSubmitted] = useState(false);
  const [generatedLogs, setGeneratedLogs] = useState([]);
  const [manualLogs, setManualLogs] = useState([]);
  const [isReviewingLogs, setIsReviewingLogs] = useState(false);
  const [confirmedAutoLogs, setConfirmedAutoLogs] = useState(
    new Set(SIMULATED_AI_LOGS.map((_, i) => i)),
  );
  const [aiDeclaration, setAiDeclaration] = useState("");
  const [acknowledgedDeclaration, setAcknowledgedDeclaration] = useState(false);

  const [formData, setFormData] = useState({
    ai_logs: [
      {
        tool_name: "",
        description: "",
        purpose: "",
      },
    ],
  });

  // Load assignments on mount
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/assignments");
      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? `Failed to load assignments: ${data}`
            : data.error || "Failed to load assignments",
        );
      }

      if (typeof data === "string") {
        throw new Error("Unexpected response format while loading assignments");
      }

      setAssignments(data);
    } catch (err) {
      console.error("Error loading assignments:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentSelect = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmitted(false);
    setGeneratedLogs([]);
    setManualLogs([]);
    setSuccess("");
    setError("");
    setIsReviewingLogs(false);
    setConfirmedAutoLogs(new Set(SIMULATED_AI_LOGS.map((_, i) => i)));
    setAiDeclaration("");
    setAcknowledgedDeclaration(false);
    setFormData({
      ai_logs: [
        {
          tool_name: "",
          description: "",
          purpose: "",
        },
      ],
    });
  };

  const handleAILogChange = (index, field, value) => {
    const updatedLogs = [...formData.ai_logs];
    updatedLogs[index] = {
      ...updatedLogs[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      ai_logs: updatedLogs,
    }));
  };

  const addAILog = () => {
    setFormData((prev) => ({
      ...prev,
      ai_logs: [
        ...prev.ai_logs,
        {
          tool_name: "",
          description: "",
          purpose: "",
        },
      ],
    }));
  };

  const removeAILog = (index) => {
    if (formData.ai_logs.length > 1) {
      const updatedLogs = formData.ai_logs.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        ai_logs: updatedLogs,
      }));
    }
  };

  const toggleAutoLogConfirmation = (index) => {
    const newConfirmed = new Set(confirmedAutoLogs);
    if (newConfirmed.has(index)) {
      newConfirmed.delete(index);
    } else {
      newConfirmed.add(index);
    }
    setConfirmedAutoLogs(newConfirmed);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate AI declaration is filled
    if (!aiDeclaration.trim()) {
      setError(
        "Please provide an AI declaration summarizing your AI usage for this assignment.",
      );
      return;
    }

    // Show confirmation modal instead of submitting directly
    setIsReviewingLogs(true);
  };

  const handleConfirmAndSubmit = async () => {
    setError("");
    setSuccess("");

    // Validate AI declaration acknowledgment
    if (!acknowledgedDeclaration) {
      setError(
        "Please check the box to acknowledge your AI declaration before submitting.",
      );
      return;
    }

    setIsLoading(true);

    // Validate AI logs if any are being submitted
    const validLogs = formData.ai_logs.filter(
      (log) => log.tool_name && log.tool_name.trim(),
    );
    const shouldConfirmAutoLogs = confirmedAutoLogs.size > 0;

    try {
      const response = await fetch(
        `/api/assignments/${selectedAssignment.id}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: studentId,
            ai_logs: validLogs,
            confirmed_automatic_logs: shouldConfirmAutoLogs,
            ai_declaration: aiDeclaration,
          }),
        },
      );

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? `Failed to submit assignment: ${data}`
            : data.error || "Failed to submit assignment",
        );
      }

      if (typeof data === "string") {
        throw new Error(
          "Unexpected response format while submitting assignment",
        );
      }

      // Separate manual and simulated logs for display
      const manual = data.manual_ai_logs || [];
      const simulated = data.simulated_ai_logs || [];

      setManualLogs(manual);
      setGeneratedLogs(simulated);
      setSuccess(
        `Assignment "${selectedAssignment.title}" submitted successfully. ${manual.length} manual log(s) and ${simulated.length} confirmed AI usage log(s) were included in your submission.`,
      );
      setSubmitted(true);
      setIsReviewingLogs(false);
    } catch (err) {
      console.error("Error submitting assignment:", err);
      setError(err.message);
      setIsReviewingLogs(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedAssignment(null);
    setGeneratedLogs([]);
    setManualLogs([]);
    setError("");
    setSuccess("");
  };

  if (!selectedAssignment) {
    return (
      <div className="student-submission-container">
        <h1>Submit Assignment</h1>

        <div className="student-info">
          <label htmlFor="student-id">Student ID:</label>
          <input
            type="text"
            id="student-id"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="Enter your student ID"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="assignments-grid">
          {isLoading ? (
            <p className="loading">Loading assignments...</p>
          ) : assignments.length === 0 ? (
            <p className="no-content">No assignments available</p>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="assignment-card">
                <h3>{assignment.title}</h3>
                <p className="course-id">Course: {assignment.course_id}</p>
                {assignment.description && (
                  <p className="description">{assignment.description}</p>
                )}
                <button
                  className="submit-button"
                  onClick={() => handleAssignmentSelect(assignment)}
                >
                  Submit Assignment
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Show confirmation modal if reviewing logs
  if (isReviewingLogs) {
    return (
      <div className="student-submission-container">
        <div className="confirmation-modal">
          <div className="confirmation-header">
            <h2>Review & Confirm Automatic AI Usage Logs</h2>
            <p className="confirmation-description">
              These automatic AI usage logs will be attached to your assignment
              submission. Please review them and confirm which ones are relevant
              to your work.
            </p>
          </div>

          <div className="auto-logs-review">
            {SIMULATED_AI_LOGS.map((log, index) => (
              <div key={index} className="log-review-entry">
                <div className="log-review-header">
                  <input
                    type="checkbox"
                    id={`confirm-log-${index}`}
                    checked={confirmedAutoLogs.has(index)}
                    onChange={() => toggleAutoLogConfirmation(index)}
                    className="log-checkbox"
                  />
                  <label
                    htmlFor={`confirm-log-${index}`}
                    className="log-checkbox-label"
                  >
                    <strong>{log.tool_name}</strong>
                    <span className="log-meta">{log.duration_minutes} min</span>
                  </label>
                </div>

                <div className="log-review-content">
                  <p className="log-description">
                    <strong>Context:</strong> {log.description}
                  </p>

                  <div className="interaction-block">
                    <p className="interaction-label">
                      <strong>Prompt:</strong>
                    </p>
                    <p className="interaction-text">{log.prompt_text}</p>
                  </div>

                  <div className="interaction-block">
                    <p className="interaction-label">
                      <strong>Answer:</strong>
                    </p>
                    <p className="interaction-text">{log.answer_text}</p>
                  </div>

                  <p className="log-purpose">
                    <strong>Result:</strong> {log.purpose}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="declaration-review-section">
            <h2>Your AI Declaration</h2>
            <p className="section-description">
              Please review your AI declaration statement below:
            </p>
            <div className="declaration-display">{aiDeclaration}</div>
            <div className="declaration-acknowledgment">
              <label className="acknowledgment-checkbox-label">
                <input
                  type="checkbox"
                  checked={acknowledgedDeclaration}
                  onChange={(e) => setAcknowledgedDeclaration(e.target.checked)}
                  className="acknowledgment-checkbox"
                />
                <span className="acknowledgment-text">
                  I acknowledge that this declaration accurately summarizes my
                  AI usage for this assignment.
                </span>
              </label>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="confirmation-actions">
            <button
              className="cancel-button"
              onClick={() => setIsReviewingLogs(false)}
              disabled={isLoading}
            >
              Back to Edit
            </button>
            <button
              className="submit-button"
              onClick={handleConfirmAndSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Confirm & Submit Assignment"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="student-submission-container">
        <button className="back-button" onClick={handleBackToList}>
          &larr; Back to Assignments
        </button>

        <div className="success-container">
          {success && <div className="success-message">{success}</div>}

          {manualLogs.length > 0 && (
            <div className="logs-container">
              <h2>Your AI Usage Logs</h2>
              <p className="section-description">
                These are the AI usage logs you manually provided.
              </p>

              {manualLogs.map((log) => (
                <div key={log.id} className="log-entry">
                  <p>
                    <strong>Tool:</strong> {log.tool_name}
                  </p>
                  {log.description && (
                    <p>
                      <strong>Context:</strong> {log.description}
                    </p>
                  )}
                  {log.purpose && (
                    <p>
                      <strong>Results:</strong> {log.purpose}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {generatedLogs.length > 0 && (
            <div className="logs-container">
              <h2>Confirmed Automatic AI Usage Logs</h2>
              <p className="section-description">
                These logs were confirmed during submission and included in your
                assignment.
              </p>

              {generatedLogs.map((log) => (
                <div key={log.id} className="log-entry">
                  <p>
                    <strong>Tool:</strong> {log.tool_name}
                  </p>
                  {log.prompt_text && (
                    <p>
                      <strong>Prompt:</strong> {log.prompt_text}
                    </p>
                  )}
                  {log.answer_text && (
                    <p>
                      <strong>Answer:</strong> {log.answer_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <button className="back-button" onClick={handleBackToList}>
            Submit Another Assignment
          </button>
        </div>
      </div>
    );
  }

  // Show form for manual logs and submission
  return (
    <div className="student-submission-container">
      <button className="back-button" onClick={handleBackToList}>
        &larr; Back to Assignments
      </button>

      <div className="submission-header">
        <h1>{selectedAssignment.title}</h1>
        <p className="course-id">Course: {selectedAssignment.course_id}</p>
      </div>

      {selectedAssignment.description && (
        <div className="assignment-description">
          <h3>Description</h3>
          <p>{selectedAssignment.description}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="submission-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-section">
          <div className="ai-logs-header">
            <h2>Manual AI Usage Logs (Optional)</h2>
            <p className="section-description">
              Optionally document any AI tools you used during this assignment.
            </p>
          </div>

          {formData.ai_logs.map((log, index) => (
            <div key={index} className="ai-log-entry">
              <div className="log-number">Log #{index + 1}</div>

              <div className="form-group">
                <label htmlFor={`tool-name-${index}`}>AI Tool Used</label>
                <input
                  type="text"
                  id={`tool-name-${index}`}
                  value={log.tool_name}
                  onChange={(e) =>
                    handleAILogChange(index, "tool_name", e.target.value)
                  }
                  placeholder="e.g., ChatGPT, GitHub Copilot, Claude, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor={`context-${index}`}>Context of Usage</label>
                <textarea
                  id={`context-${index}`}
                  value={log.description}
                  onChange={(e) =>
                    handleAILogChange(index, "description", e.target.value)
                  }
                  placeholder="What was the context? (e.g., debugging code, writing documentation, etc.)"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor={`purpose-${index}`}>Results of Using It</label>
                <textarea
                  id={`purpose-${index}`}
                  value={log.purpose}
                  onChange={(e) =>
                    handleAILogChange(index, "purpose", e.target.value)
                  }
                  placeholder="What were the results? How did the AI tool help? What did you use from the output?"
                  rows="3"
                />
              </div>

              {formData.ai_logs.length > 1 && (
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeAILog(index)}
                >
                  Remove This Log
                </button>
              )}
            </div>
          ))}

          <button type="button" className="add-log-button" onClick={addAILog}>
            + Add Another AI Usage Log
          </button>
        </div>

        <div className="form-section">
          <div className="ai-declaration-section">
            <h2>AI Declaration (Required)</h2>
            <p className="section-description">
              Provide a summary statement of your total AI usage for this
              assignment. This should summarize how you used AI tools, what
              assistance they provided, and how you integrated or evaluated
              their output.
            </p>
            <textarea
              id="ai-declaration"
              className="ai-declaration-input"
              value={aiDeclaration}
              onChange={(e) => setAiDeclaration(e.target.value)}
              placeholder="Example: I used ChatGPT to help structure my code components and GitHub Copilot for code completion. I reviewed all AI-generated suggestions and tested them thoroughly before including them in my work. I also used ChatGPT to help improve my documentation clarity."
              rows="6"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="auto-logs-section">
            <h2>Automatic AI Usage Logs Preview</h2>
            <p className="section-description">
              These automatic AI usage logs will be shown for review when you
              submit your assignment. You will be able to confirm which ones to
              include in your submission.
            </p>

            {SIMULATED_AI_LOGS.map((log, index) => (
              <div key={index} className="simulated-log-display">
                <div className="log-header">
                  <strong>{log.tool_name}</strong>
                  <span className="log-meta">{log.duration_minutes} min</span>
                </div>

                <div className="log-content">
                  <p className="log-description">
                    <strong>Context:</strong> {log.description}
                  </p>

                  <div className="interaction-block">
                    <p className="interaction-label">
                      <strong>Prompt:</strong>
                    </p>
                    <p className="interaction-text">{log.prompt_text}</p>
                  </div>

                  <div className="interaction-block">
                    <p className="interaction-label">
                      <strong>Answer:</strong>
                    </p>
                    <p className="interaction-text">{log.answer_text}</p>
                  </div>

                  <p className="log-purpose">
                    <strong>Result:</strong> {log.purpose}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? "Processing..." : "Review & Confirm Logs"}
        </button>
      </form>
    </div>
  );
}
