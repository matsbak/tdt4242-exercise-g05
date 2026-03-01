import { useState, useEffect } from 'react';
import './ViewStudentLogs.css';

export default function ViewStudentLogs({ assignmentId, onClose }) {
  const [studentLogs, setStudentLogs] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [filterStudentId, setFilterStudentId] = useState('');

  useEffect(() => {
    loadStudentLogs();
  }, [assignmentId]);

  const loadStudentLogs = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/assignments/${assignmentId}/student-logs`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details 
          ? `${errorData.error} - ${errorData.details}`
          : (errorData.error || 'Failed to load student logs');
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setStudentLogs(data);
    } catch (err) {
      console.error('Error loading student logs:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="view-student-logs-container">
        <div className="logs-header">
          <button className="close-button" onClick={onClose}>↑ Back to Dashboard</button>
        </div>
        <div className="loading-message">Loading student logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="view-student-logs-container">
        <div className="logs-header">
          <button className="close-button" onClick={onClose}>↑ Back to Dashboard</button>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!studentLogs) {
    return (
      <div className="view-student-logs-container">
        <div className="logs-header">
          <button className="close-button" onClick={onClose}>↑ Back to Dashboard</button>
        </div>
        <div className="no-logs">No data available</div>
      </div>
    );
  }

  const filteredSubmissions = filterStudentId
    ? studentLogs.student_submissions.filter(
        (s) => s.student_id.toLowerCase().includes(filterStudentId.toLowerCase())
      )
    : studentLogs.student_submissions;

  return (
    <div className="view-student-logs-container">
      <div className="logs-header">
        <div className="header-content">
          <button className="close-button" onClick={onClose}>↑ Back to Dashboard</button>
          <h2>{studentLogs.assignment.title} - Student AI Logs & Declarations</h2>
          <p className="assignment-info">
            Course: {studentLogs.assignment.course_id} | Total Submissions: {studentLogs.total_submissions}
          </p>
        </div>
      </div>

      <div className="logs-filter">
        <input
          type="text"
          placeholder="Filter by student ID..."
          value={filterStudentId}
          onChange={(e) => setFilterStudentId(e.target.value)}
          className="filter-input"
        />
        {filterStudentId && (
          <button
            className="clear-filter-btn"
            onClick={() => setFilterStudentId('')}
          >
            Clear Filter
          </button>
        )}
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="no-logs">
          {filterStudentId 
            ? 'No submissions found for the selected filter.' 
            : 'No submissions found for this assignment.'}
        </div>
      ) : (
        <div className="student-logs-list">
          {filteredSubmissions.map((studentData) => (
            <div key={studentData.student_id} className="student-log-card">
              <div
                className="student-header"
                onClick={() =>
                  setExpandedStudent(
                    expandedStudent === studentData.student_id
                      ? null
                      : studentData.student_id
                  )
                }
              >
                <div className="student-title">
                  <span className="student-id">{studentData.student_id}</span>
                  <span className="submission-status">
                    {studentData.submission ? '• Submitted' : '• Not Submitted'}
                  </span>
                </div>
                <span className="expand-icon">
                  {expandedStudent === studentData.student_id ? '▼' : '▶'}
                </span>
              </div>

              {expandedStudent === studentData.student_id && (
                <div className="student-details">
                  {/* Submission Section */}
                  {studentData.submission && (
                    <div className="submission-section">
                      <h4>Submission</h4>
                      <div className="submission-content">
                        <p className="submitted-date">
                          Submitted: {new Date(studentData.submission.submitted_at).toLocaleString()}
                        </p>
                        {studentData.submission.submission_text && (
                          <div className="submission-text">
                            <p className="label">Submission Text:</p>
                            <p className="text-content">{studentData.submission.submission_text}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Declaration Section */}
                  {studentData.ai_declaration && (
                    <div className="declaration-section">
                      <h4>AI Declaration</h4>
                      <div className="declaration-content">
                        <p className="declaration-text">
                          {studentData.ai_declaration.declaration_text}
                        </p>
                        <p className="declaration-date">
                          Declared: {new Date(studentData.ai_declaration.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Manual AI Logs Section */}
                  {studentData.manual_ai_logs && studentData.manual_ai_logs.length > 0 && (
                    <div className="manual-logs-section">
                      <h4>Manual AI Logs ({studentData.manual_ai_logs.length})</h4>
                      <div className="logs-list">
                        {studentData.manual_ai_logs.map((log, index) => (
                          <div key={log.id} className="log-entry">
                            <div className="log-header">
                              <span className="log-number">#{index + 1}</span>
                              <span className="tool-name">{log.tool_name}</span>
                              <span className="log-type-badge manual">Manual</span>
                            </div>
                            {log.description && (
                              <div className="log-detail">
                                <span className="label">Description:</span>
                                <span className="value">{log.description}</span>
                              </div>
                            )}
                            {log.purpose && (
                              <div className="log-detail">
                                <span className="label">Purpose:</span>
                                <span className="value">{log.purpose}</span>
                              </div>
                            )}
                            <div className="log-date">
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Simulated AI Logs Section */}
                  {studentData.simulated_ai_logs && studentData.simulated_ai_logs.length > 0 && (
                    <div className="simulated-logs-section">
                      <h4>Simulated AI Logs ({studentData.simulated_ai_logs.length})</h4>
                      <div className="logs-list">
                        {studentData.simulated_ai_logs.map((log, index) => (
                          <div key={log.id} className="log-entry simulated">
                            <div className="log-header">
                              <span className="log-number">#{index + 1}</span>
                              <span className="tool-name">{log.tool_name}</span>
                              <span className="log-type-badge simulated">Simulated</span>
                            </div>
                            {log.description && (
                              <div className="log-detail">
                                <span className="label">Description:</span>
                                <span className="value">{log.description}</span>
                              </div>
                            )}
                            {log.purpose && (
                              <div className="log-detail">
                                <span className="label">Purpose:</span>
                                <span className="value">{log.purpose}</span>
                              </div>
                            )}
                            {log.prompt_text && (
                              <div className="log-detail">
                                <span className="label">Prompt:</span>
                                <span className="value">{log.prompt_text}</span>
                              </div>
                            )}
                            {log.answer_text && (
                              <div className="log-detail">
                                <span className="label">Answer:</span>
                                <span className="value">{log.answer_text}</span>
                              </div>
                            )}
                            {log.duration_minutes && (
                              <div className="log-detail">
                                <span className="label">Duration:</span>
                                <span className="value">{log.duration_minutes} minutes</span>
                              </div>
                            )}
                            <div className="log-date">
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No logs section */}
                  {(!studentData.manual_ai_logs || studentData.manual_ai_logs.length === 0) &&
                    (!studentData.simulated_ai_logs || studentData.simulated_ai_logs.length === 0) && (
                      <div className="no-logs-message">
                        No AI logs recorded for this student.
                      </div>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
