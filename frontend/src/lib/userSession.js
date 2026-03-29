const STORAGE_KEY = "polyhedge_user";

export const SECTOR_LABELS = {
  finance: "Finance",
  politics: "Politics",
  technology: "Technology",
  sports: "Sports",
  science: "Science",
  geopolitics: "Geopolitics",
  culture: "Culture",
  health: "Health",
};

/** Signup sector id → Sector page `?sector=` key */
export const SECTOR_TO_PAGE = {
  finance: "finance",
  politics: "politics",
  technology: "tech",
  sports: "sports",
  science: "tech",
  geopolitics: "politics",
  culture: "all",
  health: "all",
};

function normalize(raw) {
  if (!raw?.username || !raw?.email) return null;
  return {
    ...raw,
    balance: raw.balance ?? 1000,
    streak: raw.streak ?? 0,
    wins: raw.wins ?? 0,
    losses: raw.losses ?? 0,
    watchlist: Array.isArray(raw.watchlist) ? raw.watchlist : [],
    activity: Array.isArray(raw.activity) ? raw.activity : [],
  };
}

export function saveUser(profile) {
  const payload = normalize({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    username: profile.username,
    sectors: profile.sectors,
    createdAt: profile.createdAt || new Date().toISOString(),
    balance: profile.balance ?? 1000,
    streak: 0,
    wins: 0,
    losses: 0,
    watchlist: [],
    activity: [],
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function getUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function patchUser(partial) {
  const u = getUser();
  if (!u) return null;
  const next = { ...u, ...partial };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return normalize(next);
}

export function clearUser() {
  localStorage.removeItem(STORAGE_KEY);
}
