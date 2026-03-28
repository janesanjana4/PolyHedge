require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { getMarkets } = require("./backend/polymarket");
const { analyzeBet } = require("./backend/lava");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) =>
  res.json({
    status: "ok",
    lava: !!process.env.LAVA_API_KEY ? "✅" : "❌",
  }),
);

app.get("/api/markets", async (req, res) => {
  try {
    const markets = await getMarkets({
      keyword: req.query.keyword || "",
      limit: parseInt(req.query.limit) || 6,
    });
    res.json({ success: true, markets });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/analyze-bet", async (req, res) => {
  try {
    const analysis = await analyzeBet(req.body);
    res.json({ success: true, analysis });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3001, () => {
  console.log("🚀 http://localhost:3001");
  console.log("🔑 Lava:", process.env.LAVA_API_KEY ? "✅" : "❌");
});
