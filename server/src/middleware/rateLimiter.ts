import rateLimit from "express-rate-limit"
import { env } from "../config/env.js"

const handler = (message: string) => (_req: unknown, res: any) =>
  res.status(429).json({ error: { code: "RATE_LIMITED", message } })

// General limiter for all /api routes
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("Too many requests. Please slow down and try again shortly."),
})

// Stricter limiter for Gemini endpoints (they cost money and quota)
export const aiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: handler("AI request limit reached. Please wait a minute before asking again."),
})