# Project Mentor AI — Powered by Google Gemini 2.0 Flash

A modern web application engineered to guide final-year undergraduate and graduate engineering / computer science students in discovering, generating, refining, and deep-diving into capstone project ideas using **Google Gemini 2.0 Flash** (`gemini-2.0-flash`).

---

## 🌟 Key Features

### 1. Home / Input Page (`#home`)
- Input form capturing:
  - **Interests**: Technical and problem spaces (e.g., *Clinical radiology, Autonomous drone delivery, Smart agricultural IoT*).
  - **Skills**: Comma-separated languages, libraries, and frameworks with interactive **Quick Add** chips (Python, React, PyTorch, Flutter, Node.js, Docker, etc.).
  - **Preferred Domain**: Web Dev, AI/ML, Mobile, IoT, Cybersecurity, or Other (with custom domain specification).
- Form validation preventing empty submissions with accessible `aria-invalid` error messages.
- Real-time **Gemini 2.0 Flash status indicator** in the navbar.

### 2. Ideas Showcase Page (`#ideas`)
- Queries Google Gemini API (`gemini-2.0-flash`) and returns **exactly 3 distinct project ideas as JSON**:
  - `title`: Professional project title.
  - `pitch`: 1-2 line crisp pitch articulating the problem and solution.
  - `difficulty`: Difficulty tier (e.g. *Intermediate*, *Advanced*, *Research-Grade*).
  - `technologies`: List of 3-5 specific, relevant technologies tailored to the student's actual inputs (not generic).
- **"Explore this idea"** button triggers an on-demand Gemini deep-dive request.
- **"Regenerate Ideas"** button requests a fresh set from Gemini with the same parameters.

### 3. On-Demand Deep-Dive Page (`#deep-dive`)
- When a student clicks **"Explore this idea"**, Project Mentor AI sends the selected idea's title, pitch, and domain context to Gemini 2.0 Flash, which returns:
  1. **Features**: List of core MVP and advanced capabilities.
  2. **Recommended Tech Stack**: Frontend, Backend, Database, and Specialized tools, highlighting matched skills vs. recommended new learnings.
  3. **Step-by-Step Development Roadmap**: Numbered milestones (e.g., Step 1 through Step 4+).
  4. **Suggested Improvements**: Future scope, scalability avenues, and viva defense talking points for the project evaluation panel.
- **Export & Print**: Dedicated print stylesheet optimized for exporting clean PDF briefs for professors.
- **Copy Brief**: One-click markdown summary copy to clipboard.

### 4. History Page (`#history`)
- Automatically saves all generated sessions into browser `localStorage`.
- Revisit past ideas, reload deep-dive blueprints, or delete sessions.

---

## 🔑 Setting the `GEMINI_API_KEY`

The backend reads your Google Gemini API key from the `GEMINI_API_KEY` environment variable (or from a local `.env` file).

### Method 1: In PowerShell / Terminal
```powershell
$env:GEMINI_API_KEY="your_google_gemini_api_key_here"
python server.py
```

### Method 2: In a `.env` File
Create a file named `.env` in the project root directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```
Then start the server:
```powershell
python server.py
```

---

## 🚀 Running the Application

Start the backend server (which serves both the static web frontend and the Gemini API endpoints):
```powershell
python server.py 8000
```
Then open your browser to:
```
http://localhost:8000
```

---

## 📂 Architecture Overview

```
problem st pr/
├── server.py             # Python server handling static assets and Gemini 2.0 Flash API
├── index.html            # Semantic HTML5 multi-page structure with ARIA accessibility
├── css/
│   ├── main.css          # Design system, CSS variables, dark theme, transitions
│   └── components.css    # Form styles, card grids, roadmap timeline, alerts, print CSS
├── js/
│   ├── app.js            # App coordinator, routing, async Gemini requests, error handling
│   ├── generator.js      # Gemini 2.0 Flash API client (/api/generate-ideas, /api/generate-deepdive)
│   ├── storage.js        # LocalStorage session and blueprint state manager
│   └── validation.js     # Form input validator and error handler
└── README.md             # Documentation and setup guide
```
