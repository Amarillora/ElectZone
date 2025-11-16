import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function ThankYou({ onLogout }) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    // Countdown timer
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Auto logout after 10 seconds
    const timer = setTimeout(() => {
      handleLogout()
    }, 10000)

    return () => {
      clearTimeout(timer)
      clearInterval(countInterval)
    }
  }, [])

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  return (
    <div className="thankyou-container">
      <div className="thankyou-card">
        <div className="success-checkmark">
          <div className="check-icon-circle">
            <span className="check-icon">✓</span>
          </div>
        </div>
        
        <h1 className="thankyou-title">Thank You for Voting!</h1>
        
        <p className="thankyou-message">
          Your vote has been successfully recorded and encrypted.
        </p>

        <div className="thankyou-info-grid">
          <div className="info-item">
            <span className="info-item-icon">🔒</span>
            <div className="info-item-text">
              <h3>Secure & Anonymous</h3>
              <p>Your vote cannot be traced back to you</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-item-icon">✅</span>
            <div className="info-item-text">
              <h3>Successfully Recorded</h3>
              <p>Your selections have been saved</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-item-icon">📊</span>
            <div className="info-item-text">
              <h3>Results Coming Soon</h3>
              <p>Available after election closes</p>
            </div>
          </div>
        </div>
        
        <div className="thankyou-actions">
          <button onClick={handleLogout} className="btn btn-primary btn-large btn-thankyou">
            Return to Home
          </button>
        </div>

        <div className="auto-logout-notice">
          <span className="countdown-circle">{countdown}</span>
          <p>Automatically returning to home in {countdown} second{countdown !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  )
}

export default ThankYou
