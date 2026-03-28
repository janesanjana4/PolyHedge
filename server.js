require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { getMarkets, getHeroMarket } = require("./backend/polymarket");
const { analyzeBet, analyzeWithK2 } = require("./backend/lava");
const { getPnLScenarios } = require("./backend/hex");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", lava: !!process.env.LAVA_API_KEY ? "✅" : "❌" });
});

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

app.post("/api/pnl", async (req, res) => {
  const { question, yesPct, amount } = req.body;
  try {
    const data = await getPnLScenarios({ question, yesPct, amount });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀  http://localhost:${PORT}`);
  console.log(
    `🔑  Lava: ${process.env.LAVA_API_KEY ? "✅ ready" : "❌ missing"}`,
  );
  console.log(`\n🌐  http://localhost:${PORT}/PolymarketLandingPage.html\n`);
});
