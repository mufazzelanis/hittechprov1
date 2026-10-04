import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE = "htp_admin";
import { jwtSecret } from "./secret";
const secret = jwtSecret;

// `tv` = the user's tokenVersion when this login happened. lib/adminAuth.js rejects the token as soon as
// the version in the database moves on (suspend, role change, password change, "sign out everywhere").
export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role, tv: user.tokenVersion || 0 }, secret(), {
    expiresIn: "7d",
  });
}

export function cookieName() {
  return COOKIE;
}

export function getSession() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const p = jwt.verify(token, secret());
    return p.role === "ADMIN" ? p : null;
  } catch {
    return null;
  }
}

// ---- Customer (non-admin) session -------------------------------------
const USER_COOKIE = "htp_user";

export function userCookieName() {
  return USER_COOKIE;
}

export function signUserToken(user) {
  return jwt.sign({ id: user.id }, secret(), { expiresIn: "30d" });
}

export function getUserId() {
  const token = cookies().get(USER_COOKIE)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, secret()).id || null;
  } catch {
    return null;
  }
}
