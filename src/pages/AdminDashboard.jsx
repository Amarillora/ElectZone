import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  electionService, 
  candidateService, 
  voterService, 
  resultsService,
  realtimeService 
} from '../services/supabaseAPI'
import { supabase } from '../supabaseClient'

function AdminDashboard({ admin, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [election, setElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [results, setResults] = useState([])
  const [turnout, setTurnout] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (!election) return

    // Subscribe to real-time updates for votes
    const votesChannel = realtimeService.subscribeToVotes(election.id, () => {
      console.log('Real-time update: New vote received')
      loadResults()
      loadTurnout()
    })

    // Also subscribe to voters table changes for turnout updates
    const votersChannel = supabase
      .channel('voters-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'voters' 
        }, 
        (payload) => {
          console.log('Voter updated:', payload)
          loadTurnout()
        }
      )
      .subscribe()

    return () => {
      realtimeService.unsubscribe(votesChannel)
      supabase.removeChannel(votersChannel)
    }
  }, [election])

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadElection(),
        loadCandidates(),
        loadResults(),
        loadTurnout()
      ])
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadElection = async () => {
    const { data } = await electionService.getActiveElection()
    if (data) setElection(data)
  }

  const loadCandidates = async () => {
    const { data: electionData } = await electionService.getActiveElection()
    if (electionData) {
      const { data } = await candidateService.getCandidatesByElection(electionData.id)
      if (data) setCandidates(data)
    }
  }

  const loadResults = async () => {
    const { data: electionData } = await electionService.getActiveElection()
    if (electionData) {
      const { data } = await resultsService.getCandidateVoteCounts(electionData.id)
      if (data) setResults(data)
    }
  }

  const loadTurnout = async () => {
    const { data } = await voterService.getTurnout()
    if (data) setTurnout(data)
  }

  if (loading) {
    return (
      <div className="admin-page">
        <nav className="navbar">
          <div className="navbar-container">
            <Link to="/" className="navbar-logo">
              <span className="logo-icon">🗳️</span>
              <span>ElectZone</span>
            </Link>
            <div className="navbar-menu">
              <span className="nav-user-info">
                <span className="user-name">{admin?.email}</span>
                <span className="admin-badge">Admin</span>
              </span>
            </div>
          </div>
        </nav>
        <div className="admin-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate max votes for chart scaling
  const maxVotes = results.length > 0 
    ? Math.max(...results.map(r => r.vote_count || 0)) 
    : 1

  return (
    <div className="admin-page">
      {/* Admin Navbar */}
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="logo-icon">🗳️</span>
            <span>ElectZone</span>
          </Link>
          <div className="navbar-menu">
            <span className="nav-user-info">
              <span className="user-name">{admin.email}</span>
              <span className="admin-badge">Admin</span>
              <button onClick={onLogout} className="nav-logout-btn">
                Logout
              </button>
            </span>
          </div>
        </div>
      </nav>

      <div className="admin-container">
        <div className="admin-content-wrapper">
          {/* Header Card */}
          <div className="admin-header-card">
            <h1>Admin Dashboard</h1>
            <p>Manage and monitor the election in real-time</p>
          </div>

          {/* Tabs */}
          <div className="admin-tabs">
            <button
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`tab-btn ${activeTab === 'candidates' ? 'active' : ''}`}
              onClick={() => setActiveTab('candidates')}
            >
              👥 Candidates
            </button>
            <button
              className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
              onClick={() => setActiveTab('results')}
            >
              📈 Results
            </button>
            <button
              className={`tab-btn ${activeTab === 'voters' ? 'active' : ''}`}
              onClick={() => setActiveTab('voters')}
            >
              🗳️ Voters
            </button>
          </div>

          {/* Tab Content */}
          <div className="admin-tab-content">
            {activeTab === 'overview' && (
              <div className="overview-tab">
              {/* Election Info Card */}
              {election && (
                <div className="election-info-card">
                  <h2>{election.title}</h2>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Status</span>
                      <span className={`badge badge-${election.status}`}>{election.status}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Start Date</span>
                      <span>{new Date(election.start_at).toLocaleString()}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">End Date</span>
                      <span>{new Date(election.end_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="stats-grid">
                {turnout && (
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <div className="stat-value">{turnout.percentage}%</div>
                      <div className="stat-label">Voter Turnout</div>
                      <div className="stat-detail">{turnout.voted} of {turnout.total} voters</div>
                    </div>
                  </div>
                )}

                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-value">{candidates.length}</div>
                    <div className="stat-label">Total Candidates</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🗳️</div>
                  <div className="stat-content">
                    <div className="stat-value">
                      {results.reduce((sum, r) => sum + (r.vote_count || 0), 0)}
                    </div>
                    <div className="stat-label">Total Votes</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-content">
                    <div className="stat-value">{election?.status || 'N/A'}</div>
                    <div className="stat-label">Election Status</div>
                  </div>
                </div>
              </div>

              {/* Vote Distribution Chart */}
              {results.length > 0 && (
                <div className="chart-card">
                  <h3>Vote Distribution</h3>
                  <div className="bar-chart">
                    {results.map((result, index) => {
                      const percentage = maxVotes > 0 
                        ? (result.vote_count / maxVotes) * 100 
                        : 0
                      
                      return (
                        <div key={result.candidate_id} className="chart-bar-container">
                          <div className="chart-bar-label">
                            <span className="candidate-name-short" title={result.candidate_name}>
                              {result.candidate_name}
                            </span>
                            <span className="party-badge">{result.party}</span>
                          </div>
                          <div className="chart-bar-wrapper">
                            <div 
                              className="chart-bar" 
                              style={{ width: `${percentage}%` }}
                              data-votes={result.vote_count || 0}
                            >
                              <span className="chart-bar-value">{result.vote_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="candidates-tab">
              <div className="table-card">
                <h2>Candidates List</h2>
                {candidates.length > 0 ? (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name</th>
                          <th>Party</th>
                          <th>Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((candidate, index) => (
                          <tr key={candidate.id}>
                            <td>{index + 1}</td>
                            <td>
                              <div className="candidate-cell">
                                <div className="candidate-avatar">
                                  {candidate.name.charAt(0)}
                                </div>
                                <span>{candidate.name}</span>
                              </div>
                            </td>
                            <td>{candidate.party}</td>
                            <td>{candidate.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <p>No candidates found</p>
                    <p className="empty-subtitle">Candidates will appear here once added</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="results-tab">
              <div className="table-card">
                <h2>Election Results</h2>
                {results.length > 0 ? (
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Candidate</th>
                          <th>Party</th>
                          <th>Position</th>
                          <th>Votes</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results
                          .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
                          .map((result, index) => {
                            const totalVotes = results
                              .filter(r => r.position === result.position)
                              .reduce((sum, r) => sum + (r.vote_count || 0), 0)
                            const percentage = totalVotes > 0 
                              ? ((result.vote_count / totalVotes) * 100).toFixed(2) 
                              : 0

                            return (
                              <tr key={result.candidate_id}>
                                <td>
                                  <div className="rank-badge">#{index + 1}</div>
                                </td>
                                <td>
                                  <div className="candidate-cell">
                                    <div className="candidate-avatar">
                                      {result.candidate_name ? result.candidate_name.charAt(0) : '?'}
                                    </div>
                                    <span>{result.candidate_name || 'Unknown'}</span>
                                  </div>
                                </td>
                                <td>{result.party || 'N/A'}</td>
                                <td>{result.position || 'N/A'}</td>
                                <td><strong>{result.vote_count || 0}</strong></td>
                                <td>
                                  <div className="percentage-bar">
                                    <div 
                                      className="percentage-fill" 
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                    <span className="percentage-text">{percentage}%</span>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <p>No results available yet</p>
                    <p className="empty-subtitle">Results will appear here once voting begins</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'voters' && (
            <div className="voters-tab">
              <div className="turnout-card">
                <h2>Voter Turnout Statistics</h2>
                {turnout && (
                  <>
                    <div className="turnout-chart">
                      <div className="turnout-visual">
                        <div className="turnout-circle" style={{ '--percentage': turnout.percentage }}>
                          <div className="turnout-percentage">
                            {turnout.percentage}%
                          </div>
                          <div className="turnout-label">Turnout</div>
                        </div>
                      </div>
                      <div className="turnout-details">
                        <div className="turnout-stat">
                          <div className="turnout-stat-value">{turnout.voted}</div>
                          <div className="turnout-stat-label">Voted</div>
                        </div>
                        <div className="turnout-stat">
                          <div className="turnout-stat-value">{turnout.total - turnout.voted}</div>
                          <div className="turnout-stat-label">Not Voted</div>
                        </div>
                        <div className="turnout-stat">
                          <div className="turnout-stat-value">{turnout.total}</div>
                          <div className="turnout-stat-label">Total Voters</div>
                        </div>
                      </div>
                    </div>
                    <div className="progress-bar-large">
                      <div 
                        className="progress-fill-large" 
                        style={{ width: `${turnout.percentage}%` }}
                      >
                      </div>
                    </div>
                    <div className="progress-text">
                      {turnout.voted} / {turnout.total} voters
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
