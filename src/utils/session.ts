/**
 * Session utilities
 */

const SESSION_KEY = 'sessionId';

/**
 * Get or create a session ID
 */
export const getOrCreateSessionId = (): string => {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

/**
 * Get current session ID (may be null)
 */
export const getSessionId = (): string | null => {
  return sessionStorage.getItem(SESSION_KEY);
};

/**
 * Clear session ID
 */
export const clearSessionId = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};

