import { validateToken } from "../utils/authentication.js";

function extractToken(req) {
  const authHeader = req.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return req.cookies?.token ?? null;
}

export function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = validateToken(token);
    req.user = payload;
  } catch (err) {
    req.user = undefined;
  }

  return next();
}
