/**
 * index.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Express router for the AI Incident Analyzer feature.
 */

import { Router } from 'express';
import { analyzeIncident } from '../services/geminiService.js';

const router = Router();

router.post('/analyze-incident', async (req, res) => {
  const { incidentReport } = req.body;

  if (!incidentReport || typeof incidentReport !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELD',
      message: 'Request body must include a non-empty "incidentReport" string.',
    });
  }

  if (incidentReport.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: 'INCIDENT_TOO_SHORT',
      message: 'Incident report is too short to analyze. Please provide more detail.',
    });
  }

  const result = await analyzeIncident(incidentReport);

  if (!result.success) {
    const statusMap = {
      INVALID_API_KEY: 500,
      AI_SERVICE_ERROR: 502,
      AI_EMPTY_RESPONSE: 502,
      AI_RESPONSE_INVALID: 422,
      INVALID_INPUT: 400,
      INCIDENT_TOO_SHORT: 400,
    };
    const status = statusMap[result.error] ?? 500;
    return res.status(status).json({
      success: false,
      error: result.error,
      ...(result.validationErrors && { validationErrors: result.validationErrors }),
    });
  }

  return res.status(200).json({ success: true, data: result.data });
});

export default router;
