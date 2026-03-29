// backend/hex.js
// ─────────────────────────────────────────────────────────
// Hex — Data analytics workspace
// Used for: P&L curves, payoff charts, scenario analysis
// Key: HEX_API_TOKEN in .env
// Get key: https://app.hex.tech → Settings → API
// Docs: https://learn.hex.tech/docs/api/api-reference
// ─────────────────────────────────────────────────────────
// const fetch = require("node-fetch");

const HEX_BASE = "https://app.hex.tech/api/v1";

// ── Run a Hex project (notebook) with input params ───────
// Returns run status + output data from the notebook
async function runHexProject(projectId, inputParams = {}) {
  const token = process.env.HEX_API_TOKEN;
  if (!token) throw new Error("HEX_API_TOKEN not set in .env");

  const res = await fetch(`${HEX_BASE}/project/${projectId}/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputParams }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Hex error: ${JSON.stringify(data)}`);
  return data;
}

// ── Get status of a Hex run ──────────────────────────────
async function getRunStatus(projectId, runId) {
  const token = process.env.HEX_API_TOKEN;
  if (!token) throw new Error("HEX_API_TOKEN not set in .env");

  const res = await fetch(`${HEX_BASE}/project/${projectId}/run/${runId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.json();
}

// ── PLACEHOLDER: P&L scenario analysis ──────────────────
// Wire this to a real Hex notebook that takes a market
// probability + stake and returns a payoff curve dataset
async function getPnLScenarios({ question, yesPct, amount }) {
  // TODO: replace HEX_PROJECT_ID with your actual project ID
  const projectId = process.env.HEX_PROJECT_ID;

  if (!projectId) {
    // Return mock data until Hex notebook is built
    console.warn("HEX_PROJECT_ID not set — returning mock P&L data");
    return mockPnL({ yesPct, amount });
  }

  return runHexProject(projectId, { question, yesPct, amount });
}

// Mock P&L until Hex is wired up
function mockPnL({ yesPct, amount = 100 }) {
  const scenarios = [];
  for (let p = 10; p <= 90; p += 10) {
    const yesProb = p / 100;
    const payout = parseFloat(amount) / (yesPct / 100);
    const pnl = p >= yesPct ? payout - amount : -amount;
    scenarios.push({ probability: p, pnl: parseFloat(pnl.toFixed(2)) });
  }
  return { mock: true, scenarios };
}

export { runHexProject, getRunStatus, getPnLScenarios };
