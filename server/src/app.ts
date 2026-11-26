import express from "express"
import cors from "cors"
import helmet from "helmet"
import { env } from "./config/env.js"
import { apiLimiter } from "./middleware/rateLimiter.js"
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js"
import { geocodingRoutes } from "./routes/geocodingRoutes.js"
import { airQualityRoutes } from "./routes/airQualityRoutes.js"

export const app = express()

// Render runs behind a proxy; needed for correct client IPs in rate limiting
app.set("trust proxy", 1)

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser calls (health checks, curl) and configured frontend origins only
      if (!origin || env.clientOrigins.includes(origin)) return callback(null, true)
      return callback(null, false)
    },
  })
)
app.use(express.json({ limit: "100kb" }))
app.use("/api", apiLimiter)

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: env.NODE_ENV,
    geminiConfigured: env.geminiConfigured,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
})

app.use("/api/geocoding", geocodingRoutes)
app.use("/api/air-quality", airQualityRoutes)
// Phase 4: app.use("/api/ai", aiRoutes)

app.use(notFoundHandler)
app.use(errorHandler)