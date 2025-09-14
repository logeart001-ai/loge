// Simple in-memory rate limiting (for production, use Redis or similar)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = `rate_limit:${identifier}`
  
  // Clean up expired entries
  for (const [k, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(k)
    }
  }
  
  const entry = rateLimitStore.get(key)
  
  if (!entry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      success: true,
      remaining: limit - 1,
      resetTime: now + windowMs
    }
  }
  
  if (entry.resetTime <= now) {
    // Window has expired, reset
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      success: true,
      remaining: limit - 1,
      resetTime: now + windowMs
    }
  }
  
  if (entry.count >= limit) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  return {
    success: true,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  }
}

export function getRateLimitKey(ip: string, email?: string): string {
  return email ? `${ip}:${email}` : ip
}