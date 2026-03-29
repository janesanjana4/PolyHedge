// backend/polymarket.js
// ─────────────────────────────────────────────────────────
// Polymarket Gamma API — robust search (hybrid)
// ─────────────────────────────────────────────────────────

// const fetch = require("node-fetch");

const GAMMA_BASE = "https://gamma-api.polymarket.com";

// ── helpers ───────────────────────────────────────────────
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
    question: m.question || "Unknown market",
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

// ── MAIN FUNCTION ─────────────────────────────────────────
async function getMarkets({ keyword = "", limit = 6 } = {}) {
  try {
    // Fetch a large pool sorted by volume
    const res = await fetch(
      `${GAMMA_BASE}/markets?active=true&closed=false&limit=1000&order=volume&ascending=false`,
    );
    if (!res.ok) throw new Error(`Polymarket error: ${res.status}`);

    const data = await res.json();
    const raw = Array.isArray(data) ? data : data.markets || [];
    const all = raw.map(normalizeMarket);

    // No keyword → return top markets by volume
    if (!keyword) return all.slice(0, limit);

    // Filter client-side
    const k = keyword.toLowerCase();
    const filtered = all.filter((m) =>
      (m.question + " " + m.slug + " " + m.category).toLowerCase().includes(k),
    );

    return filtered.slice(0, limit);
  } catch (err) {
    console.error("❌ getMarkets error:", err.message);
    return [];
  }
}

// ── HERO MARKET ───────────────────────────────────────────
async function getHeroMarket() {
  const markets = await getMarkets({ limit: 10 });

  if (!markets.length) return null;

  return markets.sort((a, b) => b.volume - a.volume)[0];
}

async function getHedgeMarkets(asset = "ETH", direction = "long") {
  const keywords =
    direction === "long"
      ? [`${asset} below`, "recession", "oil above", "crash"]
      : [`${asset} above`, "ceasefire", "rally", "risk"];

  const results = await Promise.all(
    keywords.map((kw) => getMarkets({ keyword: kw, limit: 3 })),
  );

  const seen = new Set();
  return results
    .flat()
    .filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 4);
}

// ── EXPORTS ───────────────────────────────────────────────
module.exports = { getMarkets, getHeroMarket, getHedgeMarkets };
