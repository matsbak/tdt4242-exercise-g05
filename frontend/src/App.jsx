import { useState } from 'react'
import './App.css'
import Navigation from './components/Navigation'
import CreateAssignment from './components/CreateAssignment'
import InstructorDashboard from './components/InstructorDashboard'
import StudentAssignmentSubmission from './components/StudentAssignmentSubmission'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <>
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="app-main">
        {currentPage === 'dashboard' && <InstructorDashboard />}
        {currentPage === 'create' && <CreateAssignment />}
        {currentPage === 'submit' && <StudentAssignmentSubmission />}
      </main>
    </>
  )
}

export default App
