import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const COOKIE = "htp_admin";
import { jwtSecret } from "./secret";
const secret = jwtSecret;

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, secret(), {
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
