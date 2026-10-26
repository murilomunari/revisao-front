import { createHmac, createHash, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "product_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds

function configuredPassword(): string | null {
  const password = process.env.APP_PASSWORD;
  return password && password.length > 0 ? password : null;
}

export function passwordMatches(candidate: unknown): boolean {
  const password = configuredPassword();
  if (!password || typeof candidate !== "string" || candidate.length === 0) return false;
  const expected = createHash("sha256").update(password).digest();
  const supplied = createHash("sha256").update(candidate).digest();
  return timingSafeEqual(expected, supplied);
}

function signature(expiresAt: number, password: string): string {
  return createHmac("sha256", password).update(`session:${expiresAt}`).digest("hex");
}

export function createSessionToken(now = Date.now()): string | null {
  const password = configuredPassword();
  if (!password) return null;
  const expiresAt = now + SESSION_MAX_AGE * 1000;
  return `${expiresAt}.${signature(expiresAt, password)}`;
}

export function isSessionValid(token: string | undefined, now = Date.now()): boolean {
  const password = configuredPassword();
  if (!password || !token || !/^\d{13}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expiresText, suppliedSignature] = token.split(".");
  const expiresAt = Number(expiresText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + SESSION_MAX_AGE * 1000) return false;
  const expected = Buffer.from(signature(expiresAt, password), "hex");
  const supplied = Buffer.from(suppliedSignature, "hex");
  return timingSafeEqual(expected, supplied);
}
