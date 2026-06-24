/**
 * Rate limit simples em memória (por instância serverless).
 * Evita rajadas de convites / chamadas Auth desnecessárias.
 */
const store = new Map();

function consumeRateLimit(key, { limit = 3, windowMs = 120_000 } = {}) {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
  }

  bucket.count += 1;
  store.set(key, bucket);

  if (bucket.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true, retryAfterSec: 0 };
}

module.exports = { consumeRateLimit };
