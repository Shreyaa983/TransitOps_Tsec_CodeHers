/**
 * translateService.js
 * Gemini-powered UI string translation (structured JSON output).
 */

import { getClient } from './geminiService.js';
import { extractAndParseJSON } from '../parsers/json.parser.js';

/** Free-tier model — fast, cheap, reliable JSON output */
const MODEL_ID = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `You are a professional website localization and internationalization AI.
Your task is to translate the provided JSON strings accurately into the target language.

STRICT RULES:
1. Preserve all JSON keys exactly as they are. Only translate the string values.
2. Maintain all HTML tags, variable placeholders (like {name} or {{count}}), and markdown formatting untouched inside the values.
3. Return ONLY valid JSON matching the exact key structure of the input. No explanations or code blocks.`;

/**
 * @param {Record<string, string> | string[]} content
 * @param {string} targetLanguage - e.g. "Spanish", "Hindi", "fr"
 */
export async function translateContent(content, targetLanguage) {
  if (!content || !targetLanguage) {
    return { success: false, error: 'MISSING_INPUT' };
  }

  try {
    const entries = Array.isArray(content) ? content.map(k => [k, k]) : Object.entries(content);
    if (entries.length === 0) {
      return { success: true, data: {} };
    }

    const CHUNK_SIZE = 150;
    const chunks = [];
    for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
      const chunkObj = Object.fromEntries(entries.slice(i, i + CHUNK_SIZE));
      chunks.push(chunkObj);
    }

    const client = getClient();

    const translateChunk = async (chunkObj) => {
      const response = await client.models.generateContent({
        model: MODEL_ID,
        contents: JSON.stringify(chunkObj),
        config: {
          systemInstruction: `${SYSTEM_INSTRUCTION}\n\nTarget language: "${targetLanguage}"`,
          temperature: 0.1,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      });

      const rawText = response.text?.trim() ?? '';
      if (!rawText) throw new Error('AI_EMPTY_RESPONSE');

      const parsed = extractAndParseJSON(rawText);
      if (!parsed) throw new Error('AI_RESPONSE_INVALID');

      return parsed;
    };

    const results = await Promise.all(chunks.map(chunk => translateChunk(chunk)));
    const mergedData = Object.assign({}, ...results);

    return { success: true, data: mergedData };
  } catch (err) {
    console.error('[translateService] API call failed:', err.message);
    const errorCode = err.message?.includes('API_KEY') ? 'INVALID_API_KEY' : 'AI_SERVICE_ERROR';
    return { success: false, error: errorCode };
  }
}
