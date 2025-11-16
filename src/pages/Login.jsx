import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/supabaseAPI'

function Login({ onLogin, onAdminLogin }) {
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Check if admin login
      if (studentId === 'ADmin69') {
        const adminData = {
          email: 'admin@electzone.edu',
          role: 'admin',
          id: 'admin-001'
        }
        onAdminLogin(adminData)
        navigate('/admin/dashboard')
        setLoading(false)
        return
      }

      // Regular voter login
      const { data: voter, error: verifyError } = await authService.verifyVoter(studentId)

      if (verifyError || !voter) {
        setError('Invalid student ID or you are not registered to vote')
        setLoading(false)
        return
      }

      if (voter.has_voted) {
        setError('You have already cast your vote. Thank you for participating!')
        setLoading(false)
        return
      }

      // Login successful
      onLogin(voter)
      navigate('/ballot')
    } catch (err) {
      setError('An error occurred during login. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-split-container">
        {/* Left Panel - Branding */}
        <div className="auth-brand-panel">
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-icon">🗳️</span>
              <span className="logo-text">ElectZone</span>
            </div>
            
            <div className="brand-welcome">
              <h1>Welcome to Your Voice</h1>
              <p>Your vote matters. Join thousands of students making their voices heard in our democratic process.</p>
            </div>

            <div className="brand-features">
              <div className="brand-feature">
                <span className="feature-icon">🔒</span>
                <div>
                  <h4>Secure & Private</h4>
                  <p>Your vote is encrypted and completely anonymous</p>
                </div>
              </div>
              <div className="brand-feature">
                <span className="feature-icon">⚡</span>
                <div>
                  <h4>Fast & Simple</h4>
                  <p>Vote in seconds with our intuitive interface</p>
                </div>
              </div>
              <div className="brand-feature">
                <span className="feature-icon">✅</span>
                <div>
                  <h4>Verified & Trusted</h4>
                  <p>Only registered students can participate</p>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              <p>Empowering student democracy since 2025</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="auth-form-panel">
          <div className="form-content">
            <div className="form-header">
              <h2>Login</h2>
              <p>Enter your Student ID</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="studentId">Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g., 2021001"
                  required
                  disabled={loading}
                  className="form-input"
                />
                <span className="form-hint">Enter your registered student ID or admin code</span>
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary btn-full">
                {loading ? (
                  <>
                    <span className="btn-spinner"></span>
                    Verifying...
                  </>
                ) : (
                  'LOGIN'
                )}
              </button>
            </form>

            <div className="form-links">
              <p className="help-text">Problems logging in? Contact the election administrator.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
