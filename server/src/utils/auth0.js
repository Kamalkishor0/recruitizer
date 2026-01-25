import fetch from "node-fetch";

const {
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_DB_CONNECTION,
} = process.env;

function assertAuth0Env() {
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET || !AUTH0_DB_CONNECTION) {
    throw new Error("Auth0 is not configured. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, and AUTH0_DB_CONNECTION.");
  }
}

let cachedManagementToken = { accessToken: null, expiresAt: 0 };

async function getManagementToken() {
  assertAuth0Env();

  const now = Date.now();
  if (cachedManagementToken.accessToken && cachedManagementToken.expiresAt - 60_000 > now) {
    return cachedManagementToken.accessToken;
  }

  const response = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: `https://${AUTH0_DOMAIN}/api/v2/`,
    }),
  });

  if (!response.ok) {
    const errorBody = await safeReadJson(response);
    const message = errorBody?.error_description || errorBody?.message || "Could not fetch Auth0 management token";
    throw new Error(message);
  }

  const body = await response.json();
  cachedManagementToken = {
    accessToken: body.access_token,
    expiresAt: now + body.expires_in * 1000,
  };

  return cachedManagementToken.accessToken;
}

async function authedRequest(path, options = {}) {
  const token = await getManagementToken();

  const response = await fetch(`https://${AUTH0_DOMAIN}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  return response;
}

async function safeReadJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function createAuth0User({ email, password, fullName, role }) {
  assertAuth0Env();

  const response = await authedRequest(`/api/v2/users`, {
    method: "POST",
    body: JSON.stringify({
      connection: AUTH0_DB_CONNECTION,
      email,
      password,
      name: fullName,
      email_verified: false,
      verify_email: false,
      app_metadata: role ? { role } : undefined,
    }),
  });

  if (!response.ok) {
    const errorBody = await safeReadJson(response);
    const message = errorBody?.message || errorBody?.error || "Could not create Auth0 user";
    throw new Error(message);
  }

  return response.json();
}

export async function sendVerificationEmail(userId) {
  assertAuth0Env();

  const response = await authedRequest(`/api/v2/jobs/verification-email`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });

  if (!response.ok) {
    const errorBody = await safeReadJson(response);
    const message = errorBody?.message || "Could not send verification email";
    throw new Error(message);
  }
}

async function getUserByEmail(email) {
  const response = await authedRequest(`/api/v2/users-by-email?email=${encodeURIComponent(email)}`);
  if (!response.ok) {
    const errorBody = await safeReadJson(response);
    const message = errorBody?.message || "Could not lookup Auth0 user";
    throw new Error(message);
  }

  const users = await response.json();
  return Array.isArray(users) && users.length > 0 ? users[0] : null;
}

async function getUserById(userId) {
  const response = await authedRequest(`/api/v2/users/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    const errorBody = await safeReadJson(response);
    const message = errorBody?.message || "Could not lookup Auth0 user";
    throw new Error(message);
  }

  return response.json();
}

export async function fetchEmailVerificationStatus({ auth0UserId, email }) {
  assertAuth0Env();

  const user = auth0UserId ? await getUserById(auth0UserId) : await getUserByEmail(email);
  if (!user) {
    return { verified: false, auth0UserId: null };
  }

  return { verified: Boolean(user.email_verified), auth0UserId: user.user_id };
}
