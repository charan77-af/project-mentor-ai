/**
 * Project Mentor AI - Storage Manager
 * Handles persistent storage of student sessions, ideas, and deep-dive states using localStorage.
 */

const StorageManager = (() => {
  const STORAGE_KEY_SESSIONS = "project_mentor_history_sessions_v1";
  const STORAGE_KEY_CURRENT_SESSION = "project_mentor_current_session_v1";
  const STORAGE_KEY_CURRENT_IDEA = "project_mentor_current_idea_v1";

  // Check if localStorage is supported and accessible
  function isAvailable() {
    try {
      const testKey = "__test_storage__";
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn("LocalStorage is not available:", e);
      return false;
    }
  }

  // Get all saved sessions
  function getSessions() {
    if (!isAvailable()) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse sessions from storage:", e);
      return [];
    }
  }

  // Save a new session or update existing
  function saveSession(session) {
    if (!isAvailable()) return null;
    try {
      const sessions = getSessions();
      // Ensure session has an ID and timestamp
      const sessionWithMeta = {
        id: session.id || `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: session.timestamp || new Date().toISOString(),
        inputs: {
          interests: session.inputs?.interests || "",
          skills: session.inputs?.skills || "",
          domain: session.inputs?.domain || "",
          otherDomain: session.inputs?.otherDomain || ""
        },
        ideas: session.ideas || []
      };

      // Check if session already exists
      const existingIdx = sessions.findIndex(s => s.id === sessionWithMeta.id);
      if (existingIdx >= 0) {
        sessions[existingIdx] = sessionWithMeta;
      } else {
        sessions.unshift(sessionWithMeta); // Newest first
      }

      // Limit max saved sessions to 50 to prevent quota issues
      if (sessions.length > 50) {
        sessions.length = 50;
      }

      window.localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      // Also update current active session
      setCurrentSession(sessionWithMeta);
      return sessionWithMeta;
    } catch (e) {
      console.error("Failed to save session to storage:", e);
      return null;
    }
  }

  // Get session by ID
  function getSessionById(id) {
    const sessions = getSessions();
    return sessions.find(s => s.id === id) || null;
  }

  // Delete a session by ID
  function deleteSession(id) {
    if (!isAvailable()) return false;
    try {
      const sessions = getSessions().filter(s => s.id !== id);
      window.localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
      
      // If current session was deleted, clear it
      const current = getCurrentSession();
      if (current && current.id === id) {
        window.localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
      }
      return true;
    } catch (e) {
      console.error("Failed to delete session:", e);
      return false;
    }
  }

  // Clear all sessions
  function clearAllSessions() {
    if (!isAvailable()) return false;
    try {
      window.localStorage.removeItem(STORAGE_KEY_SESSIONS);
      window.localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
      window.localStorage.removeItem(STORAGE_KEY_CURRENT_IDEA);
      return true;
    } catch (e) {
      console.error("Failed to clear sessions:", e);
      return false;
    }
  }

  // Current session tracking
  function getCurrentSession() {
    if (!isAvailable()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_CURRENT_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setCurrentSession(session) {
    if (!isAvailable()) return;
    try {
      if (session) {
        window.localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, JSON.stringify(session));
      } else {
        window.localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
      }
    } catch (e) {
      console.error("Failed to set current session:", e);
    }
  }

  // Current active deep-dive idea tracking
  function getCurrentIdea() {
    if (!isAvailable()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY_CURRENT_IDEA);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setCurrentIdea(idea) {
    if (!isAvailable()) return;
    try {
      if (idea) {
        window.localStorage.setItem(STORAGE_KEY_CURRENT_IDEA, JSON.stringify(idea));
      } else {
        window.localStorage.removeItem(STORAGE_KEY_CURRENT_IDEA);
      }
    } catch (e) {
      console.error("Failed to set current idea:", e);
    }
  }

  return {
    isAvailable,
    getSessions,
    getSessionById,
    saveSession,
    deleteSession,
    clearAllSessions,
    getCurrentSession,
    setCurrentSession,
    getCurrentIdea,
    setCurrentIdea
  };
})();

// Attach to window
if (typeof window !== "undefined") {
  window.StorageManager = StorageManager;
}
