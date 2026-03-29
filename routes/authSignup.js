/**
 * POST /auth/signup — proxy to Auth0 Database /dbconnections/signup
 * https://auth0.com/docs/api/authentication#signup
 *
 * Env (server / root .env):
 *   AUTH0_DOMAIN or VITE_AUTH0_DOMAIN
 *   AUTH0_CLIENT_ID or VITE_AUTH0_CLIENT_ID
 *   AUTH0_CLIENT_SECRET or VITE_AUTH0_CLIENT_SECRET (optional for this endpoint; reserved for future token routes)
 *   AUTH0_DB_CONNECTION (default Username-Password-Authentication)
 */

function getAuth0Env() {
  const rawDomain =
    process.env.AUTH0_DOMAIN || process.env.VITE_AUTH0_DOMAIN || "";
  const domain = rawDomain
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "")
    .trim();
  const clientId =
    process.env.AUTH0_CLIENT_ID || process.env.VITE_AUTH0_CLIENT_ID || "";
  const clientSecret =
    process.env.AUTH0_CLIENT_SECRET ||
    process.env.VITE_AUTH0_CLIENT_SECRET ||
    "";
  const connection =
    process.env.AUTH0_DB_CONNECTION || "Username-Password-Authentication";
  return { domain, clientId, clientSecret, connection };
}

function validateSignupBody(body) {
  const errors = [];
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) errors.push({ field: "email", message: "Email is required" });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push({ field: "email", message: "Invalid email format" });

  if (!password) errors.push({ field: "password", message: "Password is required" });
  else if (password.length < 8)
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters",
    });

  return { email, password, errors };
}

function buildUserMetadata(body) {
  const meta = {};
  if (body.firstName) meta.first_name = String(body.firstName).trim();
  if (body.lastName) meta.last_name = String(body.lastName).trim();
  if (body.username) meta.username = String(body.username).trim();
  // Auth0 Database signup: user_metadata values must be strings (not arrays/objects).
  if (Array.isArray(body.sectors) && body.sectors.length) {
    meta.sectors = body.sectors.map(String).join(",");
  }
  return Object.keys(meta).length ? meta : undefined;
}

async function auth0Signup({ domain, clientId, connection, email, password, user_metadata }) {
  const url = `https://${domain}/dbconnections/signup`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      email,
      password,
      connection,
      ...(user_metadata ? { user_metadata } : {}),
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { description: text || "Invalid response from Auth0" };
  }

  return { ok: res.ok, status: res.status, data };
}

function formatAuth0Error(data) {
  if (!data || typeof data !== "object") return "Signup was rejected";
  if (data.description) return String(data.description);
  if (data.message) return String(data.message);
  if (typeof data.error === "string") return data.error;
  if (data.error && typeof data.error === "object" && data.error.message)
    return String(data.error.message);
  if (data.name && data.code) return `${data.name} (${data.code})`;
  if (data.code) return `Auth0: ${data.code}`;
  try {
    return JSON.stringify(data);
  } catch {
    return "Signup was rejected";
  }
}

/**
 * @param {import("express").Express} app
 */
function registerAuthSignupRoutes(app) {
  app.post("/auth/signup", async (req, res) => {
    const { domain, clientId, connection } = getAuth0Env();

    if (!domain || !clientId) {
      return res.status(503).json({
        success: false,
        error:
          "Auth0 is not configured. Set AUTH0_DOMAIN and AUTH0_CLIENT_ID (or VITE_* aliases) in the server .env file.",
      });
    }

    const { email, password, errors } = validateSignupBody(req.body || {});
    if (errors.length) {
      console.warn("[auth/signup] validation failed", errors, {
        hasBody: !!req.body,
        keys: req.body && typeof req.body === "object" ? Object.keys(req.body) : [],
      });
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    const user_metadata = buildUserMetadata(req.body);

    try {
      const { ok, status, data } = await auth0Signup({
        domain,
        clientId,
        connection,
        email,
        password,
        user_metadata,
      });

      if (!ok) {
        const message = formatAuth0Error(data);
        console.warn("[auth/signup] Auth0 rejected signup", {
          status,
          connection,
          message,
          auth0: data,
        });
        return res.status(status >= 400 && status < 600 ? status : 400).json({
          success: false,
          error: message,
          auth0: data,
        });
      }

      return res.status(201).json({
        success: true,
        message: "User created. You can sign in once email verification is complete (if enabled in Auth0).",
        email,
      });
    } catch (err) {
      return res.status(502).json({
        success: false,
        error: err.message || "Failed to reach Auth0",
      });
    }
  });
}

module.exports = { registerAuthSignupRoutes, getAuth0Env, validateSignupBody };
