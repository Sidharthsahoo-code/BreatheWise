import type { NextFunction, Request, Response } from "express"
import type { z } from "zod"
import {
  answerQuestion,
  chatRequestSchema,
  createDailyPlan,
  createIndoorAdvice,
  createRecommendations,
  dailyPlanRequestSchema,
  indoorRequestSchema,
  recommendationsRequestSchema,
} from "../services/recommendationService"

// Validates the body, runs the AI feature, and forwards any error to the error handler
function handle<S extends z.ZodType>(schema: S, run: (input: z.output<S>) => Promise<unknown>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await run(schema.parse(req.body)))
    } catch (err) {
      next(err)
    }
  }
}

export const recommendations = handle(recommendationsRequestSchema, createRecommendations)
export const chat = handle(chatRequestSchema, answerQuestion)
export const indoorAdvice = handle(indoorRequestSchema, createIndoorAdvice)
export const dailyPlan = handle(dailyPlanRequestSchema, createDailyPlan)