/**
 * Project Mentor AI - Form Validation and Accessibility Helpers
 * Provides accessible client-side validation for project input form.
 */

const FormValidator = (() => {
  const VALID_DOMAINS = ["Web Dev", "AI/ML", "Mobile", "IoT", "Cybersecurity", "Other"];

  /**
   * Validate form fields
   * @param {Object} data { interests, skills, domain, otherDomain }
   * @returns {Object} { isValid: boolean, errors: { [field]: string } }
   */
  function validate(data) {
    const errors = {};

    // Validate Interests
    const interests = (data.interests || "").trim();
    if (!interests) {
      errors.interests = "Please enter your technical or application interests (e.g., Healthcare, Smart Grid, FinTech).";
    } else if (interests.length < 3) {
      errors.interests = "Interests description should be at least 3 characters long for better recommendations.";
    }

    // Validate Skills
    const skills = (data.skills || "").trim();
    if (!skills) {
      errors.skills = "Please enter at least one skill or programming language you know (e.g., Python, React, Java).";
    } else if (skills.length < 2) {
      errors.skills = "Please specify valid skills or technologies.";
    }

    // Validate Domain
    const domain = (data.domain || "").trim();
    if (!domain) {
      errors.domain = "Please select a preferred project domain from the dropdown.";
    } else if (!VALID_DOMAINS.includes(domain)) {
      errors.domain = "Invalid domain selected. Please choose from the available options.";
    }

    // Validate Other Domain if chosen
    if (domain === "Other") {
      const otherDomain = (data.otherDomain || "").trim();
      if (!otherDomain) {
        errors.otherDomain = "Please specify your custom domain.";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Render accessible error messages directly into the DOM
   */
  function displayErrors(formElement, errors) {
    clearErrors(formElement);

    let firstErrorElement = null;

    Object.entries(errors).forEach(([field, message]) => {
      const input = formElement.querySelector(`[name="${field}"]`) || formElement.querySelector(`#${field}`);
      const errorSpan = formElement.querySelector(`#${field}-error`);

      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.classList.add("input-error");
        
        if (errorSpan) {
          errorSpan.textContent = message;
          errorSpan.classList.add("visible");
          input.setAttribute("aria-describedby", `${field}-error`);
        }

        if (!firstErrorElement) {
          firstErrorElement = input;
        }
      }
    });

    // Auto-focus the first element with an error for accessibility
    if (firstErrorElement) {
      firstErrorElement.focus();
    }
  }

  /**
   * Reset all error states on the form
   */
  function clearErrors(formElement) {
    if (!formElement) return;

    const invalidInputs = formElement.querySelectorAll('[aria-invalid="true"]');
    invalidInputs.forEach(input => {
      input.removeAttribute("aria-invalid");
      input.classList.remove("input-error");
    });

    const errorSpans = formElement.querySelectorAll(".error-message");
    errorSpans.forEach(span => {
      span.textContent = "";
      span.classList.remove("visible");
    });
  }

  /**
   * Clear error for a single field when user starts typing/changing it
   */
  function clearFieldError(formElement, field) {
    if (!formElement) return;
    const input = formElement.querySelector(`[name="${field}"]`) || formElement.querySelector(`#${field}`);
    const errorSpan = formElement.querySelector(`#${field}-error`);

    if (input) {
      input.removeAttribute("aria-invalid");
      input.classList.remove("input-error");
    }
    if (errorSpan) {
      errorSpan.textContent = "";
      errorSpan.classList.remove("visible");
    }
  }

  return {
    VALID_DOMAINS,
    validate,
    displayErrors,
    clearErrors,
    clearFieldError
  };
})();

// Attach to window
if (typeof window !== "undefined") {
  window.FormValidator = FormValidator;
}
