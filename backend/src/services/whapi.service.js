import { env } from '../config/env.js';

const WHAPI_SEND_URL = `${env.whapiBaseUrl}/messages/text`;

/**
 * Normalize a phone number to Whapi format: digits only, international, no leading +.
 * e.g. "+254 700 123 456" → "254700123456"
 */
export function normalizePhone(phone, defaultCountryCode = env.whapiDefaultCountryCode) {
  if (!phone) return '';

  let digits = String(phone).replace(/\D/g, '');

  if (digits.startsWith('0') && defaultCountryCode) {
    digits = `${defaultCountryCode}${digits.slice(1)}`;
  }

  return digits;
}

/**
 * Send a plain-text WhatsApp message via Whapi.
 * Returns the API response body on success; throws on failure.
 */
export async function sendWhatsAppText(toPhone, body) {
  if (!env.whapiEnabled) {
    return { skipped: true, reason: 'WHAPI_ENABLED is false' };
  }

  if (!env.whapiToken) {
    throw new Error('WHAPI_TOKEN is not configured');
  }

  const to = normalizePhone(toPhone);
  if (!to) {
    throw new Error('Invalid recipient phone number');
  }

  const response = await fetch(WHAPI_SEND_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${env.whapiToken}`,
    },
    body: JSON.stringify({ to, body }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data?.message || data?.error || response.statusText;
    throw new Error(`Whapi error (${response.status}): ${detail}`);
  }

  return data;
}
