import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './css/app.css'
import './css/auth.css'
import './css/admin.css'
import './css/ballot.css'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Ballot from './pages/Ballot'
import Review from './pages/Review'
import ThankYou from './pages/ThankYou'
import AdminDashboard from './pages/AdminDashboard'

// Components
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const [voter, setVoter] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [selections, setSelections] = useState({})

  useEffect(() => {
    // Check for stored voter session
    const storedVoter = sessionStorage.getItem('voter')
    if (storedVoter) {
      setVoter(JSON.parse(storedVoter))
    }

    // Check for stored admin session
    const storedAdmin = sessionStorage.getItem('admin')
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin))
    }
  }, [])

  const handleVoterLogin = (voterData) => {
    setVoter(voterData)
    sessionStorage.setItem('voter', JSON.stringify(voterData))
  }

  const handleAdminLogin = (adminData) => {
    setAdmin(adminData)
    sessionStorage.setItem('admin', JSON.stringify(adminData))
  }

  const handleLogout = () => {
    setVoter(null)
    setAdmin(null)
    setSelections({})
    sessionStorage.removeItem('voter')
    sessionStorage.removeItem('admin')
  }

  return (
    <div className="app">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route 
          path="/login" 
          element={<Login onLogin={handleVoterLogin} onAdminLogin={handleAdminLogin} />} 
        />

        {/* Protected Voter Routes */}
        <Route
          path="/ballot"
          element={
            <ProtectedRoute isAllowed={!!voter && !voter.has_voted}>
              <Ballot 
                voter={voter} 
                selections={selections}
                setSelections={setSelections}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/review"
          element={
            <ProtectedRoute isAllowed={!!voter && !voter.has_voted}>
              <Review 
                voter={voter}
                selections={selections}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/thank-you"
          element={
            <ProtectedRoute isAllowed={!!voter}>
              <ThankYou onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute isAllowed={!!admin}>
              <AdminDashboard admin={admin} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
