/**
 * validateAIResponse.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Validates the raw JSON object returned by Gemini against the expected schema.
 * Returns { valid: true, data } on success or { valid: false, errors: [...] }.
 */

const REQUIRED_KEYS = [
  'category',
  'subcategory',
  'severity',
  'confidence',
  'summary',
  'recommendedAction',
  'estimatedDowntime',
  'requiresImmediateStop',
  'dispatchAllowed',
  'likelyParts',
];

const VALID_SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

export function validateAIResponse(data) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Response is not a JSON object'] };
  }

  for (const key of REQUIRED_KEYS) {
    if (!(key in data)) {
      errors.push(`Missing required field: "${key}"`);
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  if (typeof data.category !== 'string' || data.category.trim() === '') errors.push('"category" must be a non-empty string');
  if (typeof data.subcategory !== 'string' || data.subcategory.trim() === '') errors.push('"subcategory" must be a non-empty string');
  if (!VALID_SEVERITIES.includes(data.severity)) errors.push(`"severity" must be one of: ${VALID_SEVERITIES.join(', ')}`);
  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1) errors.push('"confidence" must be a number between 0 and 1');
  if (typeof data.summary !== 'string' || data.summary.trim() === '') errors.push('"summary" must be a non-empty string');
  if (typeof data.recommendedAction !== 'string' || data.recommendedAction.trim() === '') errors.push('"recommendedAction" must be a non-empty string');
  if (typeof data.estimatedDowntime !== 'string' || data.estimatedDowntime.trim() === '') errors.push('"estimatedDowntime" must be a non-empty string');
  if (typeof data.requiresImmediateStop !== 'boolean') errors.push('"requiresImmediateStop" must be a boolean');
  if (typeof data.dispatchAllowed !== 'boolean') errors.push('"dispatchAllowed" must be a boolean');
  if (!Array.isArray(data.likelyParts)) errors.push('"likelyParts" must be an array');

  if (data.requiresImmediateStop === true && data.dispatchAllowed === true) {
    data.dispatchAllowed = false;
  }

  if (errors.length > 0) return { valid: false, errors };

  return { valid: true, errors: [], data };
}
