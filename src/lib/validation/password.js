export function getPasswordIssues(password, userDetails = {}) {
  const issues = []
  const value = password || ''
  const lower = value.toLowerCase()

  if (value.length < 8) {
    issues.push('Password must be at least 8 characters long.')
  }

  if (!/[A-Z]/.test(value)) {
    issues.push('Password must include an uppercase letter.')
  }

  if (!/[a-z]/.test(value)) {
    issues.push('Password must include a lowercase letter.')
  }

  if (!/[0-9]/.test(value)) {
    issues.push('Password must include a number.')
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    issues.push('Password must include a special character.')
  }

  if (lower.includes('password')) {
    issues.push('Password cannot include the word password.')
  }

  if (lower.includes('qwerty')) {
    issues.push('Password cannot include qwerty.')
  }

  const personalValues = [
    userDetails.firstName,
    userDetails.lastName,
  ]
    .filter(Boolean)
    .map(part => part.toLowerCase())
    .filter(part => part.length >= 2)

  if (personalValues.some(part => lower.includes(part))) {
    issues.push('Password cannot include your first or last name.')
  }

  return issues
}

export function isStrongPassword(password, userDetails = {}) {
  return getPasswordIssues(password, userDetails).length === 0
}
