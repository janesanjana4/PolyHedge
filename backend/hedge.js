function calcPosition({ entry, leverage, size, side }) {
  const liqMove = 1 / leverage;
  const liqPrice =
    side === "long" ? entry * (1 - liqMove) : entry * (1 + liqMove);

  return {
    entry,
    leverage,
    size,
    side,
    liqPrice: Math.round(liqPrice),
    notional: size * leverage,
    maxLoss: -size,
    breakEvenMove: `-${(liqMove * 100).toFixed(1)}%`,
  };
}

function calcHedge({ position, market, hedgeBudget }) {
  const prob = market.yesPct / 100;
  const payout = hedgeBudget / prob;
  const coverage = Math.round((payout / position.size) * 100);
  const netWorstCase = -(position.size - payout);
  const correlationScore = prob < 0.35 ? "high" : prob < 0.6 ? "medium" : "low";

  return {
    market,
    hedgeBudget,
    payout: parseFloat(payout.toFixed(2)),
    coverage,
    netWorstCase: parseFloat(netWorstCase.toFixed(2)),
    correlationScore,
    scenarios: {
      tradeWinsHedgeExpires: position.size - hedgeBudget,
      tradeLiquidatedHedgePays: netWorstCase,
    },
  };
}

function getPayoffCurve({
  entry,
  leverage,
  size,
  side,
  hedgeBudget,
  hedgePayout,
}) {
  const points = [];
  const priceMin = entry * 0.65;
  const priceMax = entry * 1.35;
  const liqMove = 1 / leverage;
  const liqPrice =
    side === "long" ? entry * (1 - liqMove) : entry * (1 + liqMove);

  for (let i = 0; i <= 100; i++) {
    const price = priceMin + (priceMax - priceMin) * (i / 100);
    let unhedged, hedged;

    if (side === "long") {
      unhedged =
        price <= liqPrice
          ? -size
          : Math.min(((price - entry) / entry) * size * leverage, size * 0.5);
      hedged = price <= liqPrice ? -size + hedgePayout : unhedged - hedgeBudget;
    } else {
      unhedged =
        price >= liqPrice
          ? -size
          : Math.min(((entry - price) / entry) * size * leverage, size * 0.5);
      hedged = price >= liqPrice ? -size + hedgePayout : unhedged - hedgeBudget;
    }

    points.push({
      price: Math.round(price),
      unhedged: parseFloat(unhedged.toFixed(2)),
      hedged: parseFloat(hedged.toFixed(2)),
    });
  }

  return { points, liqPrice: Math.round(liqPrice) };
}

module.exports = { calcPosition, calcHedge, getPayoffCurve };
