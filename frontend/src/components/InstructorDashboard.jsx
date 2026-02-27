import { useState, useEffect } from 'react';
import './InstructorDashboard.css';

export default function InstructorDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // In a real application, you would fetch assignments for the current instructor's courses
  const loadAssignments = async (courseId = '') => {
    setIsLoading(true);
    setError('');

    try {
      // Fetch assignments - if courseId is provided, filter by course, otherwise get all
      let url = '/api/assignments';
      if (courseId.trim()) {
        url = `/api/assignments/course/${courseId}`;
        console.log('Fetching assignments from API for course:', courseId);
      } else {
        console.log('Fetching all assignments from API');
      }

      const response = await fetch(url);

      console.log('API response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to load assignments');
      }

      const data = await response.json();
      console.log('Loaded assignments:', data);
      setAssignments(data);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load assignments on component mount
  useEffect(() => {
    console.log('Dashboard mounted, loading all assignments');
    loadAssignments('');
  }, []);

  const handleCourseFilterChange = (e) => {
    const newCourse = e.target.value;
    setCourseFilter(newCourse);
    loadAssignments(newCourse);
  };

  const handleRefresh = () => {
    loadAssignments(courseFilter);
  };

  return (
    <div className="instructor-dashboard">
      <h1>Instructor Dashboard</h1>

      <div className="dashboard-section">
        <div className="dashboard-header">
          <h2>Manage Assignments</h2>
          <button 
            className="refresh-button" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="course-filter">
          <label htmlFor="course-select">Filter by Course:</label>
          <div className="filter-input-group">
            <input
              type="text"
              id="course-select"
              value={courseFilter}
              onChange={handleCourseFilterChange}
              placeholder="Enter course ID (e.g., TDT4242)"
            />
            {courseFilter && (
              <button 
                className="clear-filter-button"
                onClick={() => {
                  setCourseFilter('');
                  loadAssignments('');
                }}
              >
                Clear Filter
              </button>
            )}
          </div>
          <p className="filter-status">
            {courseFilter ? `Showing assignments for ${courseFilter}` : 'Showing all assignments'}
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="assignments-list">
          {assignments.length === 0 ? (
            <p className="no-content">
              {courseFilter 
                ? `No assignments found for course "${courseFilter}". Create one or try a different course.`
                : 'No assignments yet. Create one to get started!'
              }
            </p>
          ) : (
            assignments.map(assignment => (
              <div key={assignment.id} className="assignment-card">
                <h3>{assignment.title}</h3>
                <p className="course-id">Course: {assignment.course_id}</p>
                {assignment.description && (
                  <p className="description">{assignment.description}</p>
                )}
                {(assignment.require_extra_ai_logs === 1 || assignment.require_extra_declarations === 1) && (
                  <div className="requirements">
                    {assignment.require_extra_ai_logs === 1 && assignment.extra_ai_logs_content && (
                      <div className="requirement-item">
                        <span className="badge">Extra AI Logs Required</span>
                        <p className="requirement-description">{assignment.extra_ai_logs_content}</p>
                      </div>
                    )}
                    {assignment.require_extra_declarations === 1 && assignment.extra_declarations_content && (
                      <div className="requirement-item">
                        <span className="badge">Extra Declarations Required</span>
                        <p className="requirement-description">{assignment.extra_declarations_content}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
