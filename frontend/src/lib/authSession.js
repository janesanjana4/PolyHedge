const KEY = "polyhedge_auth";

/** @typedef {{ access_token?: string, id_token?: string, expires_at?: number | null, token_type?: string, refresh_token?: string | null }} StoredAuth */

/**
 * @param {{ access_token?: string, id_token?: string, expires_in?: number, token_type?: string, refresh_token?: string }} tokens
 */
export function setAuthTokens(tokens) {
  const payload = {
    access_token: tokens.access_token,
    id_token: tokens.id_token,
    token_type: tokens.token_type,
    refresh_token: tokens.refresh_token ?? null,
    expires_at:
      typeof tokens.expires_in === "number"
        ? Date.now() + tokens.expires_in * 1000
        : null,
  };
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

/** @returns {StoredAuth | null} */
export function getAuthTokens() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthTokens() {
  sessionStorage.removeItem(KEY);
}

export function hasAuthTokens() {
  const t = getAuthTokens();
  return !!(t && t.access_token);
}
