import type { NextFunction, Request, Response } from "express"
import { z } from "zod"
import { getAirQualityForecast, getCurrentAirQuality } from "../services/openMeteoService"

const coordinate = (min: number, max: number) =>
  z.string().trim().min(1).transform(Number).pipe(z.number().min(min).max(max))

const coordsSchema = z.object({
  latitude: coordinate(-90, 90),
  longitude: coordinate(-180, 180),
})

const forecastSchema = coordsSchema.extend({
  pastDays: z.coerce.number().int().min(0).max(7).default(1),
  forecastDays: z.coerce.number().int().min(1).max(5).default(3),
})

export async function currentAirQuality(req: Request, res: Response, next: NextFunction) {
  try {
    const { latitude, longitude } = coordsSchema.parse(req.query)
    res.json(await getCurrentAirQuality(latitude, longitude))
  } catch (err) {
    next(err)
  }
}

export async function airQualityForecast(req: Request, res: Response, next: NextFunction) {
  try {
    const { latitude, longitude, pastDays, forecastDays } = forecastSchema.parse(req.query)
    res.json(await getAirQualityForecast(latitude, longitude, pastDays, forecastDays))
  } catch (err) {
    next(err)
  }
}