require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { getMarkets, getHeroMarket } = require("./backend/polymarket");
const { analyzeBet, analyzeWithK2 } = require("./backend/lava");
const { getPnLScenarios } = require("./backend/hex");
const { getHedgeMarkets } = require("./backend/polymarket");
const { calcPosition, calcHedge, getPayoffCurve } = require("./backend/hedge");
const { getHedgeRecommendation } = require("./backend/lava");
const {
  registerAuthSignupRoutes,
  getAuth0Env,
} = require("./routes/authSignup");
const { registerAuthLoginRoutes } = require("./routes/authLogin");

const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

registerAuthSignupRoutes(app);
registerAuthLoginRoutes(app);

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

app.get("/api/hedge-markets", async (req, res) => {
  try {
    const { asset = "ETH", direction = "long" } = req.query;
    const markets = await getHedgeMarkets(asset, direction);
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/hedge-analysis", async (req, res) => {
  try {
    const { position, market } = req.body;
    const pos = calcPosition(position);
    const hedge = calcHedge({
      position: pos,
      market,
      hedgeBudget: position.hedgeBudget,
    });
    const curve = getPayoffCurve({ ...position, hedgePayout: hedge.payout });
    const analysis = await getHedgeRecommendation({ position: pos, hedge });
    res.json({ position: pos, hedge, curve, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`\n🚀  http://localhost:${PORT}`);
  console.log(
    `🔑  Lava: ${process.env.LAVA_API_KEY ? "✅ ready" : "❌ missing"}`,
  );
  const a0 = getAuth0Env();
  console.log(
    `🔐  Auth0 signup: ${a0.domain && a0.clientId ? "✅ configured" : "❌ missing domain/client_id"}`,
  );
  console.log(`🌿  CORS origin: ${FRONTEND_ORIGIN}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use — another process is listening (often an existing node server.js).\n` +
        `Fix: stop that process, or run on another port:\n` +
        `  lsof -i :${PORT}    # find PID\n` +
        `  kill <PID>\n` +
        `  # or:  PORT=3002 node server.js\n`,
    );
    process.exit(1);
  }
  throw err;
});
