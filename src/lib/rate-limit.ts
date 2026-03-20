/**
 * Rate limiter with Upstash Redis (distributed, works across serverless instances).
 * Falls back to in-memory if UPSTASH env vars are not configured.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// --- Upstash (distributed) ---
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Cache of Ratelimit instances per (maxRequests, windowMs) combo
const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const cacheKey = `${maxRequests}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs} ms`),
      prefix: 'app-rl',
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// --- In-memory fallback (single instance only) ---
const hits = new Map<string, number[]>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;
const MAX_KEYS = 10_000; // Prevent unbounded growth under high traffic

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, timestamps] of hits) {
    const filtered = timestamps.filter(t => t > cutoff);
    if (filtered.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, filtered);
    }
  }
  // Evict oldest entries if map is too large
  if (hits.size > MAX_KEYS) {
    const toDelete = hits.size - MAX_KEYS;
    const iter = hits.keys();
    for (let i = 0; i < toDelete; i++) {
      const next = iter.next();
      if (!next.done) hits.delete(next.value);
    }
  }
}

function rateLimitMemory(key: string, maxRequests: number, windowMs: number): boolean {
  cleanup(windowMs);
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (hits.get(key) || []).filter(t => t > cutoff);
  if (timestamps.length >= maxRequests) return false;
  timestamps.push(now);
  hits.set(key, timestamps);
  return true;
}

// --- Public API (same signature, now async-capable) ---

/**
 * Check if a request should be rate-limited.
 * Uses Upstash Redis if configured, otherwise falls back to in-memory.
 * @param key - Unique identifier (e.g. userId or IP)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns true if the request is allowed, false if rate-limited
 */
export async function rateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  if (redis) {
    try {
      const limiter = getUpstashLimiter(maxRequests, windowMs);
      const { success } = await limiter.limit(key);
      return success;
    } catch (err) {
      console.error('Upstash rate limit error, falling back to memory:', err);
      return rateLimitMemory(key, maxRequests, windowMs);
    }
  }
  return rateLimitMemory(key, maxRequests, windowMs);
}
