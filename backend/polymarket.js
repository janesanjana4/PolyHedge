// backend/polymarket.js
// ─────────────────────────────────────────────────────────
// Polymarket Gamma API — NO KEY NEEDED, fully public
// Docs: https://docs.polymarket.com
// ─────────────────────────────────────────────────────────
const fetch = require("node-fetch");

const GAMMA_BASE = "https://gamma-api.polymarket.com";

function formatVolume(n) {
  n = parseFloat(n) || 0;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function normalizeMarket(m) {
  let prices = [0.5, 0.5];
  try {
    prices = JSON.parse(m.outcomePrices || "[0.5,0.5]");
  } catch (_) {}
  const yesPct = Math.round(parseFloat(prices[0]) * 100);
  return {
    id: m.id,
    question: m.question,
    slug: m.slug,
    category: m.tags?.[0] || "general",
    yesPct,
    noPct: 100 - yesPct,
    volume: parseFloat(m.volume || 0),
    volumeFmt: formatVolume(m.volume),
    liquidity: parseFloat(m.liquidity || 0),
    endDate: m.endDate || null,
  };
}

// Fetch markets — no auth needed
async function getMarkets({ keyword = "", limit = 6 } = {}) {
  let url = `${GAMMA_BASE}/markets?active=true&closed=false&limit=${limit}`;
  if (keyword) url += `&search=${encodeURIComponent(keyword)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Polymarket error: ${res.status}`);
  const data = await res.json();
  const raw = Array.isArray(data) ? data : data.markets || [];
  return raw.map(normalizeMarket);
}

// Get single top-volume market for hero card
async function getHeroMarket() {
  const markets = await getMarkets({ limit: 10 });
  return markets.sort((a, b) => b.volume - a.volume)[0] || null;
}

module.exports = { getMarkets, getHeroMarket };
