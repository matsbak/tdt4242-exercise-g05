import { useState } from 'react'
import './App.css'
import Navigation from './components/Navigation'
import CreateAssignment from './components/CreateAssignment'
import InstructorDashboard from './components/InstructorDashboard'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <>
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="app-main">
        {currentPage === 'dashboard' && <InstructorDashboard />}
        {currentPage === 'create' && <CreateAssignment />}
      </main>
    </>
  )
}

export default App
