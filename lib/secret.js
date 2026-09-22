// One place for the signing secret. In production a missing or weak secret must stop the app from issuing
// tokens: falling back to a public default would let anyone forge an admin login cookie.
export function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!s || s.length < 32 || s === "dev-secret") throw new Error("JWT_SECRET must be set to a random string of 32+ characters in production.");
    return s;
  }
  return s || "dev-secret";
}
