/**
 * json.parser.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Extracts and parses JSON from raw LLM output, handling markdown fences.
 */

export function extractAndParseJSON(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  
  const cleanText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleanText);
  } catch {
    return null;
  }
}
