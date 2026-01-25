import bcrypt from "bcrypt";
import { User } from "../models/user.js";
import { createTokenForUser } from "../utils/authentication.js";
import { createAuth0User, sendVerificationEmail, fetchEmailVerificationStatus } from "../utils/auth0.js";

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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const verification = await fetchEmailVerificationStatus({ auth0UserId: user.auth0UserId, email: user.email });

    if (!verification.verified) {
      if (!user.auth0UserId && verification.auth0UserId) {
        user.auth0UserId = verification.auth0UserId;
        await user.save();
      }
      return res.status(403).json({ error: "Please verify your email before signing in." });
    }

    if (!user.emailVerified || (!user.auth0UserId && verification.auth0UserId)) {
      user.emailVerified = true;
      if (verification.auth0UserId) {
        user.auth0UserId = verification.auth0UserId;
      }
      await user.save();
    }

    const token = createTokenForUser(user);
    const userPayload = {
      _id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({ token, user: userPayload });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to sign in";
    return res.status(500).json({ error: message });
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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Account already exists. Please sign in." });
    }

    const auth0User = await createAuth0User({
      email,
      password,
      fullName,
      role,
    });

    await sendVerificationEmail(auth0User.user_id);

    await User.create({
      ...payload,
      auth0UserId: auth0User.user_id,
      emailVerified: false,
    });

    return res
      .status(201)
      .json({ message: "Account created. Check your email to verify before signing in." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create account.";
    return res.status(400).json({ error: message });
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
