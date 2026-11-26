import { Router } from "express"
import { searchGeocoding } from "../controllers/geocodingController"

export const geocodingRoutes = Router()

geocodingRoutes.get("/search", searchGeocoding)