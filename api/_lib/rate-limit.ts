/**
 * Best-effort per-IP rate limit for Vercel serverless functions.
 *
 * This is in-memory, so it only protects within a single warm lambda instance -
 * it resets on cold start and isn't shared across concurrent instances. That's
 * enough to blunt a naive retry loop or script hitting one instance, but it is
 * not a real defense against distributed abuse. For that, put a shared store
 * (e.g. Upstash Redis) behind this instead.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map<string, { count: number; resetAt: number }>();

function pruneExpired(now: number) {
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  pruneExpired(now);

  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

export function getClientIp(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.socket?.remoteAddress ?? "unknown";
}
