// Supabase API Helper Functions for ElectZone
// Updated for new schema with voters, elections, and token-based voting
import { supabase } from '../supabaseClient'

// =============================================
// AUTHENTICATION
// =============================================

export const authService = {
  // Voter Login/Verification
  async verifyVoter(studentId) {
    const { data, error } = await supabase
      .from('voters')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single()
    return { data, error }
  },

  // Check if voter has voted
  async checkVotingStatus(studentId) {
    console.log('API: Checking voting status for student:', studentId)
    const { data, error } = await supabase
      .from('voters')
      .select('has_voted, student_id, name')
      .eq('student_id', studentId)
      .single()
    console.log('API: Voting status result:', data)
    console.log('API: Voting status error:', error)
    return { data, error }
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }
}

// =============================================
// ELECTIONS
// =============================================

export const electionService = {
  // Get all elections
  async getAllElections() {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get active/running election
  async getActiveElection() {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('status', 'running')
      .single()
    return { data, error }
  },

  // Get election by ID
  async getElectionById(id) {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Create new election (admin only)
  async createElection(electionData) {
    const { data, error } = await supabase
      .from('elections')
      .insert([electionData])
      .select()
    return { data, error }
  },

  // Update election
  async updateElection(id, updates) {
    const { data, error } = await supabase
      .from('elections')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Delete election
  async deleteElection(id) {
    const { data, error } = await supabase
      .from('elections')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Check if election is active
  async isElectionActive(electionId) {
    const { data, error } = await supabase
      .rpc('is_election_active', { p_election_id: electionId })
    
    if (error) return false
    return data
  }
}

// =============================================
// CANDIDATES
// =============================================

export const candidateService = {
  // Get all candidates for an election
  async getCandidatesByElection(electionId) {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('election_id', electionId)
      .order('party', { ascending: true })
      .order('position', { ascending: true })
    return { data, error }
  },

  // Get candidates by party
  async getCandidatesByParty(electionId, party) {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('election_id', electionId)
      .eq('party', party)
      .order('position', { ascending: true })
    return { data, error }
  },

  // Get candidates by position
  async getCandidatesByPosition(electionId, position) {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('election_id', electionId)
      .eq('position', position)
      .order('party', { ascending: true })
    return { data, error }
  },

  // Get grouped candidates (by party)
  async getCandidatesGroupedByParty(electionId) {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('election_id', electionId)
      .order('party', { ascending: true })
      .order('position', { ascending: true })
    
    if (error) return { data: null, error }

    // Group by party
    const grouped = data.reduce((acc, candidate) => {
      const party = candidate.party || 'Independent'
      if (!acc[party]) {
        acc[party] = []
      }
      acc[party].push(candidate)
      return acc
    }, {})

    return { data: grouped, error: null }
  },

  // Add new candidate (admin only)
  async addCandidate(candidateData) {
    const { data, error } = await supabase
      .from('candidates')
      .insert([candidateData])
      .select()
    return { data, error }
  },

  // Update candidate
  async updateCandidate(id, updates) {
    const { data, error } = await supabase
      .from('candidates')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Delete candidate
  async deleteCandidate(id) {
    const { data, error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id)
    return { data, error }
  }
}

// =============================================
// VOTING
// =============================================

export const votingService = {
  // Submit vote with token
  async submitVote(electionId, voteToken, payload, payloadHash) {
    try {
      // Insert vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert([{
          election_id: electionId,
          vote_token: voteToken,
          payload: payload,
          payload_hash: payloadHash
        }])

      if (voteError) throw voteError

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error }
    }
  },

  // Mark voter as voted
  async markVoterAsVoted(studentId) {
    const { error } = await supabase
      .rpc('mark_voter_as_voted', { p_student_id: studentId })
    
    return { error }
  },

  // Complete voting process (submit + mark voter)
  async completeVoting(electionId, studentId, voteToken, payload, payloadHash) {
    try {
      console.log('API: Starting completeVoting for student:', studentId)
      
      // Submit vote
      console.log('API: Submitting vote to votes table')
      const voteResult = await this.submitVote(electionId, voteToken, payload, payloadHash)
      if (!voteResult.success) {
        console.error('API: Vote submission failed:', voteResult.error)
        throw voteResult.error
      }
      console.log('API: Vote submitted successfully')

      // Mark voter as voted
      console.log('API: Marking voter as voted via RPC')
      const markResult = await this.markVoterAsVoted(studentId)
      if (markResult.error) {
        console.error('API: Mark voter failed:', markResult.error)
        throw markResult.error
      }
      console.log('API: Voter marked as voted successfully')

      return { success: true, error: null }
    } catch (error) {
      console.error('API: completeVoting failed:', error)
      return { success: false, error }
    }
  },

  // Get total votes for election
  async getVoteCount(electionId) {
    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('election_id', electionId)
    
    return { count, error }
  }
}

// =============================================
// RESULTS & STATISTICS
// =============================================

export const resultsService = {
  // Get vote counts per candidate
  async getCandidateVoteCounts(electionId) {
    const { data, error } = await supabase
      .from('candidate_vote_counts')
      .select('*')
      .eq('election_id', electionId)
      .order('vote_count', { ascending: false })
    return { data, error }
  },

  // Get voting statistics
  async getStatistics(electionId) {
    const { data, error } = await supabase
      .from('voting_statistics')
      .select('*')
      .eq('election_id', electionId)
      .single()
    return { data, error }
  },

  // Get results by party
  async getResultsByParty(electionId) {
    const { data, error } = await supabase
      .from('candidate_vote_counts')
      .select('*')
      .eq('election_id', electionId)
      .order('party', { ascending: true })
      .order('vote_count', { ascending: false })
    
    if (error) return { data: null, error }

    // Group by party
    const grouped = data.reduce((acc, candidate) => {
      const party = candidate.party || 'Independent'
      if (!acc[party]) {
        acc[party] = {
          party: party,
          candidates: [],
          totalVotes: 0
        }
      }
      acc[party].candidates.push(candidate)
      acc[party].totalVotes += candidate.vote_count || 0
      return acc
    }, {})

    return { data: Object.values(grouped), error: null }
  },

  // Get results by position
  async getResultsByPosition(electionId, position) {
    const { data, error } = await supabase
      .from('candidate_vote_counts')
      .select('*')
      .eq('election_id', electionId)
      .eq('position', position)
      .order('vote_count', { ascending: false })
    return { data, error }
  }
}

// =============================================
// VOTERS (Admin functions)
// =============================================

export const voterService = {
  // Get all voters
  async getAllVoters() {
    const { data, error } = await supabase
      .from('voters')
      .select('*')
      .order('name', { ascending: true })
    return { data, error }
  },

  // Get voters by year level
  async getVotersByYearLevel(yearLevel) {
    const { data, error } = await supabase
      .from('voters')
      .select('*')
      .eq('year_level', yearLevel)
      .order('name', { ascending: true })
    return { data, error }
  },

  // Get voting turnout
  async getTurnout() {
    const { data, error } = await supabase
      .from('voters')
      .select('has_voted, is_active')
    
    if (error) return { data: null, error }

    const total = data.filter(v => v.is_active).length
    const voted = data.filter(v => v.has_voted && v.is_active).length
    const percentage = total > 0 ? ((voted / total) * 100).toFixed(2) : 0

    return { 
      data: { total, voted, percentage }, 
      error: null 
    }
  },

  // Add voter
  async addVoter(voterData) {
    const { data, error } = await supabase
      .from('voters')
      .insert([voterData])
      .select()
    return { data, error }
  },

  // Import voters (bulk)
  async importVoters(votersArray) {
    const { data, error } = await supabase
      .from('voters')
      .insert(votersArray)
      .select()
    return { data, error }
  },

  // Update voter
  async updateVoter(id, updates) {
    const { data, error } = await supabase
      .from('voters')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Delete voter
  async deleteVoter(id) {
    const { data, error } = await supabase
      .from('voters')
      .delete()
      .eq('id', id)
    return { data, error }
  }
}

// =============================================
// ADMIN
// =============================================

export const adminService = {
  // Admin login (you'll need to implement proper password verification)
  async loginAdmin(email, password) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .single()
    
    // You need to verify password hash here using bcrypt
    // bcrypt.compare(password, data.password_hash)
    return { data, error }
  },

  // Get all admins
  async getAllAdmins() {
    const { data, error } = await supabase
      .from('admins')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Add admin
  async addAdmin(adminData) {
    const { data, error } = await supabase
      .from('admins')
      .insert([adminData])
      .select('id, email, role, created_at')
    return { data, error }
  },

  // Get audit logs
  async getAuditLogs(limit = 100) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Log admin action
  async logAction(actorType, actorId, action, details) {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        actor_type: actorType,
        actor_id: actorId,
        action,
        details
      }])
    return { error }
  }
}

// =============================================
// STORAGE (for candidate photos)
// =============================================

export const storageService = {
  // Upload candidate photo
  async uploadCandidatePhoto(file, candidateId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${candidateId}-${Date.now()}.${fileExt}`
    const filePath = `candidates/${fileName}`

    const { data, error } = await supabase.storage
      .from('candidate-photos')
      .upload(filePath, file)

    if (error) return { data: null, error }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('candidate-photos')
      .getPublicUrl(filePath)

    return { data: { path: filePath, url: publicUrl }, error: null }
  },

  // Delete photo
  async deletePhoto(filePath) {
    const { error } = await supabase.storage
      .from('candidate-photos')
      .remove([filePath])
    return { error }
  }
}

// =============================================
// REAL-TIME SUBSCRIPTIONS
// =============================================

export const realtimeService = {
  // Subscribe to vote updates
  subscribeToVotes(electionId, callback) {
    const channel = supabase
      .channel('votes-changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'votes',
          filter: `election_id=eq.${electionId}`
        },
        callback
      )
      .subscribe()
    
    return channel
  },

  // Subscribe to candidate updates
  subscribeToCandidates(electionId, callback) {
    const channel = supabase
      .channel('candidates-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'candidates',
          filter: `election_id=eq.${electionId}`
        },
        callback
      )
      .subscribe()
    
    return channel
  },

  // Subscribe to voter updates
  subscribeToVoters(callback) {
    const channel = supabase
      .channel('voters-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'voters' },
        callback
      )
      .subscribe()
    
    return channel
  },

  // Unsubscribe
  unsubscribe(channel) {
    supabase.removeChannel(channel)
  }
}
