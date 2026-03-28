// backend/lava.js
// ─────────────────────────────────────────────────────────
// Lava AI Gateway — forwards requests to GPT / Claude / etc
// Make sure you have LAVA_API_KEY in your .env
// ─────────────────────────────────────────────────────────

// const fetch = require("node-fetch");

const LAVA_FORWARD = "https://api.lavapayments.com/v1/forward";

// ── Core call — forwards to OpenAI-compatible endpoint ──
async function callLava(
  prompt,
  { model = "gpt-4o-mini", maxTokens = 400, temperature = 0.9 } = {},
) {
  const key = process.env.LAVA_API_KEY;
  if (!key) throw new Error("LAVA_API_KEY not set in .env");

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
        temperature, // 🔥 THIS FIXES REPETITIVE OUTPUTS
        messages: [{ role: "user", content: prompt }],
      }),
    },
  );

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));

  return data.choices?.[0]?.message?.content || "";
}

// ── BET ANALYSIS ─────────────────────────────────────────
// Now:
// - less rigid
// - more personality
// - less copy-paste outputs
// - can optionally use multiple markets for context
// ─────────────────────────────────────────────────────────
async function analyzeBet({ question, yesPct, side, amount, allMarkets = [] }) {
  const prob = side === "yes" ? yesPct / 100 : (100 - yesPct) / 100;

  const payout = amount ? (parseFloat(amount) / prob).toFixed(2) : null;

  const marketContext =
    allMarkets.length > 0
      ? `\nOther markets for context:\n${allMarkets
          .slice(0, 5)
          .map((m, i) => `${i + 1}. ${m.question} — ${m.yesPct}% YES`)
          .join("\n")}`
      : "";

  const prompt = `
You are a sharp, slightly contrarian prediction market trader.

Market:
"${question}"

YES probability: ${yesPct}%
Trader position: ${side.toUpperCase()}${amount ? ` with $${amount}` : ""}
${payout ? `Potential payout: $${payout}` : ""}

${marketContext}

Give EXACTLY 3 bullet points:
• One non-obvious insight (not generic probability talk)
• One edge / inefficiency / or why market might be wrong
• Verdict: BUY / PASS / FADE

Rules:
- No generic explanations
- Be concise but sharp
- Think like a trader, not a textbook
`;

  return callLava(prompt, {
    model: "gpt-4o-mini",
    maxTokens: 300,
    temperature: 0.9, // 🔥 KEY CHANGE
  });
}

// ── ADVANCED ANALYSIS (K2-style) ─────────────────────────
async function analyzeWithK2(prompt) {
  const enhancedPrompt = `
You are an elite quantitative trader analyzing prediction markets.

${prompt}

Focus on:
- mispricing
- probability inconsistencies
- asymmetric bets
- risk/reward clarity

Be concise but insightful.
`;

  return callLava(enhancedPrompt, {
    model: "gpt-4o-mini",
    maxTokens: 600,
    temperature: 0.85,
  });
}

module.exports = {
  callLava,
  analyzeBet,
  analyzeWithK2,
};
