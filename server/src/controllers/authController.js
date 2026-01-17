import { User } from "../models/user.js";
import { validateToken } from "../utils/authentication.js";

export function renderSignin(req, res) {
  res.json({ message: "Render signin page" });
}

export function renderSignup(req, res) {
  res.json({ message: "Render signup page" });
}

export async function signin(req, res) {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);

    const user = validateToken(token);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ token, user });
  } catch (err) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
}

export async function signup(req, res) {
  const { fullName, email, password, role } = req.body ?? {};

  if (!fullName || !email || !password) {
    return res
      .status(400)
      .json({ error: "Full name, email, and password are required." });
  }

  const payload = {
    fullName,
    email,
    password,
    role,
  };

  try {
    await User.create(payload);
    return res.redirect("/");
  } catch (err) {
    return res.status(400).json({ error: "Could not create account." });
  }
}

export function logout(req, res) {
  return res.clearCookie("token").redirect("/");
}

export function me(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({ user: req.user });
}
