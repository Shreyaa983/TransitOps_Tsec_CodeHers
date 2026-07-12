# TransitOps — AI Incident Analyzer Module

This directory contains the completely isolated AI Incident Analyzer feature.

## Structure
```
src/ai/
├── prompts/     # Gemini system prompts and schemas
├── services/    # Core AI service that talks to Google
├── validators/  # JSON schema validation
├── parsers/     # Logic to extract clean JSON from markdown fences
├── routes/      # Express API routes
├── demo/        # Standalone HTML UI
└── test/        # Test runner
```

## How to use
Add your `GEMINI_API_KEY` to the `.env` file in the backend root.

Get a **free** API key at https://aistudio.google.com/apikey

### Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/ai/analyze-incident` | AI incident analysis |
| POST | `/api/ai/translate` | Multilingual UI translation via Gemini |

### Translate request body
```json
{
  "content": { "nav_dashboard": "Dashboard", "sign_in": "Sign in" },
  "targetLanguage": "Spanish"
}
```

Run the test suite:
```bash
node src/ai/test/testGemini.js
```
