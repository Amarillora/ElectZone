import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { candidateService, votingService, electionService, authService } from '../services/supabaseAPI'
import { generateVoteToken, createVotePayload, createPayloadHash } from '../utils/crypto'
import ConfirmModal from '../components/ConfirmModal'

function Review({ voter, selections, onLogout }) {
  const [candidates, setCandidates] = useState({})
  const [election, setElection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadReviewData()
  }, [])

  const loadReviewData = async () => {
    try {
      const { data: electionData } = await electionService.getActiveElection()
      setElection(electionData)

      // Load candidate details for selected IDs
      const candidateIds = Object.values(selections)
      const candidateMap = {}

      for (const id of candidateIds) {
        const { data: allCandidates } = await candidateService.getCandidatesByElection(electionData.id)
        const candidate = allCandidates.find(c => c.id === id)
        if (candidate) {
          candidateMap[id] = candidate
        }
      }

      setCandidates(candidateMap)
    } catch (err) {
      console.error('Error loading review data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitVote = async () => {
    setSubmitting(true)
    setShowConfirm(false)

    try {
      // Double-check voting status before submission
      console.log('Review: Re-checking voting status before submission')
      const { data: votingStatus } = await authService.checkVotingStatus(voter.student_id)
      console.log('Review: Voting status check result:', votingStatus)
      
      if (votingStatus && votingStatus.has_voted) {
        alert('You have already voted. Cannot submit another vote.')
        setSubmitting(false)
        navigate('/ballot')
        return
      }

      // Validate all selections are present
      const selectionCount = Object.keys(selections).length
      console.log('Review: Selection count:', selectionCount)
      console.log('Review: Selections:', selections)

      if (selectionCount !== 10) {
        alert(`Error: You must select exactly 10 positions. You have selected ${selectionCount}.`)
        setSubmitting(false)
        navigate('/ballot')
        return
      }
      
      // Generate vote token
      const voteToken = generateVoteToken()

      // Create payload
      const payload = createVotePayload(selections, election.id)
      
      console.log('Vote Payload:', payload)
      console.log('Number of selections in payload:', payload.selections.length)

      // Verify payload has 10 selections
      if (payload.selections.length !== 10) {
        alert(`Error: Invalid vote payload. Expected 10 selections, got ${payload.selections.length}.`)
        setSubmitting(false)
        return
      }

      // Create payload hash
      const payloadHash = await createPayloadHash(payload)
      
      console.log('Submitting vote for:', voter.student_id)

      // Submit vote
      const { success, error } = await votingService.completeVoting(
        election.id,
        voter.student_id,
        voteToken,
        payload,
        payloadHash
      )

      if (!success || error) {
        throw new Error(error?.message || 'Failed to submit vote')
      }

      console.log('Vote submitted successfully!')

      // Navigate to thank you page
      navigate('/thank-you')
    } catch (err) {
      alert('Error submitting vote: ' + err.message)
      console.error('Vote submission error:', err)
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large"></div>
        <p>Loading review...</p>
      </div>
    )
  }

  return (
    <div className="review-container">
      <header className="review-header">
        <div className="review-header-icon">📋</div>
        <h1>Review Your Ballot</h1>
        <p className="review-subtitle">Please verify your selections before submitting</p>
      </header>

      <div className="review-content">
        <div className="review-info-banner">
          <span className="info-icon">ℹ️</span>
          <div>
            <strong>Voting as: {voter.name || voter.student_id}</strong>
            <p>{election?.title}</p>
          </div>
        </div>

        <div className="selections-grid">
          {Object.entries(selections).map(([position, candidateId], index) => {
            const candidate = candidates[candidateId]
            return (
              <div key={position} className="selection-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="selection-card-header">
                  <span className="position-badge">{position}</span>
                  <span className="check-icon">✓</span>
                </div>
                <div className="selection-card-body">
                  {candidate ? (
                    <>
                      <div className="candidate-avatar-small">
                        {candidate.photo_url ? (
                          <img src={candidate.photo_url} alt={candidate.name} />
                        ) : (
                          <div className="avatar-placeholder">{candidate.name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="candidate-details">
                        <h3 className="candidate-name-review">{candidate.name}</h3>
                        <span className="party-tag">{candidate.party}</span>
                      </div>
                    </>
                  ) : (
                    <span className="loading-text">Loading...</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="review-warning-card">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h3>Important Notice</h3>
            <p>Once you submit your vote, <strong>you cannot change it</strong>. Please review your selections carefully before proceeding.</p>
          </div>
        </div>
      </div>

      <div className="review-actions">
        <button 
          onClick={() => navigate('/ballot')}
          className="btn btn-secondary btn-large"
          disabled={submitting}
        >
          ← Go Back
        </button>
        <button 
          onClick={() => setShowConfirm(true)}
          className="btn btn-primary btn-large btn-submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="button-spinner"></span>
              Submitting...
            </>
          ) : (
            <>
              Submit Vote ✓
            </>
          )}
        </button>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        title="Confirm Vote Submission"
        message="Are you sure you want to submit your vote? This action cannot be undone."
        onConfirm={handleSubmitVote}
        onCancel={() => setShowConfirm(false)}
        confirmText="Yes, Submit Vote"
        cancelText="Cancel"
      />
    </div>
  )
}

export default Review
