/**
 * prompts.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Central store for all prompts used by the AI Incident Analyzer.
 * Keeping prompts here makes it easy to iterate without touching business logic.
 */

/**
 * System instruction fed to Gemini as the model-level persona.
 * Strict, safety-first, JSON-only output.
 */
export const SYSTEM_INSTRUCTION = `You are an expert commercial fleet maintenance AI assistant. 
Your ONLY task is to interpret vehicle incident reports from drivers who are describing sensory observations (what they see, hear, smell, or feel) rather than technical fault diagnoses, and convert them into structured maintenance information.

STRICT RULES:
1. Always return ONLY valid JSON — no explanations, no markdown, no code fences.
2. Never add extra keys beyond the schema.
3. Never omit required keys.
4. If observations are insufficient to make a precise diagnosis, do NOT invent one. Instead:
   - Lower the confidence score.
   - Explain in the summary or recommendedAction that more information is needed.
   - Provide the SAFEST reasonable recommendation (e.g. stop the vehicle).
5. Always prioritize human safety over operational continuity.
6. Confidence must be a float between 0.0 and 1.0.
7. severity must be exactly one of: "Low" | "Medium" | "High" | "Critical"
8. category must be one of: "Engine" | "Transmission" | "Brakes" | "Electrical" | "Fuel System" | "Cooling System" | "Steering" | "Suspension" | "Exhaust" | "Tires" | "HVAC" | "General"`;

/**
 * JSON schema description embedded in the user-facing prompt so Gemini
 * knows exactly what output shape is expected.
 */
export const RESPONSE_SCHEMA = `{
  "category": "<string — vehicle system affected>",
  "subcategory": "<string — specific sub-system>",
  "severity": "<Low | Medium | High | Critical>",
  "confidence": <float 0.0–1.0>,
  "summary": "<string — concise technical summary of the issue>",
  "recommendedAction": "<string — clear actionable instruction for the mechanic>",
  "estimatedDowntime": "<string — e.g. '2-4 hours' or 'Unknown'>",
  "requiresImmediateStop": <true | false>,
  "dispatchAllowed": <true | false>,
  "likelyParts": ["<part name>", ...]
}`;

/**
 * Builds the complete user-turn prompt for a given incident report.
 * @param {string} incidentReport - Raw text from the fleet manager / driver.
 * @returns {string}
 */
export function buildIncidentPrompt(incidentReport) {
  return `INCIDENT REPORT:
"""
${incidentReport.trim()}
"""

Analyze this incident report and return a JSON object matching this exact schema:
${RESPONSE_SCHEMA}

Return the JSON object only. No other text.`;
}
