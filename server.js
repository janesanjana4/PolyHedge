// server.js — entry point
// Imports all logic from backend/ folder
// Run: node server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// ── Import backend modules ───────────────────────────────
const { getMarkets, getHeroMarket } = require("./backend/polymarket");
const { analyzeBet, analyzeWithK2 } = require("./backend/lava");
const { getPnLScenarios } = require("./backend/hex");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── HEALTH ───────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    keys: {
      lava: !!process.env.LAVA_API_KEY ? "✅ set" : "❌ missing",
      hex: !!process.env.HEX_API_TOKEN ? "✅ set" : "⚠️  not set (optional)",
      polymarket: "✅ no key needed",
    },
    routes: [
      "GET  /api/health",
      "GET  /api/markets?keyword=bitcoin&limit=6",
      "GET  /api/markets/hero",
      "POST /api/analyze-bet   { question, yesPct, side, amount }",
      "POST /api/pnl           { question, yesPct, amount }",
    ],
  });
});

// ── POLYMARKET — no key needed ───────────────────────────
app.get("/api/markets", async (req, res) => {
  try {
    const { keyword = "", limit = 6 } = req.query;
    const markets = await getMarkets({ keyword, limit: parseInt(limit) });
    res.json({ success: true, count: markets.length, markets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/markets/hero", async (req, res) => {
  try {
    const market = await getHeroMarket();
    if (!market)
      return res
        .status(404)
        .json({ success: false, error: "No markets found" });
    res.json({ success: true, market });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── LAVA + K2 — needs LAVA_API_KEY ──────────────────────
app.post("/api/analyze-bet", async (req, res) => {
  const { question, yesPct, side, amount } = req.body;
  if (!question || yesPct === undefined || !side) {
    return res
      .status(400)
      .json({ success: false, error: "question, yesPct, side required" });
  }
  try {
    const analysis = await analyzeBet({ question, yesPct, side, amount });
    res.json({ success: true, analysis, model: "gpt-4o-mini via Lava" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── HEX — needs HEX_API_TOKEN (optional for now) ────────
app.post("/api/pnl", async (req, res) => {
  const { question, yesPct, amount } = req.body;
  try {
    const data = await getPnLScenarios({ question, yesPct, amount });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── START ────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀  http://localhost:${PORT}`);
  console.log(`📡  Polymarket  → ✅ public (no key)`);
  console.log(
    `🤖  Lava / K2   → ${process.env.LAVA_API_KEY ? "✅ ready" : "❌ add LAVA_API_KEY to .env"}`,
  );
  console.log(
    `📊  Hex         → ${process.env.HEX_API_TOKEN ? "✅ ready" : "⚠️  add HEX_API_TOKEN to .env (optional)"}`,
  );
  console.log(`\n🌐  http://localhost:${PORT}/PolymarketLandingPage.html\n`);
});
