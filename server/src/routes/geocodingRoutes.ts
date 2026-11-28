import { Router } from "express"
import { searchGeocoding } from "../controllers/geocodingController.js"

export const geocodingRoutes = Router()

geocodingRoutes.get("/search", searchGeocoding)