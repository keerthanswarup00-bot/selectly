export async function retryableRequest<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number
    baseDelay?: number
    onRetry?: (attempt: number, error: unknown) => void
  },
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3
  const baseDelay = options?.baseDelay ?? 1000

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxRetries - 1) throw error
      options?.onRetry?.(attempt + 1, error)
      await new Promise((resolve) => setTimeout(resolve, baseDelay * Math.pow(2, attempt)))
    }
  }

  throw new Error("Max retries exceeded")
}
