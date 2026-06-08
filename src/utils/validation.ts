export type QueryValidation = {
  value: string
  isValid: boolean
  error: string | null
}

export function validateQuery(raw: string): QueryValidation {
  const value = raw.trim()

  if (value.length === 0) {
    return { value, isValid: false, error: null }
  }

  if (value.length < 2) {
    return { value, isValid: false, error: 'Enter at least 2 characters.' }
  }

  if (value.length > 500) {
    return { value, isValid: false, error: 'Keep it under 500 characters.' }
  }

  return { value, isValid: true, error: null }
}
