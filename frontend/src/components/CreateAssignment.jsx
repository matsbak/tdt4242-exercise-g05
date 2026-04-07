import { useState } from "react";
import "./CreateAssignment.css";

export default function CreateAssignment() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    course_id: "",
    require_extra_ai_logs: false,
    require_extra_declarations: false,
    extra_ai_logs_content: "",
    extra_declarations_content: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    // Validate required fields
    if (!formData.title.trim()) {
      setError("Assignment title is required");
      setIsLoading(false);
      return;
    }

    if (!formData.course_id.trim()) {
      setError("Course ID is required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          created_by: "instructor_user", // In a real app, this would come from auth
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create assignment");
      }

      const data = await response.json();
      setSuccess(`Assignment "${data.title}" created successfully!`);

      // Reset form
      setFormData({
        title: "",
        description: "",
        course_id: "",
        require_extra_ai_logs: false,
        require_extra_declarations: false,
        extra_ai_logs_content: "",
        extra_declarations_content: "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-assignment-container">
      <h1>Create Assignment</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="assignment-form">
        <div className="form-group">
          <label htmlFor="title">Assignment Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Enter assignment title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter assignment description"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="course_id">Course ID *</label>

          <input
            type="text"
            id="course_id"
            name="course_id"
            value={formData.course_id}
            onChange={handleInputChange}
            placeholder="e.g., TDT4242"
          />
        </div>

        <div className="form-section">
          <h2>AI Usage Requirements</h2>
          <p className="section-description">
            Configure whether students should provide additional information
            beyond institutional policy requirements.
          </p>

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="require_extra_ai_logs"
              name="require_extra_ai_logs"
              checked={formData.require_extra_ai_logs}
              onChange={handleInputChange}
            />
            <label htmlFor="require_extra_ai_logs">
              Require Extra AI Usage Logs Content
            </label>
          </div>

          {formData.require_extra_ai_logs && (
            <div className="form-group">
              <label htmlFor="extra_ai_logs_content">
                Additional AI Logs Requirements
              </label>
              <textarea
                id="extra_ai_logs_content"
                name="extra_ai_logs_content"
                value={formData.extra_ai_logs_content}
                onChange={handleInputChange}
                placeholder="Describe any additional requirements for AI usage logs (e.g., 'Include model version numbers', 'Specify alternative approaches considered')"
                rows="4"
              />
            </div>
          )}

          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="require_extra_declarations"
              name="require_extra_declarations"
              checked={formData.require_extra_declarations}
              onChange={handleInputChange}
            />
            <label htmlFor="require_extra_declarations">
              Require Extra AI Declaration Content
            </label>
          </div>

          {formData.require_extra_declarations && (
            <div className="form-group">
              <label htmlFor="extra_declarations_content">
                Additional Declaration Requirements
              </label>
              <textarea
                id="extra_declarations_content"
                name="extra_declarations_content"
                value={formData.extra_declarations_content}
                onChange={handleInputChange}
                placeholder="Describe any additional requirements for AI declarations (e.g., 'Include ethical considerations', 'Explain how this relates to course learning objectives')"
                rows="4"
              />
            </div>
          )}
        </div>

        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? "Creating Assignment..." : "Create Assignment"}
        </button>
      </form>
    </div>
  );
}
