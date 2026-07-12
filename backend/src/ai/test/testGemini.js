/**
 * testGemini.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Standalone test runner for the AI Incident Analyzer.
 */

import 'dotenv/config';
import { analyzeIncident } from '../services/geminiService.js';

const C = { reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', magenta: '\x1b[35m', white: '\x1b[37m' };
const severityColour = { Low: C.green, Medium: C.yellow, High: `\x1b[33m`, Critical: C.red };

const TEST_INCIDENTS = [
  { id: 1, label: 'Engine Knock + Oil Pressure', report: 'Engine making loud knocking noise. Oil pressure warning light is ON. Smoke coming from under the hood.' },
  { id: 2, label: 'Soft Brake Pedal', report: 'Brake pedal feels very soft and goes almost to the floor before engaging. Had to pump brakes three times to stop.' },
  { id: 3, label: 'Battery Warning Light', report: 'Battery warning light blinking on dashboard. Headlights dimming intermittently while driving.' },
  { id: 4, label: 'Transmission Slipping', report: 'Transmission slipping between 2nd and 3rd gear. RPM surges but speed does not increase.' },
  { id: 5, label: 'Oil Leak', report: 'Oil leaking underneath the vehicle, forming a puddle in the parking spot overnight. Smell of burning oil.' },
];

function printResult(incident, result, durationMs) {
  const line = '─'.repeat(72);
  console.log(`\n${C.bold}${C.cyan}${line}${C.reset}`);
  console.log(`${C.bold}[${incident.id}/${TEST_INCIDENTS.length}] ${incident.label}${C.reset} ${C.dim}(${durationMs}ms)${C.reset}`);
  console.log(`${C.dim}Report: "${incident.report}"${C.reset}`);
  if (!result.success) {
    console.log(`${C.red}✗ FAILED — ${result.error}${C.reset}`);
    return;
  }
  const d = result.data;
  const dispatchIcon = d.dispatchAllowed ? `${C.green}✔ YES${C.reset}` : `${C.red}✘ NO${C.reset}`;
  console.log(`  ${C.bold}Level:${C.reset} ${severityColour[d.severity] ?? C.white}${d.severity}${C.reset}, Dispatch: ${dispatchIcon}`);
  console.log(`  ${C.bold}Summary:${C.reset} ${d.summary}`);
}

async function runTests() {
  let passed = 0, failed = 0;
  for (const incident of TEST_INCIDENTS) {
    const t0 = Date.now();
    const result = await analyzeIncident(incident.report);
    printResult(incident, result, Date.now() - t0);
    result.success ? passed++ : failed++;
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\nResults: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error(`${C.red}Fatal error:${C.reset}`, err.message);
  process.exit(1);
});
