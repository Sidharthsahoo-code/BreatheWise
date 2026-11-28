import { Router } from "express"
import { chat, dailyPlan, indoorAdvice, recommendations } from "../controllers/aiController.js"
import { aiLimiter } from "../middleware/rateLimiter.js"

export const aiRoutes = Router()

// Stricter limit: every request here costs Gemini quota
aiRoutes.use(aiLimiter)

aiRoutes.post("/recommendations", recommendations)
aiRoutes.post("/chat", chat)
aiRoutes.post("/indoor-advice", indoorAdvice)
aiRoutes.post("/daily-plan", dailyPlan)