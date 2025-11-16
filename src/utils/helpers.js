// Helper utility functions

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format date to short string
 * @param {string|Date} date - Date to format
 * @returns {string} - Short formatted date
 */
export function formatShortDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Check if election is currently active
 * @param {object} election - Election object
 * @returns {boolean} - True if active
 */
export function isElectionActive(election) {
  if (!election) return false
  
  const now = new Date()
  const start = new Date(election.start_at)
  const end = new Date(election.end_at)
  
  return election.status === 'running' && now >= start && now <= end
}

/**
 * Get time remaining for election
 * @param {string} endDate - Election end date
 * @returns {string} - Human readable time remaining
 */
export function getTimeRemaining(endDate) {
  if (!endDate) return 'Unknown'
  
  const now = new Date()
  const end = new Date(endDate)
  const diff = end - now
  
  if (diff <= 0) return 'Ended'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`
  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`
}

/**
 * Group array of objects by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {object} - Grouped object
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = item[key] || 'Other'
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {})
}

/**
 * Calculate percentage
 * @param {number} value - Numerator
 * @param {number} total - Denominator
 * @returns {string} - Percentage with 2 decimal places
 */
export function calculatePercentage(value, total) {
  if (!total || total === 0) return '0.00'
  return ((value / total) * 100).toFixed(2)
}

/**
 * Get unique values from array
 * @param {Array} array - Source array
 * @param {string} key - Key to extract (optional)
 * @returns {Array} - Array of unique values
 */
export function getUniqueValues(array, key = null) {
  if (key) {
    return [...new Set(array.map(item => item[key]))]
  }
  return [...new Set(array)]
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Validate student ID format
 * @param {string} studentId - Student ID to validate
 * @returns {boolean} - True if valid
 */
export function isValidStudentId(studentId) {
  // Assumes format like: 2021001, 2022001, etc.
  const re = /^\d{7}$/
  return re.test(studentId)
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after delay
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} - Initials
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

/**
 * Truncate text
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
