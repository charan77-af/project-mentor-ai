from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

def call_gemini(prompt):
    api_key = os.environ.get("GEMINI_API_KEY", "")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as response:
        result = json.loads(response.read().decode())
        return result["candidates"][0]["content"]["parts"][0]["text"]

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = json.loads(self.rfile.read(content_length))
        domain = body.get("domain", "")
        interests = body.get("interests", "")
        skills = body.get("skills", "")
        prompt = f"""You are a final-year project mentor. Based on:
Domain: {domain}
Interests: {interests}
Skills: {skills}

Generate exactly 3 distinct project ideas. Return ONLY valid JSON, no markdown, no extra text:
[
  {{"title": "...", "pitch": "...", "difficulty": "...", "technologies": ["...", "...", "..."]}},
  {{"title": "...", "pitch": "...", "difficulty": "...", "technologies": ["...", "...", "..."]}},
  {{"title": "...", "pitch": "...", "difficulty": "...", "technologies": ["...", "...", "..."]}}
]"""
        try:
            result_text = call_gemini(prompt)
            clean = result_text.replace("```json", "").replace("```", "").strip()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(clean.encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
