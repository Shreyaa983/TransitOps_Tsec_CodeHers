/**
 * geminiService.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Core AI service — the single integration point with Google Gemini.
 */

import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION, buildIncidentPrompt } from '../prompts/prompts.js';
import { validateAIResponse } from '../validators/validateAIResponse.js';
import { extractAndParseJSON } from '../parsers/json.parser.js';

let _client = null;

export function getClient() {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set. Add it to your .env file.');
    }
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

const MODEL_ID = 'gemini-3.5-flash';

export async function analyzeIncident(incidentReport) {
  if (!incidentReport || typeof incidentReport !== 'string') {
    return { success: false, error: 'INVALID_INPUT' };
  }

  const trimmed = incidentReport.trim();
  if (trimmed.length < 5) return { success: false, error: 'INCIDENT_TOO_SHORT' };

  try {
    const client = getClient();
    const response = await client.models.generateContent({
      model: MODEL_ID,
      contents: buildIncidentPrompt(trimmed),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        topP: 0.8,
        topK: 10,
        responseMimeType: 'text/plain',
      },
    });

    const rawText = response.text?.trim() ?? '';
    if (!rawText) return { success: false, error: 'AI_EMPTY_RESPONSE' };

    const parsed = extractAndParseJSON(rawText);
    if (!parsed) {
      console.error('[geminiService] JSON parse failed. Raw output:\n', rawText);
      return { success: false, error: 'AI_RESPONSE_INVALID' };
    }

    const { valid, errors, data } = validateAIResponse(parsed);
    if (!valid) {
      console.error('[geminiService] Schema validation failed:', errors);
      return { success: false, error: 'AI_RESPONSE_INVALID', validationErrors: errors };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[geminiService] API call failed:', err.message);
    const errorCode = err.message?.includes('API_KEY') ? 'INVALID_API_KEY' : 'AI_SERVICE_ERROR';
    return { success: false, error: errorCode };
  }
}

export async function chatWithCopilot(message, fleetContext = {}) {
  if (!message || typeof message !== 'string') {
    return { success: false, error: 'INVALID_INPUT' };
  }

  const trimmed = message.trim();
  if (!trimmed) return { success: false, error: 'EMPTY_MESSAGE' };

  try {
    const client = getClient();
    const systemInstruction = `You are the AI Copilot for TransitOps, an enterprise commercial fleet management and transit operations system.
Your job is to answer the fleet manager's questions clearly, concisely, and helpfully.
If the question relates to the fleet status, use the provided fleet context summary to give factual, accurate numbers and details.
Keep responses conversational, natural, and friendly—easy to read and also natural when spoken aloud via Text-to-Speech (keep answers under 3-4 sentences unless detailed analysis is requested). Do NOT use complex markdown tables if it can be explained clearly in bullet points or sentences.`;

    const contextSummary = JSON.stringify(fleetContext, null, 2);
    const prompt = `FLEET CONTEXT SUMMARY:\n${contextSummary}\n\nUSER QUESTION:\n"${trimmed}"\n\nProvide a clear, helpful answer:`;

    const response = await client.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
        topP: 0.8,
        topK: 20,
        responseMimeType: 'text/plain',
      },
    });

    const rawText = response.text?.trim() ?? '';
    if (!rawText) return { success: false, error: 'AI_EMPTY_RESPONSE' };

    return { success: true, answer: rawText };
  } catch (err) {
    console.error('[geminiService] chatWithCopilot API call failed:', err.message);
    const errorCode = err.message?.includes('API_KEY') ? 'INVALID_API_KEY' : 'AI_SERVICE_ERROR';
    return { success: false, error: errorCode };
  }
}

