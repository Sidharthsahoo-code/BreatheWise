import type { NextFunction, Request, Response } from "express"
import { ZodError } from "zod"
import { env } from "../config/env.js"

export class AppError extends Error {
  statusCode: number
  code: string
  details?: unknown

  constructor(message: string, statusCode = 500, code = "INTERNAL_ERROR", details?: unknown) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, "NOT_FOUND"))
}

// Every error leaves the API in this shape: { error: { code, message, details? } }
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data.",
        details: err.flatten().fieldErrors,
      },
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    })
  }

  // Errors from express.json(): malformed JSON (400) or a body over the size limit (413)
  const bodyStatus = (err as { status?: number } | null)?.status
  if (bodyStatus === 400 || bodyStatus === 413) {
    return res.status(bodyStatus).json({
      error: {
        code: bodyStatus === 413 ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST",
        message: bodyStatus === 413 ? "The request is too large." : "The request body is not valid JSON.",
      },
    })
  }

  if (!env.isProd) console.error(err)

  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." },
  })
}