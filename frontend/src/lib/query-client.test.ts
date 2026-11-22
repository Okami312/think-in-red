import { ApiError } from "@/lib/api"
import { createQueryClient, shouldRetry } from "@/lib/query-client"

describe("query client", () => {
  it.each([
    ["a network failure", new ApiError(0, "Can't reach the server"), true],
    ["a server error", new ApiError(500, "Internal error"), true],
    ["an unexpected exception", new TypeError("boom"), true],
    ["a 404", new ApiError(404, "Not found"), false],
    ["a 401", new ApiError(401, "Unauthorized"), false],
    ["a 400", new ApiError(400, "Bad request"), false],
  ])("retries %s: %s", (_label, error, expected) => {
    expect(shouldRetry(0, error)).toBe(expected)
  })

  it("gives up after two retries", () => {
    const error = new ApiError(503, "Unavailable")
    expect(shouldRetry(1, error)).toBe(true)
    expect(shouldRetry(2, error)).toBe(false)
  })

  it("uses the retry rule and keeps data fresh for 30 seconds", () => {
    const defaults = createQueryClient().getDefaultOptions().queries
    expect(defaults?.retry).toBe(shouldRetry)
    expect(defaults?.staleTime).toBe(30_000)
  })
})
