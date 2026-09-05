/**
 * Project Mentor AI - Main Application Coordinator
 * Controls navigation, state routing, form handling, Gemini 2.0 Flash integration,
 * on-demand deep-dive blueprints, and accessible error handling.
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements - Navigation & Views
  const navLinks = {
    home: document.getElementById("nav-home"),
    ideas: document.getElementById("nav-ideas"),
    deepdive: document.getElementById("nav-deepdive"),
    history: document.getElementById("nav-history")
  };

  const pageViews = {
    home: document.getElementById("page-home"),
    ideas: document.getElementById("page-ideas"),
    deepdive: document.getElementById("page-deepdive"),
    history: document.getElementById("page-history")
  };

  const mobileToggle = document.getElementById("mobile-toggle");
  const navLinksList = document.getElementById("nav-links");
  const historyNavCount = document.getElementById("history-nav-count");
  const ideasNavBadge = document.getElementById("ideas-nav-badge");

  // API Status Elements
  const apiStatusPill = document.getElementById("api-status-pill");
  const statusIndicatorDot = document.getElementById("status-indicator-dot");
  const apiStatusText = document.getElementById("api-status-text");

  // Home Form Elements
  const form = document.getElementById("mentor-input-form");
  const domainSelect = document.getElementById("domain-select");
  const otherDomainGroup = document.getElementById("other-domain-group");
  const otherDomainInput = document.getElementById("other-domain-input");
  const interestsInput = document.getElementById("interests-input");
  const skillsInput = document.getElementById("skills-input");
  const generateBtn = document.getElementById("generate-btn");
  const skillChips = document.querySelectorAll(".skill-chip");

  // Home Error Banner
  const formErrorBanner = document.getElementById("form-error-banner");
  const formErrorTitle = document.getElementById("form-error-title");
  const formErrorDesc = document.getElementById("form-error-desc");
  const formErrorClose = document.getElementById("form-error-close");

  // Ideas View Elements
  const ideasContainer = document.getElementById("ideas-cards-container");
  const contextDomain = document.getElementById("context-domain");
  const contextSkills = document.getElementById("context-skills");
  const contextInterests = document.getElementById("context-interests");
  const contextTimestamp = document.getElementById("context-timestamp");
  const regenerateBtn = document.getElementById("regenerate-ideas-btn");

  // Deep Dive View Elements
  const deepdiveLoading = document.getElementById("deepdive-loading");
  const deepdiveError = document.getElementById("deepdive-error");
  const deepdiveErrorTitle = document.getElementById("deepdive-error-title");
  const deepdiveErrorDesc = document.getElementById("deepdive-error-desc");
  const deepdiveRetryBtn = document.getElementById("deepdive-retry-btn");
  const deepdiveContent = document.getElementById("deepdive-content");

  const deepdiveBadge = document.getElementById("deepdive-badge");
  const deepdiveDifficulty = document.getElementById("deepdive-difficulty");
  const deepdiveTimeline = document.getElementById("deepdive-timeline");
  const deepdiveHeading = document.getElementById("deepdive-heading");
  const deepdivePitch = document.getElementById("deepdive-pitch");
  const deepdiveMetaChips = document.getElementById("deepdive-meta-chips");
  const deepdiveFeaturesList = document.getElementById("deepdive-features-list");
  const techFrontend = document.getElementById("tech-frontend");
  const techBackend = document.getElementById("tech-backend");
  const techDatabase = document.getElementById("tech-database");
  const techSpecialized = document.getElementById("tech-specialized");
  const techMatchedSkills = document.getElementById("tech-matched-skills");
  const techLearningOps = document.getElementById("tech-learning-ops");
  const deepdiveTimelineContainer = document.getElementById("deepdive-timeline-container");
  const deepdiveFutureScope = document.getElementById("deepdive-future-scope");
  const deepdiveVivaPoints = document.getElementById("deepdive-viva-points");
  const backToIdeasBtn = document.getElementById("back-to-ideas-btn");
  const printBriefBtn = document.getElementById("print-brief-btn");
  const copySummaryBtn = document.getElementById("copy-summary-btn");

  // History View Elements
  const historyContainer = document.getElementById("history-container");
  const clearHistoryBtn = document.getElementById("clear-history-btn");

  // Toast Container
  const toastContainer = document.getElementById("toast-container");

  // =========================================================================
  // API Status Check
  // =========================================================================
  async function refreshApiStatus() {
    const status = await GeneratorEngine.checkApiStatus();
    if (status && status.hasApiKey) {
      statusIndicatorDot.className = "status-indicator-dot active";
      apiStatusText.textContent = "Gemini 2.0 Flash Active";
      apiStatusPill.title = `Connected to Google Gemini API (model: ${status.model || "gemini-2.0-flash"})`;
    } else {
      statusIndicatorDot.className = "status-indicator-dot error";
      apiStatusText.textContent = "GEMINI_API_KEY Not Set";
      apiStatusPill.title = "GEMINI_API_KEY environment variable is not set. Set GEMINI_API_KEY in terminal or .env file.";
    }
  }

  // =========================================================================
  // Routing & Page Navigation
  // =========================================================================
  function getRoute() {
    const hash = window.location.hash.replace("#", "").toLowerCase();
    if (hash === "ideas") return "ideas";
    if (hash === "deep-dive" || hash === "deepdive") return "deepdive";
    if (hash === "history") return "history";
    return "home";
  }

  function navigateTo(route) {
    window.location.hash = route === "deepdive" ? "#deep-dive" : `#${route}`;
  }

  function renderView(route) {
    // Close mobile menu if open
    if (navLinksList.classList.contains("open")) {
      navLinksList.classList.remove("open");
      mobileToggle.setAttribute("aria-expanded", "false");
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update active nav link
    Object.values(navLinks).forEach(link => link.classList.remove("active"));
    if (navLinks[route]) {
      navLinks[route].classList.add("active");
    }

    // Update view visibility
    Object.values(pageViews).forEach(view => {
      view.classList.remove("active");
      view.setAttribute("aria-hidden", "true");
    });

    if (pageViews[route]) {
      pageViews[route].classList.add("active");
      pageViews[route].setAttribute("aria-hidden", "false");
    }

    // Route-specific loading checks
    if (route === "ideas") {
      const currentSession = StorageManager.getCurrentSession();
      if (!currentSession || !currentSession.ideas || currentSession.ideas.length === 0) {
        showToast("No active ideas found. Please generate ideas first!", "error");
        navigateTo("home");
        return;
      }
      renderIdeasPage(currentSession);
    } else if (route === "deepdive") {
      const currentIdea = StorageManager.getCurrentIdea();
      if (!currentIdea) {
        const currentSession = StorageManager.getCurrentSession();
        if (currentSession && currentSession.ideas && currentSession.ideas.length > 0) {
          exploreIdea(currentSession.ideas[0]);
        } else {
          showToast("Please choose an idea to deep-dive into!", "error");
          navigateTo("home");
          return;
        }
      } else {
        exploreIdea(currentIdea);
      }
    } else if (route === "history") {
      renderHistoryPage();
    }

    updateNavBadges();
  }

  window.addEventListener("hashchange", () => {
    renderView(getRoute());
  });

  // Mobile menu toggle
  mobileToggle.addEventListener("click", () => {
    const isOpen = navLinksList.classList.toggle("open");
    mobileToggle.setAttribute("aria-expanded", String(isOpen));
  });

  function updateNavBadges() {
    const sessions = StorageManager.getSessions();
    historyNavCount.textContent = sessions.length;

    const currentSession = StorageManager.getCurrentSession();
    if (currentSession && currentSession.ideas && currentSession.ideas.length > 0) {
      ideasNavBadge.style.display = "inline-block";
    } else {
      ideasNavBadge.style.display = "none";
    }
  }

  // =========================================================================
  // Toast & Error Banner Notifications
  // =========================================================================
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    const iconSvg = type === "success" 
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.2s ease";
      setTimeout(() => toast.remove(), 200);
    }, 3800);
  }

  function showFormError(title, description) {
    formErrorTitle.textContent = title;
    formErrorDesc.innerHTML = description;
    formErrorBanner.style.display = "flex";
    formErrorBanner.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideFormError() {
    formErrorBanner.style.display = "none";
  }

  if (formErrorClose) {
    formErrorClose.addEventListener("click", hideFormError);
  }

  // =========================================================================
  // Home Form Handling & Gemini 2.0 Flash Generation
  // =========================================================================

  // Toggle "Other Domain" input
  domainSelect.addEventListener("change", (e) => {
    FormValidator.clearFieldError(form, "domain");
    if (e.target.value === "Other") {
      otherDomainGroup.style.display = "flex";
      otherDomainInput.setAttribute("required", "true");
      otherDomainInput.focus();
    } else {
      otherDomainGroup.style.display = "none";
      otherDomainInput.removeAttribute("required");
      otherDomainInput.value = "";
    }
  });

  // Clear errors on input
  interestsInput.addEventListener("input", () => {
    FormValidator.clearFieldError(form, "interests");
    hideFormError();
  });
  skillsInput.addEventListener("input", () => {
    FormValidator.clearFieldError(form, "skills");
    hideFormError();
  });
  otherDomainInput.addEventListener("input", () => {
    FormValidator.clearFieldError(form, "otherDomain");
    hideFormError();
  });

  // Quick skill tag chips
  skillChips.forEach(chip => {
    chip.addEventListener("click", () => {
      const skillName = chip.dataset.skill;
      let currentSkills = skillsInput.value.trim();
      const existingList = GeneratorEngine.parseSkills(currentSkills).map(s => s.toLowerCase());

      if (!existingList.includes(skillName.toLowerCase())) {
        skillsInput.value = currentSkills ? `${currentSkills}, ${skillName}` : skillName;
        chip.classList.add("active");
      } else {
        const updated = GeneratorEngine.parseSkills(currentSkills)
          .filter(s => s.toLowerCase() !== skillName.toLowerCase())
          .join(", ");
        skillsInput.value = updated;
        chip.classList.remove("active");
      }
      FormValidator.clearFieldError(form, "skills");
    });
  });

  // Submit Form: Calls Gemini 2.0 Flash for 3 Ideas
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideFormError();

    const formData = {
      domain: domainSelect.value,
      otherDomain: otherDomainInput.value,
      interests: interestsInput.value,
      skills: skillsInput.value
    };

    // Validate inputs
    const validation = FormValidator.validate(formData);
    if (!validation.isValid) {
      FormValidator.displayErrors(form, validation.errors);
      return;
    }

    // Set loading state on submit button
    generateBtn.disabled = true;
    const originalBtnHTML = generateBtn.innerHTML;
    generateBtn.innerHTML = `
      <span class="spinner" aria-hidden="true"></span>
      <span>Gemini 2.0 Flash is synthesizing 3 ideas...</span>
    `;

    try {
      // Call Google Gemini API via backend
      const generatedIdeas = await GeneratorEngine.generateIdeas(formData);

      // Construct session and save
      const session = {
        id: `session_${Date.now()}`,
        timestamp: new Date().toISOString(),
        inputs: formData,
        ideas: generatedIdeas
      };

      StorageManager.saveSession(session);
      StorageManager.setCurrentIdea(generatedIdeas[0]);

      showToast("✨ Gemini 2.0 Flash synthesized 3 tailored project ideas!", "success");
      refreshApiStatus();
      navigateTo("ideas");

    } catch (err) {
      console.error("Gemini Generation Error:", err);
      let errorTitle = "Gemini API Call Failed";
      let errorDesc = err.message;

      if (err.message && err.message.includes("GEMINI_API_KEY environment variable is not set")) {
        errorTitle = "GEMINI_API_KEY Missing";
        errorDesc = `
          The <code>GEMINI_API_KEY</code> environment variable was not detected. Please set it in your terminal before running the server:
          <br><br>
          <code style="background: rgba(0,0,0,0.4); padding: 0.3rem 0.6rem; border-radius: 4px; display: block; margin-top: 0.4rem;">
            $env:GEMINI_API_KEY="your_api_key_here" ; python server.py
          </code>
          <br>
          Or create a <code>.env</code> file containing <code>GEMINI_API_KEY=your_key</code> in the project directory.
        `;
      }

      showFormError(errorTitle, errorDesc);
      showToast(err.message || "Failed to generate ideas with Gemini.", "error");
      refreshApiStatus();
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = originalBtnHTML;
    }
  });

  // =========================================================================
  // Ideas Page: Rendering & Actions
  // =========================================================================
  function renderIdeasPage(session) {
    const { inputs, ideas, timestamp } = session;

    // Context Banner
    contextDomain.textContent = inputs.domain === "Other" && inputs.otherDomain ? inputs.otherDomain : inputs.domain;
    contextSkills.textContent = inputs.skills;
    contextInterests.textContent = inputs.interests;

    const formattedDate = new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    contextTimestamp.textContent = `Generated on ${formattedDate}`;

    // Render 3 Cards
    ideasContainer.innerHTML = "";

    ideas.forEach((idea, index) => {
      const card = document.createElement("article");
      card.className = "idea-card";
      card.setAttribute("aria-labelledby", `idea-title-${index}`);

      const badgeClass = index === 0 ? "idea-1" : index === 1 ? "idea-2" : "idea-3";

      // Tech tags preview: use idea.technologies (tailored by Gemini)
      const techList = idea.technologies || [];

      card.innerHTML = `
        <div class="card-top">
          <span class="idea-badge ${badgeClass}">Idea #${index + 1}</span>
          <span class="difficulty-pill">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            ${escapeHTML(idea.difficulty || "Advanced")}
          </span>
        </div>

        <h3 class="idea-title" id="idea-title-${index}">${escapeHTML(idea.title)}</h3>
        <p class="idea-pitch">${escapeHTML(idea.pitch || idea.shortPitch)}</p>

        <div class="idea-meta-row">
          <div class="tech-preview-tags">
            ${techList.map(t => `<span class="tech-tag-mini">${escapeHTML(t)}</span>`).join("")}
          </div>

          <button type="button" class="btn btn-primary btn-block explore-idea-btn" data-index="${index}">
            <span>Explore this idea</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </button>
        </div>
      `;

      // Wire Explore Button
      const exploreBtn = card.querySelector(".explore-idea-btn");
      exploreBtn.addEventListener("click", () => {
        exploreIdea(idea);
      });

      ideasContainer.appendChild(card);
    });
  }

  // Regenerate ideas button
  regenerateBtn.addEventListener("click", async () => {
    const currentSession = StorageManager.getCurrentSession();
    if (!currentSession) return;

    regenerateBtn.disabled = true;
    regenerateBtn.innerHTML = `
      <span class="spinner" style="width: 14px; height: 14px;"></span>
      <span>Gemini 2.0 Flash is regenerating...</span>
    `;

    try {
      const newIdeas = await GeneratorEngine.generateIdeas(currentSession.inputs);
      currentSession.ideas = newIdeas;
      currentSession.timestamp = new Date().toISOString();

      StorageManager.saveSession(currentSession);
      StorageManager.setCurrentIdea(newIdeas[0]);

      renderIdeasPage(currentSession);
      showToast("Generated a fresh batch of 3 project ideas with Gemini!", "success");
    } catch (err) {
      showToast(err.message || "Failed to regenerate ideas.", "error");
    } finally {
      regenerateBtn.disabled = false;
      regenerateBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
        <span>Regenerate Ideas</span>
      `;
    }
  });

  // =========================================================================
  // Deep-Dive Page: On-Demand Gemini Blueprint Generation & Rendering
  // =========================================================================

  /**
   * Called when user clicks "Explore this idea"
   * Calls Gemini 2.0 Flash if not already generated, or renders cached blueprint
   */
  async function exploreIdea(idea) {
    StorageManager.setCurrentIdea(idea);
    navigateTo("deepdive");

    // Populate basic header data
    deepdiveBadge.textContent = idea.number ? `Idea #${idea.number} Blueprint` : "Project Blueprint";
    deepdiveBadge.className = `idea-badge ${idea.number === 2 ? "idea-2" : idea.number === 3 ? "idea-3" : "idea-1"}`;
    deepdiveHeading.textContent = idea.title;
    deepdivePitch.textContent = idea.pitch || idea.shortPitch;

    deepdiveDifficulty.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      Difficulty: ${escapeHTML(idea.difficulty || "Advanced")}
    `;

    // Check if blueprint is already cached on the idea
    if (idea.blueprint) {
      showDeepDiveContent();
      renderDeepDiveBlueprint(idea, idea.blueprint);
      return;
    }

    // Otherwise call Gemini 2.0 Flash to generate the deep-dive blueprint
    await fetchAndRenderDeepDive(idea);
  }

  async function fetchAndRenderDeepDive(idea) {
    const currentSession = StorageManager.getCurrentSession();
    const sessionInputs = currentSession?.inputs || {};

    const ideaContext = {
      title: idea.title,
      pitch: idea.pitch || idea.shortPitch,
      domain: idea.domain || sessionInputs.domain,
      skills: sessionInputs.skills || "",
      interests: sessionInputs.interests || ""
    };

    // Show loading state
    deepdiveLoading.style.display = "block";
    deepdiveError.style.display = "none";
    deepdiveContent.style.display = "none";

    try {
      const blueprint = await GeneratorEngine.generateDeepDive(ideaContext);

      // Cache blueprint onto idea and update session storage
      idea.blueprint = blueprint;
      StorageManager.setCurrentIdea(idea);

      if (currentSession && currentSession.ideas) {
        const idx = currentSession.ideas.findIndex(i => i.title === idea.title);
        if (idx >= 0) {
          currentSession.ideas[idx].blueprint = blueprint;
          StorageManager.saveSession(currentSession);
        }
      }

      showDeepDiveContent();
      renderDeepDiveBlueprint(idea, blueprint);
      showToast("✨ Gemini 2.0 Flash generated complete deep-dive blueprint!", "success");

    } catch (err) {
      console.error("Deep Dive Gemini Error:", err);
      deepdiveLoading.style.display = "none";
      deepdiveContent.style.display = "none";
      deepdiveError.style.display = "flex";

      let desc = err.message || "An unexpected error occurred while communicating with Gemini.";
      if (err.message && err.message.includes("GEMINI_API_KEY environment variable is not set")) {
        desc = "GEMINI_API_KEY environment variable is not set. Please set GEMINI_API_KEY in your server environment to generate deep-dive blueprints.";
      }
      deepdiveErrorDesc.textContent = desc;
      showToast(desc, "error");
    }
  }

  function showDeepDiveContent() {
    deepdiveLoading.style.display = "none";
    deepdiveError.style.display = "none";
    deepdiveContent.style.display = "block";
  }

  // Retry button for deep dive
  deepdiveRetryBtn.addEventListener("click", () => {
    const currentIdea = StorageManager.getCurrentIdea();
    if (currentIdea) {
      fetchAndRenderDeepDive(currentIdea);
    }
  });

  // Render the deep-dive blueprint data into DOM
  function renderDeepDiveBlueprint(idea, blueprint) {
    const currentSession = StorageManager.getCurrentSession();
    const domain = idea.domain || currentSession?.inputs?.domain || "Engineering";

    // Meta chips
    deepdiveMetaChips.innerHTML = `
      <span class="deepdive-chip">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        Domain: ${escapeHTML(domain)}
      </span>
      <span class="deepdive-chip">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Model: Gemini 2.0 Flash
      </span>
      <span class="deepdive-chip">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Final-Year Capstone
      </span>
    `;

    // 1. Features (list)
    const features = Array.isArray(blueprint.features) ? blueprint.features : [];
    deepdiveFeaturesList.innerHTML = features.map(feat => `
      <li class="feature-list-item">
        <svg class="feature-check" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${escapeHTML(feat)}</span>
      </li>
    `).join("");

    // 2. Recommended Tech Stack
    const stack = blueprint.recommendedTechStack || {};
    techFrontend.textContent = stack.frontend || "Modern React / Next.js with Tailwind CSS";
    techBackend.textContent = stack.backend || "FastAPI or Node.js";
    techDatabase.textContent = stack.database || "PostgreSQL & Redis";
    techSpecialized.textContent = stack.specialized || "Docker, WebSockets, specialized AI/hardware libraries";

    // Matched skills
    const matched = Array.isArray(stack.matchedSkills) ? stack.matchedSkills : [];
    if (matched.length > 0) {
      techMatchedSkills.innerHTML = matched.map(s => `
        <span class="skill-match-pill">✓ ${escapeHTML(s)}</span>
      `).join("");
    } else {
      techMatchedSkills.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Standard foundational stack aligned with input</span>`;
    }

    // Learning opportunities
    const learningOps = Array.isArray(stack.learningOpportunities) ? stack.learningOpportunities : [];
    if (learningOps.length > 0) {
      techLearningOps.innerHTML = learningOps.map(l => `
        <span class="skill-match-pill" style="background: rgba(59, 130, 246, 0.15); color: #93c5fd; border-color: rgba(59, 130, 246, 0.3);">+ ${escapeHTML(l)}</span>
      `).join("");
    } else {
      techLearningOps.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted);">Containerization and CI/CD pipelines</span>`;
    }

    // 3. Step-by-Step Development Roadmap (Numbered)
    const roadmap = Array.isArray(blueprint.roadmap) ? blueprint.roadmap : [];
    deepdiveTimelineContainer.innerHTML = roadmap.map((step, idx) => {
      // Step could be string or object
      const stepText = typeof step === "string" ? step : `${step.phase || step.title || `Step ${idx + 1}`}: ${step.tasks ? step.tasks.join("; ") : ""}`;
      return `
        <div class="timeline-phase">
          <div style="display: flex; align-items: flex-start; gap: 0.85rem;">
            <span class="step-number-pill">${idx + 1}</span>
            <div style="flex: 1;">
              <span class="phase-title" style="font-size: 0.95rem; font-weight: 600; color: #fff; line-height: 1.5; display: block;">
                ${escapeHTML(stepText)}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join("");

    // 4. Suggested Improvements & Viva Prep
    const improvements = Array.isArray(blueprint.suggestedImprovements) ? blueprint.suggestedImprovements : [];
    deepdiveFutureScope.innerHTML = improvements.map(scope => `
      <li class="feature-list-item">
        <svg class="feature-check" style="color: var(--accent-cyan);" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
        <span>${escapeHTML(scope)}</span>
      </li>
    `).join("");

    const vivaPoints = Array.isArray(blueprint.vivaTalkingPoints) ? blueprint.vivaTalkingPoints : [];
    deepdiveVivaPoints.innerHTML = vivaPoints.map(point => `
      <li class="feature-list-item">
        <svg class="feature-check" style="color: var(--accent-amber);" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        <span>${escapeHTML(point)}</span>
      </li>
    `).join("");
  }

  // Deep dive actions
  backToIdeasBtn.addEventListener("click", () => navigateTo("ideas"));
  printBriefBtn.addEventListener("click", () => window.print());

  copySummaryBtn.addEventListener("click", () => {
    const currentIdea = StorageManager.getCurrentIdea();
    if (!currentIdea) return;

    const bp = currentIdea.blueprint || {};
    const summaryText = `
PROJECT TITLE: ${currentIdea.title}
DIFFICULTY: ${currentIdea.difficulty || "Advanced"}

PITCH:
${currentIdea.pitch || currentIdea.shortPitch}

KEY FEATURES:
${(bp.features || []).map(f => `* ${f}`).join("\n")}

RECOMMENDED TECH STACK:
- Frontend: ${bp.recommendedTechStack?.frontend || "N/A"}
- Backend: ${bp.recommendedTechStack?.backend || "N/A"}
- Database: ${bp.recommendedTechStack?.database || "N/A"}
- Specialized: ${bp.recommendedTechStack?.specialized || "N/A"}

STEP-BY-STEP DEVELOPMENT ROADMAP:
${(bp.roadmap || []).map((s, idx) => `${idx + 1}. ${s}`).join("\n")}

SUGGESTED IMPROVEMENTS:
${(bp.suggestedImprovements || []).map(i => `* ${i}`).join("\n")}

VIVA DEFENSE TALKING POINTS:
${(bp.vivaTalkingPoints || []).map(v => `* ${v}`).join("\n")}
    `.trim();

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryText)
        .then(() => showToast("📋 Complete project brief copied to clipboard!", "success"))
        .catch(() => fallbackCopyText(summaryText));
    } else {
      fallbackCopyText(summaryText);
    }
  });

  function fallbackCopyText(text) {
    const tempTextArea = document.createElement("textarea");
    tempTextArea.value = text;
    document.body.appendChild(tempTextArea);
    tempTextArea.select();
    document.execCommand("copy");
    document.body.removeChild(tempTextArea);
    showToast("📋 Project brief copied to clipboard!", "success");
  }

  // =========================================================================
  // History Page: Rendering & Actions
  // =========================================================================
  function renderHistoryPage() {
    const sessions = StorageManager.getSessions();

    if (!sessions || sessions.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
          </div>
          <h3>No Saved Sessions Yet</h3>
          <p>Generate project ideas with Gemini 2.0 Flash to see them saved in your session history.</p>
          <a href="#home" class="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span>Start Brainstorming Ideas</span>
          </a>
        </div>
      `;
      clearHistoryBtn.style.display = "none";
      return;
    }

    clearHistoryBtn.style.display = "inline-flex";

    historyContainer.innerHTML = `
      <div class="history-list">
        ${sessions.map((session) => {
          const formattedDate = new Date(session.timestamp).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });

          const domainName = session.inputs.domain === "Other" && session.inputs.otherDomain
            ? session.inputs.otherDomain
            : session.inputs.domain;

          return `
            <div class="history-card" data-session-id="${escapeHTML(session.id)}">
              <div class="history-card-header">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span class="idea-badge idea-1">${escapeHTML(domainName)}</span>
                  <span class="history-date">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    ${escapeHTML(formattedDate)}
                  </span>
                </div>
                <button type="button" class="btn btn-danger btn-sm delete-session-btn" data-id="${escapeHTML(session.id)}" title="Delete this session">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  <span>Delete</span>
                </button>
              </div>

              <div class="history-inputs-summary">
                <span class="history-input-item">Interests: <strong>${escapeHTML(session.inputs.interests)}</strong></span>
                <span class="history-input-item">Skills: <strong>${escapeHTML(session.inputs.skills)}</strong></span>
              </div>

              <div class="history-ideas-mini">
                ${session.ideas.map((idea, iIdx) => `
                  <div class="mini-idea-box">
                    <h5>#${iIdx + 1}. ${escapeHTML(idea.title)}</h5>
                    <p>${escapeHTML(idea.pitch || idea.shortPitch)}</p>
                  </div>
                `).join("")}
              </div>

              <div class="history-card-actions">
                <button type="button" class="btn btn-secondary btn-sm load-session-btn" data-id="${escapeHTML(session.id)}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <span>Revisit Ideas</span>
                </button>
                <button type="button" class="btn btn-primary btn-sm deepdive-session-btn" data-id="${escapeHTML(session.id)}">
                  <span>Open Deep-Dive</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;

    // Wire up events
    document.querySelectorAll(".delete-session-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("Are you sure you want to delete this saved session?")) {
          StorageManager.deleteSession(id);
          renderHistoryPage();
          updateNavBadges();
          showToast("Session deleted from history.", "success");
        }
      });
    });

    document.querySelectorAll(".load-session-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        const session = StorageManager.getSessionById(id);
        if (session) {
          StorageManager.setCurrentSession(session);
          if (session.ideas && session.ideas.length > 0) {
            StorageManager.setCurrentIdea(session.ideas[0]);
          }
          navigateTo("ideas");
        }
      });
    });

    document.querySelectorAll(".deepdive-session-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        const session = StorageManager.getSessionById(id);
        if (session && session.ideas && session.ideas.length > 0) {
          StorageManager.setCurrentSession(session);
          exploreIdea(session.ideas[0]);
        }
      });
    });
  }

  // Clear all history
  clearHistoryBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete ALL saved sessions? This cannot be undone.")) {
      StorageManager.clearAllSessions();
      renderHistoryPage();
      updateNavBadges();
      showToast("All session history cleared.", "success");
    }
  });

  // =========================================================================
  // Utility: HTML Escaping for XSS Prevention
  // =========================================================================
  function escapeHTML(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // =========================================================================
  // App Initialization
  // =========================================================================
  function init() {
    refreshApiStatus();
    updateNavBadges();
    const initialRoute = getRoute();
    renderView(initialRoute);
  }

  init();
});
