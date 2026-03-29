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

function loginUsernameFallback(email, nickname) {
  const raw = String(nickname || email.split("@")[0] || "user")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  const base = raw || "user";
  return base.length >= 3 ? base : `${base}usr`.slice(0, 16);
}

function cleanLoginNickname(nickname) {
  if (!nickname) return "";
  const s = String(nickname)
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return s.length >= 3 ? s : "";
}

/**
 * Sync local paper-trading profile after Auth0 login (userinfo / id_token claims).
 * Preserves balance & stats when the email matches; clears and recreates when switching accounts.
 */
export function mergeProfileAfterLogin(profile) {
  const email = (profile.email || "").trim();
  if (!email) return null;
  const existing = getUser();
  const same =
    existing && existing.email?.toLowerCase() === email.toLowerCase();
  if (existing && !same) clearUser();
  const base = same ? existing : null;

  if (base) {
    return patchUser({
      firstName: profile.given_name || base.firstName,
      lastName: profile.family_name || base.lastName,
      username: cleanLoginNickname(profile.nickname) || base.username,
    });
  }

  return saveUser({
    firstName: profile.given_name || "",
    lastName: profile.family_name || "",
    email,
    username: loginUsernameFallback(email, profile.nickname),
    sectors: [],
  });
}
