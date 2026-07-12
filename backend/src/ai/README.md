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

Run the test suite:
```bash
node src/ai/test/testGemini.js
```
