import { useState, useEffect } from 'react';
import './StudentAssignmentSubmission.css';

export default function StudentAssignmentSubmission() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentId, setStudentId] = useState('student_001');
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    ai_logs: [
      {
        tool_name: '',
        description: '',
        purpose: ''
      }
    ]
  });

  // Load assignments on mount
  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/assignments');
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof data === 'string'
            ? `Failed to load assignments: ${data}`
            : (data.error || 'Failed to load assignments')
        );
      }

      if (typeof data === 'string') {
        throw new Error('Unexpected response format while loading assignments');
      }

      setAssignments(data);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignmentSelect = (assignment) => {
    setSelectedAssignment(assignment);
    setSubmitted(false);
    setSuccess('');
    setError('');
    setFormData({
      ai_logs: [
        {
          tool_name: '',
          description: '',
          purpose: ''
        }
      ]
    });
  };

  const handleAILogChange = (index, field, value) => {
    const updatedLogs = [...formData.ai_logs];
    updatedLogs[index] = {
      ...updatedLogs[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      ai_logs: updatedLogs
    }));
  };

  const addAILog = () => {
    setFormData(prev => ({
      ...prev,
      ai_logs: [
        ...prev.ai_logs,
        {
          tool_name: '',
          description: '',
          purpose: ''
        }
      ]
    }));
  };

  const removeAILog = (index) => {
    if (formData.ai_logs.length > 1) {
      const updatedLogs = formData.ai_logs.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        ai_logs: updatedLogs
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate AI logs
    const validLogs = formData.ai_logs.filter(log => log.tool_name && log.tool_name.trim());
    if (validLogs.length === 0) {
      setError('At least one AI usage log with tool name is required');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          student_id: studentId,
          ai_logs: formData.ai_logs
        })
      });

      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        throw new Error(
          typeof data === 'string'
            ? `Failed to submit assignment: ${data}`
            : (data.error || 'Failed to submit assignment')
        );
      }

      if (typeof data === 'string') {
        throw new Error('Unexpected response format while submitting assignment');
      }

      setSuccess(`Assignment "${selectedAssignment.title}" submitted successfully with ${data.ai_logs.length} AI usage log(s)!`);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToList = () => {
    setSelectedAssignment(null);
    setError('');
    setSuccess('');
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
            assignments.map(assignment => (
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

      {submitted ? (
        <div className="success-container">
          {success && <div className="success-message">{success}</div>}
          <button className="back-button" onClick={handleBackToList}>
            Submit Another Assignment
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="submission-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-section">
            <div className="ai-logs-header">
              <h2>AI Usage Logs</h2>
              <p className="section-description">
                Document all AI tools you used during this assignment. This helps track your AI usage.
              </p>
            </div>

            {formData.ai_logs.map((log, index) => (
              <div key={index} className="ai-log-entry">
                <div className="log-number">Log #{index + 1}</div>

                <div className="form-group">
                  <label htmlFor={`tool-name-${index}`}>AI Tool Used *</label>
                  <input
                    type="text"
                    id={`tool-name-${index}`}
                    value={log.tool_name}
                    onChange={(e) => handleAILogChange(index, 'tool_name', e.target.value)}
                    placeholder="e.g., ChatGPT, GitHub Copilot, Claude, etc."
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`context-${index}`}>Context of Usage</label>
                  <textarea
                    id={`context-${index}`}
                    value={log.description}
                    onChange={(e) => handleAILogChange(index, 'description', e.target.value)}
                    placeholder="What was the context? (e.g., debugging code, writing documentation, etc.)"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`purpose-${index}`}>Results of Using It</label>
                  <textarea
                    id={`purpose-${index}`}
                    value={log.purpose}
                    onChange={(e) => handleAILogChange(index, 'purpose', e.target.value)}
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

            <button
              type="button"
              className="add-log-button"
              onClick={addAILog}
            >
              + Add Another AI Usage Log
            </button>
          </div>

          <button type="submit" disabled={isLoading} className="submit-button">
            {isLoading ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </form>
      )}
    </div>
  );
}
