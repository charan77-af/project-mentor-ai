"""
Project Mentor AI - Backend Server
Serves static frontend assets and handles Google Gemini API calls (gemini-2.0-flash)
using the GEMINI_API_KEY environment variable.
"""

import os
import sys
import json
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path

PORT = 8000
WORKSPACE_DIR = Path(__file__).resolve().parent

# Helper to load .env file if present
def load_env_file():
    env_path = WORKSPACE_DIR / ".env"
    if env_path.exists():
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip("\"'")
                        if k and not os.environ.get(k):
                            os.environ[k] = v
        except Exception as e:
            print(f"Warning loading .env: {e}", file=sys.stderr)

load_env_file()

def get_gemini_api_key():
    # Check environment variable first
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if key and key not in ("your_key_here", "YOUR_GEMINI_API_KEY", "your_api_key_here", "<your_key_here>"):
        return key

    # Dynamically check .env file
    env_path = WORKSPACE_DIR / ".env"
    if env_path.exists():
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GEMINI_API_KEY="):
                        _, v = line.split("=", 1)
                        val = v.strip().strip("\"'")
                        if val and val not in ("your_key_here", "YOUR_GEMINI_API_KEY", "your_api_key_here", "<your_key_here>"):
                            return val
        except Exception:
            pass

    return ""

def call_gemini_api(prompt_text, system_instruction=None):
    api_key = get_gemini_api_key()
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable is not set. "
            "Please set GEMINI_API_KEY in your system environment or in a .env file, then restart the server."
        )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.7,
            "maxOutputTokens": 4096
        }
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data_bytes,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as response:
            res_body = response.read().decode("utf-8")
            parsed_res = json.loads(res_body)

            # Extract generated content text from Gemini response structure
            candidates = parsed_res.get("candidates", [])
            if not candidates:
                raise RuntimeError("Gemini API returned no candidates.")

            content_parts = candidates[0].get("content", {}).get("parts", [])
            if not content_parts:
                raise RuntimeError("Gemini API candidate has no content parts.")

            raw_text = content_parts[0].get("text", "").strip()
            
            # Parse JSON returned by model
            return json.loads(raw_text)

    except urllib.error.HTTPError as e:
        error_details = e.read().decode("utf-8")
        try:
            err_json = json.loads(error_details)
            err_msg = err_json.get("error", {}).get("message", error_details)
        except Exception:
            err_msg = error_details
        raise RuntimeError(f"Google Gemini API error (HTTP {e.code}): {err_msg}")
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error connecting to Gemini API: {e.reason}")


class MentorAppRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WORKSPACE_DIR), **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/status":
            api_key = get_gemini_api_key()
            self._send_json({
                "status": "ok",
                "hasApiKey": bool(api_key),
                "model": "gemini-2.0-flash",
                "maskedKey": f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else ("Set" if api_key else "Not Set")
            })
            return
        super().do_GET()

    def do_POST(self):
        if self.path == "/api/generate-ideas":
            self.handle_generate_ideas()
        elif self.path == "/api/generate-deepdive":
            self.handle_generate_deepdive()
        else:
            self.send_error(404, "Endpoint not found")

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)
        self.wfile.flush()

    def _read_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length <= 0:
            return {}
        raw = self.rfile.read(content_length).decode("utf-8")
        return json.loads(raw)

    def handle_generate_ideas(self):
        try:
            payload = self._read_json_body()
            domain = payload.get("domain", "").strip()
            other_domain = payload.get("otherDomain", "").strip()
            effective_domain = other_domain if domain == "Other" and other_domain else domain
            interests = payload.get("interests", "").strip()
            skills = payload.get("skills", "").strip()

            if not domain or not interests or not skills:
                self._send_json({"error": "Domain, Interests, and Skills are all required."}, 400)
                return

            system_instruction = (
                "You are Project Mentor AI, an elite university engineering professor and capstone mentor. "
                "Your objective is to propose exactly 3 distinct, modern, highly feasible, industry-grade final-year project ideas. "
                "Respond strictly with valid JSON conforming to the requested schema. No conversational markdown outside the JSON."
            )

            user_prompt = f"""
Student Profile:
- Preferred Domain: {effective_domain}
- Technical Interests & Problem Areas: {interests}
- Current Skills & Tools: {skills}

Generate exactly 3 distinct, creative, yet achievable final-year capstone project ideas tailored specifically to this student.
Each idea must have:
1. "title": A professional, impressive capstone project title.
2. "pitch": A crisp 1-2 line pitch explaining the real-world gap and technical solution.
3. "difficulty": Choose from 'Intermediate', 'Advanced', or 'Advanced (Research-Grade)'.
4. "technologies": A list of 3-5 relevant, specific technologies (matching the student's skills where appropriate, plus modern tools tailored to the project, NOT generic).

JSON Schema to return:
[
  {{
    "title": "string",
    "pitch": "string",
    "difficulty": "string",
    "technologies": ["string", "string", "string"]
  }}
]
"""
            ideas = call_gemini_api(user_prompt, system_instruction)
            
            # Ensure return format is an array of 3
            if not isinstance(ideas, list):
                if isinstance(ideas, dict) and "ideas" in ideas:
                    ideas = ideas["ideas"]
                else:
                    ideas = [ideas]

            # Format for frontend compatibility
            formatted_ideas = []
            for i, item in enumerate(ideas[:3]):
                formatted_ideas.append({
                    "id": f"idea_gemini_{i + 1}_{int(os.times().elapsed * 1000)}",
                    "number": i + 1,
                    "title": item.get("title", f"{effective_domain} Project #{i + 1}"),
                    "pitch": item.get("pitch", item.get("shortPitch", "")),
                    "shortPitch": item.get("pitch", item.get("shortPitch", "")),
                    "difficulty": item.get("difficulty", "Advanced"),
                    "technologies": item.get("technologies", []),
                    "domain": effective_domain
                })

            self._send_json({"ideas": formatted_ideas})

        except ValueError as e:
            self._send_json({"error": str(e), "type": "MISSING_KEY"}, 400)
        except Exception as e:
            self._send_json({"error": str(e), "type": "GEMINI_ERROR"}, 500)

    def handle_generate_deepdive(self):
        try:
            payload = self._read_json_body()
            title = payload.get("title", "").strip()
            pitch = payload.get("pitch", payload.get("shortPitch", "")).strip()
            domain = payload.get("domain", "").strip()
            skills = payload.get("skills", "").strip()
            interests = payload.get("interests", "").strip()

            if not title:
                self._send_json({"error": "Idea title is required."}, 400)
                return

            system_instruction = (
                "You are Project Mentor AI. Provide a comprehensive, high-caliber final-year capstone deep-dive technical blueprint. "
                "Respond strictly with valid JSON conforming to the requested schema."
            )

            user_prompt = f"""
Project Details:
- Title: {title}
- Pitch: {pitch}
- Domain: {domain}
- Student's Existing Skills: {skills}
- Student's Interests: {interests}

Provide an exhaustive, professional technical blueprint for this capstone project.
Return a single JSON object containing:
1. "features": A list of 6-8 distinct functional features (distinguish 4 core MVP features and 3-4 advanced innovation features).
2. "recommendedTechStack": An object with:
   - "frontend": Recommended UI stack and libraries
   - "backend": Recommended server/framework
   - "database": Recommended database and caching
   - "specialized": Specialized tools/ML frameworks/protocols
   - "matchedSkills": List of student's skills utilized in this stack
   - "learningOpportunities": 1-2 new high-value modern technologies recommended for the student to learn
3. "roadmap": A numbered list of 4-6 step-by-step development phases/milestones (e.g. ["Step 1: Literature Review & Architecture Design (Weeks 1-3) - ...", "Step 2: Core MVP Implementation (Weeks 4-8) - ...", ...]).
4. "suggestedImprovements": A list of 3-4 forward-looking improvements or scalability avenues.
5. "vivaTalkingPoints": A list of 3 high-impact examiner questions and model defense talking points.

JSON Schema to return:
{{
  "features": ["string"],
  "recommendedTechStack": {{
    "frontend": "string",
    "backend": "string",
    "database": "string",
    "specialized": "string",
    "matchedSkills": ["string"],
    "learningOpportunities": ["string"]
  }},
  "roadmap": ["string"],
  "suggestedImprovements": ["string"],
  "vivaTalkingPoints": ["string"]
}}
"""
            blueprint = call_gemini_api(user_prompt, system_instruction)
            self._send_json({"blueprint": blueprint})

        except ValueError as e:
            self._send_json({"error": str(e), "type": "MISSING_KEY"}, 400)
        except Exception as e:
            self._send_json({"error": str(e), "type": "GEMINI_ERROR"}, 500)


def run_server(port=PORT):
    HTTPServer.allow_reuse_address = True
    server_address = ("", port)
    httpd = HTTPServer(server_address, MentorAppRequestHandler)
    print(f"Project Mentor AI Server listening on http://localhost:{port}")
    print(f"Serving files from: {WORKSPACE_DIR}")
    has_key = bool(get_gemini_api_key())
    print(f"GEMINI_API_KEY detected: {'YES' if has_key else 'NO (Set GEMINI_API_KEY to enable Gemini 2.0 Flash)'}")
    httpd.serve_forever()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run_server(port)
