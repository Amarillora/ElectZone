import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { electionService } from '../services/supabaseAPI'

function Home() {
  const [activeElection, setActiveElection] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadActiveElection()
  }, [])

  const loadActiveElection = async () => {
    try {
      const { data, error } = await electionService.getActiveElection()
      if (!error && data) {
        setActiveElection(data)
      }
    } catch (err) {
      console.error('Error loading election:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="home-container">
      <header className="hero-section">
        <div className="hero-icon">🗳️</div>
        <h1 className="hero-title">Welcome to ElectZone</h1>
        <p className="hero-subtitle">
          Your secure and transparent school e-voting platform
        </p>
      </header>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading election information...</p>
        </div>
      ) : activeElection ? (
        <section className="election-info-box">
          <h2>{activeElection.title}</h2>
          <div className="election-details">
            <div className="detail-item">
              <span className="detail-label">Start:</span>
              <span className="detail-value">{new Date(activeElection.start_at).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">End:</span>
              <span className="detail-value">{new Date(activeElection.end_at).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="badge badge-success">{activeElection.status}</span>
            </div>
          </div>
          <div className="vote-button-container">
            <Link to="/login" className="btn btn-primary btn-large">
              Vote Now
            </Link>
          </div>
        </section>
      ) : (
        <section className="election-info-box info-box-inactive">
          <p>No active elections at the moment. Please check back later.</p>
        </section>
      )}

      <section className="features-section">
        <h2 className="section-title">Why ElectZone?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure</h3>
            <p>Your vote is encrypted and anonymized to protect your privacy</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast</h3>
            <p>Cast your vote in seconds with our streamlined interface</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Transparent</h3>
            <p>Real-time results and complete audit trails</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Verified</h3>
            <p>Only eligible voters can participate in elections</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
