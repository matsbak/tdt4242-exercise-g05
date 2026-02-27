import './Navigation.css';

export default function Navigation({ currentPage, onNavigate }) {
  return (
    <nav className="navigation">
      <div className="nav-container">
        <h1 className="app-title">AI Guidebook</h1>
        <ul className="nav-links">
          <li>
            <button
              className={`nav-button ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              className={`nav-button ${currentPage === 'create' ? 'active' : ''}`}
              onClick={() => onNavigate('create')}
            >
              Create Assignment
            </button>
          </li>
          <li>
            <button
              className={`nav-button ${currentPage === 'submit' ? 'active' : ''}`}
              onClick={() => onNavigate('submit')}
            >
              Submit Assignment
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
