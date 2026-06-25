import { logger } from "@/lib/logger"

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, context)
    this.name = "ValidationError"
  }
}

export class AuthError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "AUTH_ERROR", 401, context)
    this.name = "AuthError"
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "NOT_FOUND", 404, context)
    this.name = "NotFoundError"
  }
}

export class PermissionError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "PERMISSION_ERROR", 403, context)
    this.name = "PermissionError"
  }
}

export function handleApiError(
  error: unknown,
  context: string,
  defaultMessage = "Internal server error",
): { error: string; status: number } {
  if (error instanceof AppError) {
    logger.warn(context, error.message, { code: error.code, ...error.context })
    return { error: error.message, status: error.statusCode }
  }

  logger.error(context, "Unhandled error", {
    error: error instanceof Error ? error.message : error,
  })

  return { error: defaultMessage, status: 500 }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof AppError) return error.message
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return fallback
}
