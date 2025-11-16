// Crypto utilities for vote encryption and hashing

/**
 * Generate a random UUID v4 for vote tokens
 */
export function generateVoteToken() {
  return crypto.randomUUID()
}

/**
 * Hash a string using SHA-256
 * @param {string} text - Text to hash
 * @returns {Promise<string>} - Hex string of hash
 */
export async function hashString(text) {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Create a payload hash for vote verification
 * @param {object} payload - Vote selections
 * @returns {Promise<string>} - Hash of the payload
 */
export async function createPayloadHash(payload) {
  const payloadString = JSON.stringify(payload, Object.keys(payload).sort())
  return await hashString(payloadString)
}

/**
 * Encrypt voter ID for anonymity
 * @param {string} studentId - Student ID
 * @param {string} salt - Random salt
 * @returns {Promise<string>} - Hashed voter ID
 */
export async function encryptVoterId(studentId, salt = '') {
  const combined = `${studentId}:${salt}:${Date.now()}`
  return await hashString(combined)
}

/**
 * Create vote payload structure
 * @param {object} selections - User's candidate selections
 * @param {string} electionId - Election UUID
 * @returns {object} - Structured vote payload
 */
export function createVotePayload(selections, electionId) {
  return {
    election_id: electionId,
    timestamp: new Date().toISOString(),
    selections: Object.entries(selections).map(([position, candidateId]) => ({
      position,
      candidate_id: candidateId
    }))
  }
}

/**
 * Verify payload integrity
 * @param {object} payload - Vote payload
 * @param {string} hash - Expected hash
 * @returns {Promise<boolean>} - True if hash matches
 */
export async function verifyPayloadHash(payload, hash) {
  const computedHash = await createPayloadHash(payload)
  return computedHash === hash
}
