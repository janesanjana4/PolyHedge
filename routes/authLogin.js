/**
 * POST /auth/login — Resource Owner Password + realm (custom form, no Universal Login redirect).
 * Requires a confidential app with client_secret and "Password" grant enabled in Auth0.
 *
 * https://auth0.com/docs/api/authentication#resource-owner-password
 */

const { getAuth0Env } = require("./authSignup");

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return {};
  const parts = token.split(".");
  if (parts.length < 2) return {};
  let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  try {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  } catch {
    return {};
  }
}

function validateLoginBody(body) {
  const errors = [];
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email) errors.push({ field: "email", message: "Email is required" });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push({ field: "email", message: "Invalid email format" });
  if (!password) errors.push({ field: "password", message: "Password is required" });
  return { email, password, errors };
}

function formatTokenError(data) {
  if (!data || typeof data !== "object") return "Login failed";
  if (data.error_description) return String(data.error_description);
  if (data.description) return String(data.description);
  if (data.message) return String(data.message);
  if (typeof data.error === "string") return data.error;
  try {
    return JSON.stringify(data);
  } catch {
    return "Login failed";
  }
}

async function fetchUserInfo(domain, accessToken) {
  const res = await fetch(`https://${domain}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function tokenAudienceFields() {
  const audience =
    process.env.AUTH0_AUDIENCE || process.env.VITE_AUTH0_AUDIENCE;
  return audience ? { audience } : {};
}

async function postOAuthToken(domain, payload) {
  const url = `https://${domain}/oauth/token`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error_description: text || "Invalid Auth0 response" };
  }
  return { ok: res.ok, status: res.status, data };
}

/** Password + realm (preferred when multiple DB connections exist). */
async function exchangePasswordRealm({
  domain,
  clientId,
  clientSecret,
  realm,
  email,
  password,
}) {
  return postOAuthToken(domain, {
    grant_type: "http://auth0.com/oauth/grant-type/password-realm",
    username: email,
    password,
    client_id: clientId,
    client_secret: clientSecret,
    realm,
    scope: "openid profile email",
    ...tokenAudienceFields(),
  });
}

/** Legacy ROPG — some tenants accept this when password-realm is disabled. */
async function exchangePasswordLegacy({
  domain,
  clientId,
  clientSecret,
  connection,
  email,
  password,
}) {
  return postOAuthToken(domain, {
    grant_type: "password",
    username: email,
    password,
    client_id: clientId,
    client_secret: clientSecret,
    connection,
    scope: "openid profile email",
    ...tokenAudienceFields(),
  });
}

function shouldRetryWithLegacyPassword(data) {
  if (!data || typeof data !== "object") return false;
  if (data.error !== "unauthorized_client") return false;
  const d = String(data.error_description || "").toLowerCase();
  return (
    d.includes("password-realm") ||
    d.includes("grant type") ||
    d.includes("not allowed for the client")
  );
}

const AUTH0_PASSWORD_GRANT_HINT =
  "In Auth0: use application type Regular Web Application (not SPA), then Applications → your app → Settings → Advanced → Grant Types → enable Password. Save. SPA apps cannot use this flow.";

function buildProfile(userinfo, idClaims) {
  const u = userinfo || {};
  return {
    sub: u.sub || idClaims.sub,
    email: u.email || idClaims.email,
    email_verified: u.email_verified ?? idClaims.email_verified,
    name: u.name || idClaims.name,
    nickname: u.nickname || idClaims.nickname,
    given_name: u.given_name || idClaims.given_name,
    family_name: u.family_name || idClaims.family_name,
    picture: u.picture || idClaims.picture,
  };
}

function registerAuthLoginRoutes(app) {
  app.post("/auth/login", async (req, res) => {
    const { domain, clientId, clientSecret, connection } = getAuth0Env();

    if (!domain || !clientId) {
      return res.status(503).json({
        success: false,
        error:
          "Auth0 is not configured. Set AUTH0_DOMAIN and AUTH0_CLIENT_ID in the server .env.",
      });
    }
    if (!clientSecret) {
      return res.status(503).json({
        success: false,
        error:
          "Login requires AUTH0_CLIENT_SECRET (Resource Owner Password grant). Add it to the server .env only — never in Vite.",
      });
    }

    const { email, password, errors } = validateLoginBody(req.body || {});
    if (errors.length) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    try {
      let { ok, status, data } = await exchangePasswordRealm({
        domain,
        clientId,
        clientSecret,
        realm: connection,
        email,
        password,
      });

      if (!ok && shouldRetryWithLegacyPassword(data)) {
        console.warn("[auth/login] retrying with grant_type=password + connection");
        const second = await exchangePasswordLegacy({
          domain,
          clientId,
          clientSecret,
          connection,
          email,
          password,
        });
        ok = second.ok;
        status = second.status;
        data = second.data;
      }

      if (!ok) {
        const message = formatTokenError(data);
        console.warn("[auth/login] Auth0 token error", { status, message, raw: data });
        const body = {
          success: false,
          error: message,
          auth0: data,
        };
        if (
          data?.error === "unauthorized_client" ||
          String(message).includes("Grant type")
        ) {
          body.hint = AUTH0_PASSWORD_GRANT_HINT;
        }
        return res.status(status >= 400 && status < 600 ? status : 401).json(body);
      }

      const access_token = data.access_token;
      const id_token = data.id_token;
      const idClaims = decodeJwtPayload(id_token);
      const userinfo = access_token
        ? await fetchUserInfo(domain, access_token)
        : null;
      const profile = buildProfile(userinfo, idClaims);

      return res.json({
        success: true,
        tokens: {
          access_token,
          id_token,
          expires_in: data.expires_in,
          token_type: data.token_type,
          refresh_token: data.refresh_token,
        },
        profile,
      });
    } catch (err) {
      console.warn("[auth/login]", err);
      return res.status(502).json({
        success: false,
        error: err.message || "Failed to reach Auth0",
      });
    }
  });
}

module.exports = { registerAuthLoginRoutes };
