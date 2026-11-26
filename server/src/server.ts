import { app } from "./app.js"
import { env } from "./config/env.js"

const server = app.listen(env.PORT, () => {
  console.log(`BreatheWise API running on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  if (!env.geminiConfigured) {
    console.warn("GEMINI_API_KEY is not set. AI endpoints will return an error until you add it to server/.env")
  }
})

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down...`)
  server.close(() => process.exit(0))
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))