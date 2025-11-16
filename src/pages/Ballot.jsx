import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { electionService, candidateService, authService } from '../services/supabaseAPI'

function Ballot({ voter, selections, setSelections }) {
  const [election, setElection] = useState(null)
  const [candidatesByParty, setCandidatesByParty] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [navigating, setNavigating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadBallotData()
  }, [])

  const loadBallotData = async () => {
    try {
      // Check if voter has already voted
      const { data: votingStatus, error: statusError } = await authService.checkVotingStatus(voter.student_id)
      
      console.log('Ballot: Checking voting status for:', voter.student_id)
      console.log('Ballot: Voting status result:', votingStatus)
      console.log('Ballot: Status error:', statusError)
      
      if (statusError) {
        console.error('Error checking voting status:', statusError)
      }
      
      if (votingStatus && votingStatus.has_voted) {
        console.log('Ballot: User has already voted, blocking access')
        setError('You have already cast your vote. You cannot vote again.')
        setLoading(false)
        return
      }
      
      console.log('Ballot: User has not voted yet, allowing ballot access')

      const { data: electionData, error: electionError } = await electionService.getActiveElection()
      
      if (electionError || !electionData) {
        setError('No active election found')
        setLoading(false)
        return
      }

      setElection(electionData)

      const { data: candidatesData, error: candidatesError } = 
        await candidateService.getCandidatesGroupedByParty(electionData.id)

      if (candidatesError) {
        setError('Error loading candidates')
        setLoading(false)
        return
      }

      setCandidatesByParty(candidatesData)
    } catch (err) {
      setError('Error loading ballot data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCandidate = (position, candidateId) => {
    setSelections(prev => ({
      ...prev,
      [position]: candidateId
    }))
  }

  const handleProceedToReview = () => {
    // Get all unique positions
    const positions = [...new Set(
      Object.values(candidatesByParty)
        .flat()
        .map(c => c.position)
    )]

    // Check if all positions are filled
    const allPositionsFilled = positions.every(pos => selections[pos])

    if (!allPositionsFilled) {
      alert('Please select a candidate for each position before proceeding')
      return
    }

    setNavigating(true)
    // Simulate loading for better UX
    setTimeout(() => {
      navigate('/review')
    }, 800)
  }

  if (loading) {
    return <div className="loading">Loading ballot...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  // Get all unique positions and group all candidates by position
  const allCandidates = Object.values(candidatesByParty).flat()
  const positions = [...new Set(allCandidates.map(c => c.position))]
  const candidatesByPosition = positions.reduce((acc, position) => {
    acc[position] = allCandidates.filter(c => c.position === position)
    return acc
  }, {})

  return (
    <div className="ballot-container">
      <header className="ballot-header">
        <h1 className="ballot-title-glow">{election?.title}</h1>
        <p className="voter-info voter-info-glow">Voting as: {voter.name || voter.student_id}</p>
      </header>

      <div className="ballot-content">
        <div className="positions-wrapper">
          {positions.map((position) => {
            const positionCandidates = candidatesByPosition[position]
            
            return (
              <div key={position} className="position-row">
                <h3 className="position-row-title">{position}</h3>
                <div className="candidates-row">
                  {positionCandidates.map(candidate => (
                    <div
                      key={candidate.id}
                      className={`candidate-card ${
                        selections[position] === candidate.id ? 'selected' : ''
                      }`}
                      onClick={() => handleSelectCandidate(position, candidate.id)}
                    >
                      {candidate.photo_url ? (
                        <img 
                          src={candidate.photo_url} 
                          alt={candidate.name}
                          className="candidate-photo"
                        />
                      ) : (
                        <div className="photo-placeholder">
                          {candidate.name.charAt(0)}
                        </div>
                      )}
                      <div className="candidate-info">
                        <h4 className="candidate-name">{candidate.name}</h4>
                        <p className="candidate-party">{candidate.party}</p>
                      </div>
                      {selections[position] === candidate.id && (
                        <div className="selected-indicator">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="ballot-actions">
        <button 
          onClick={handleProceedToReview}
          className="btn btn-primary btn-large"
          disabled={navigating}
        >
          {navigating ? 'Loading Review...' : 'Proceed to Review'}
        </button>
      </div>

      {/* Loading Dialog */}
      {navigating && (
        <div className="loading-overlay">
          <div className="loading-dialog">
            <div className="loading-spinner-large"></div>
            <h3>Loading Review</h3>
            <p>Preparing your ballot for review...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Ballot
