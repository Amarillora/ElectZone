import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // For demo purposes - replace with actual admin authentication
      // In production, use proper password hashing and verification
      if (email === 'admin@electzone.com' && password === 'admin123') {
        const adminData = {
          id: '1',
          email: email,
          role: 'admin'
        }
        onLogin(adminData)
        navigate('/admin/dashboard')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred during login')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Admin Login</h1>
        <p className="auth-subtitle">Access the election dashboard</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@electzone.com"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="demo-credentials">
            <strong>Demo credentials:</strong><br />
            Email: admin@electzone.com<br />
            Password: admin123
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
