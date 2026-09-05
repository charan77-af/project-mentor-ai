/**
 * Project Mentor AI - Gemini 2.0 Flash Generator Client
 * Communicates with the backend server to make live Gemini 2.0 Flash calls
 * using the GEMINI_API_KEY environment variable.
 */

const GeneratorEngine = (() => {

  /**
   * Check backend API status and whether GEMINI_API_KEY is configured
   */
  async function checkApiStatus() {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("API status check failed");
      return await res.json();
    } catch (err) {
      console.warn("Could not check Gemini API status:", err);
      return { hasApiKey: false, model: "gemini-2.0-flash", error: err.message };
    }
  }

  /**
   * Helper to parse comma/semicolon/newline separated skills
   */
  function parseSkills(skillsString) {
    if (!skillsString) return [];
    return skillsString
      .split(/[,;\n/]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Generate 3 Project Ideas from Gemini 2.0 Flash
   * @param {Object} inputs { domain, otherDomain, interests, skills }
   * @returns {Promise<Array>} List of 3 project ideas
   */
  async function generateIdeas(inputs) {
    const payload = {
      domain: inputs.domain,
      otherDomain: inputs.otherDomain || "",
      interests: inputs.interests,
      skills: inputs.skills
    };

    let response;
    try {
      response = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      throw new Error("Unable to connect to the backend server. Please verify the server is running on http://localhost:8000.");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `Server responded with error status ${response.status}`;
      const err = new Error(errorMsg);
      err.type = data.type || "SERVER_ERROR";
      throw err;
    }

    if (!data.ideas || !Array.isArray(data.ideas) || data.ideas.length === 0) {
      throw new Error("Gemini returned an invalid response format. Please try regenerating.");
    }

    return data.ideas;
  }

  /**
   * Generate Deep-Dive Technical Blueprint from Gemini 2.0 Flash
   * Called when student clicks "Explore this idea"
   * @param {Object} ideaContext { title, pitch, domain, skills, interests }
   * @returns {Promise<Object>} Deep-dive blueprint
   */
  async function generateDeepDive(ideaContext) {
    const payload = {
      title: ideaContext.title,
      pitch: ideaContext.pitch || ideaContext.shortPitch || "",
      domain: ideaContext.domain || "",
      skills: ideaContext.skills || "",
      interests: ideaContext.interests || ""
    };

    let response;
    try {
      response = await fetch("/api/generate-deepdive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      throw new Error("Unable to connect to the server while generating deep dive. Please check your connection.");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `Server error ${response.status} generating deep-dive`;
      const err = new Error(errorMsg);
      err.type = data.type || "SERVER_ERROR";
      throw err;
    }

    if (!data.blueprint) {
      throw new Error("Gemini returned an empty deep-dive blueprint. Please try again.");
    }

    return data.blueprint;
  }

  return {
    checkApiStatus,
    parseSkills,
    generateIdeas,
    generateDeepDive
  };
})();

// Attach to window
if (typeof window !== "undefined") {
  window.GeneratorEngine = GeneratorEngine;
}
