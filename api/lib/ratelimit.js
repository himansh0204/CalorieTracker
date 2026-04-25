import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

function makeRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

const redis = makeRedis()

// 10 image analyses per user per minute
export const imageAnalysisLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 m'), prefix: 'rl:img' })
  : null

// 30 analytics events per user per minute
export const analyticsEventLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1 m'), prefix: 'rl:evt' })
  : null

// 60 meal logs per user per minute
export const mealLogLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'), prefix: 'rl:meal' })
  : null

// 5 weekly report generations per user per hour
export const weeklyReportLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h'), prefix: 'rl:report' })
  : null

export async function checkLimit(limiter, identifier) {
  if (!limiter) return true  // Upstash not configured — allow through
  const { success } = await limiter.limit(identifier)
  return success
}
