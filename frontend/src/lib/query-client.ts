import { QueryClient } from "@tanstack/react-query"
import { ApiError } from "@/lib/api"

/** Retry network and server failures (up to 2 times), but not client errors like 404. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const clientError = error instanceof ApiError && error.status >= 400 && error.status < 500
  return failureCount < 2 && !clientError
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: shouldRetry },
    },
  })
}
