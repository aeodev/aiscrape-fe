const SESSION_KEY = 'sessionId'

export const getOrCreateSessionId = (): string => {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

export const getSessionId = (): string | null => {
  return sessionStorage.getItem(SESSION_KEY)
}

export const clearSessionId = (): void => {
  sessionStorage.removeItem(SESSION_KEY)
}
