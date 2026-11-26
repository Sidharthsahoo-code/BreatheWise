import { Router } from "express"
import { airQualityForecast, currentAirQuality } from "../controllers/airQualityController"

export const airQualityRoutes = Router()

airQualityRoutes.get("/", currentAirQuality)
airQualityRoutes.get("/forecast", airQualityForecast)