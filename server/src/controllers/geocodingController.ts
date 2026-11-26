import type { NextFunction, Request, Response } from "express"
import { z } from "zod"
import { searchLocations } from "../services/openMeteoService"

const querySchema = z.object({
  q: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
  count: z.coerce.number().int().min(1).max(10).default(6),
})

export async function searchGeocoding(req: Request, res: Response, next: NextFunction) {
  try {
    const { q, count } = querySchema.parse(req.query)
    const results = await searchLocations(q, count)
    // An empty list is a valid answer; the client shows an empty state for it
    res.json({ query: q, results })
  } catch (err) {
    next(err)
  }
}