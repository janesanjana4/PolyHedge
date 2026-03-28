// backend/lava.js
// ─────────────────────────────────────────────────────────
// Lava AI Gateway — forwards requests to GPT, Claude, K2
// Key: LAVA_API_KEY in .env (format: aks_live_xxxx)
// Get key: https://www.lava.so/sign-up ($10 free)
// Docs: https://www.lavapayments.com/docs/api-reference
// ─────────────────────────────────────────────────────────
const fetch = require("node-fetch");

const LAVA_FORWARD = "https://api.lavapayments.com/v1/forward";

// ── Core call — forwards to any OpenAI-compatible endpoint ──
async function callLava(
  prompt,
  { model = "gpt-4o-mini", maxTokens = 400 } = {},
) {
  const key = process.env.LAVA_API_KEY;
  if (!key) throw new Error("LAVA_API_KEY not set in .env");

  // Lava format: POST /forward?u=<target_url>
  const targetUrl = "https://api.openai.com/v1/chat/completions";
  const res = await fetch(
    `${LAVA_FORWARD}?u=${encodeURIComponent(targetUrl)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data.choices?.[0]?.message?.content || "";
}

// ── Analyze a prediction market bet ─────────────────────
// Used by POST /api/analyze-bet
async function analyzeBet({ question, yesPct, side, amount }) {
  const prob = side === "yes" ? yesPct / 100 : (100 - yesPct) / 100;
  const payout = amount ? (parseFloat(amount) / prob).toFixed(2) : null;

  const prompt = `You are a sharp prediction market analyst. Be brief — 3 bullet points max.

Market: "${question}"
YES probability: ${yesPct}%
Trader betting: ${side.toUpperCase()}${amount ? ` with $${amount}` : ""}
${payout ? `Potential payout: $${payout}` : ""}

Give:
• Is this good value? (one sentence)
• Biggest risk
• Verdict: BUY / PASS / RISKY

No preamble.`;

  return callLava(prompt, { model: "gpt-4o-mini", maxTokens: 300 });
}

// ── K2 Think — deep reasoning (swap model when ready) ────
// To use K2: change model to "k2-think-v2"
// Costs more credits but gives step-by-step reasoning
async function analyzeWithK2(prompt) {
  return callLava(prompt, { model: "gpt-4o-mini", maxTokens: 600 });
  // TODO: swap to k2-think-v2 once confirmed working
  // return callLava(prompt, { model: "k2-think-v2", maxTokens: 600 });
}

module.exports = { callLava, analyzeBet, analyzeWithK2 };
