import { API } from "../data/constants";

/**
 * @param {{ email: string, password: string, firstName?: string, lastName?: string, username?: string, sectors?: string[] }} payload
 */
export async function signupWithAuth0(payload) {
  const res = await fetch(`${API}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const fromDetails =
      Array.isArray(data.details) && data.details.length
        ? data.details.map((d) => d.message).join(" ")
        : null;
    const msg =
      data.error || fromDetails || data.message || `Signup failed (${res.status})`;
    const err = new Error(msg);
    err.details = data.details;
    err.auth0 = data.auth0;
    throw err;
  }

  return data;
}
