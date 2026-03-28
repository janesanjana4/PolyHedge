// backend/polymarket.js
// ─────────────────────────────────────────────────────────
// Polymarket Gamma API — robust search (hybrid)
// ─────────────────────────────────────────────────────────

const fetch = require("node-fetch");

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
    // ── STEP 1: try Polymarket search (fast path) ──
    let url = `${GAMMA_BASE}/markets?active=true&closed=false&limit=${limit}`;

    if (keyword) {
      url += `&search=${encodeURIComponent(keyword)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Polymarket error: ${res.status}`);

    const data = await res.json();
    const raw = Array.isArray(data) ? data : data.markets || [];

    let markets = raw.map(normalizeMarket);

    // ── STEP 2: fallback if search failed ──
    if (keyword && markets.length === 0) {
      console.log("⚠️ search empty → fallback filtering");

      const fallbackRes = await fetch(
        `${GAMMA_BASE}/markets?active=true&closed=false&limit=50`,
      );

      if (!fallbackRes.ok)
        throw new Error(`Fallback fetch error: ${fallbackRes.status}`);

      const fallbackData = await fallbackRes.json();
      const fallbackRaw = Array.isArray(fallbackData)
        ? fallbackData
        : fallbackData.markets || [];

      const k = keyword.toLowerCase();

      markets = fallbackRaw.map(normalizeMarket).filter((m) => {
        const text = (m.question + " " + m.category).toLowerCase();
        return text.includes(k);
      });
    }

    // ── STEP 3: final fallback (never return empty) ──
    if (markets.length === 0) {
      console.log("⚠️ no matches → returning trending");

      const fallbackRes = await fetch(
        `${GAMMA_BASE}/markets?active=true&closed=false&limit=${limit}`,
      );

      const fallbackData = await fallbackRes.json();
      const fallbackRaw = Array.isArray(fallbackData)
        ? fallbackData
        : fallbackData.markets || [];

      return fallbackRaw.map(normalizeMarket);
    }

    return markets.slice(0, limit);
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

// ── EXPORTS ───────────────────────────────────────────────
module.exports = { getMarkets, getHeroMarket };
