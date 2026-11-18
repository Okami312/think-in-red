import { api, ApiError, getToken, setToken, setUnauthorizedHandler } from "@/lib/api"
import { jsonResponse, mockFetch } from "@/test/utils"

describe("api client", () => {
  let fetchMock: ReturnType<typeof mockFetch>
  beforeEach(() => {
    fetchMock = mockFetch()
    setToken(null)
    setUnauthorizedHandler(null)
  })

  it("calls the configured API URL and returns JSON", async () => {
    fetchMock.mockReturnValue(jsonResponse([{ id: 1 }]))
    await expect(api("/products")).resolves.toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/products", expect.objectContaining({ method: "GET" }))
  })

  it("sends JSON bodies and the Bearer token only when auth is requested", async () => {
    setToken("abc")
    fetchMock.mockReturnValue(jsonResponse({}))
    await api("/products", { method: "POST", body: { name: "X" }, auth: true })
    const [, init] = fetchMock.mock.calls[0]
    expect(init?.headers).toEqual({ "Content-Type": "application/json", Authorization: "Bearer abc" })
    expect(init?.body).toBe(JSON.stringify({ name: "X" }))

    fetchMock.mockClear()
    await api("/products")
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual({})
  })

  it("returns undefined for 204 No Content", async () => {
    fetchMock.mockReturnValue(jsonResponse(undefined, 204))
    await expect(api("/products/1", { method: "DELETE" })).resolves.toBeUndefined()
  })

  it("joins Nest validation messages into one error", async () => {
    fetchMock.mockReturnValue(jsonResponse({ message: ["name should not be empty", "price must be ≥ 0"] }, 400))
    await expect(api("/products", { method: "POST", body: {} })).rejects.toEqual(
      new ApiError(400, "name should not be empty, price must be ≥ 0"),
    )
  })

  it("uses a string message, or the status text for non-JSON errors", async () => {
    fetchMock.mockReturnValueOnce(jsonResponse({ message: "Product with ID 9 not found" }, 404))
    await expect(api("/products/9")).rejects.toMatchObject({ status: 404, message: "Product with ID 9 not found" })

    fetchMock.mockReturnValueOnce(jsonResponse(undefined, 502, "Bad Gateway"))
    await expect(api("/products")).rejects.toMatchObject({ status: 502, message: "Bad Gateway" })
  })

  it("reports network failures as status 0 with a helpful message", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"))
    await expect(api("/products")).rejects.toMatchObject({ status: 0, message: expect.stringContaining("backend") })
  })

  it("calls the unauthorized handler on 401 for authenticated requests only", async () => {
    const onUnauthorized = jest.fn()
    setUnauthorizedHandler(onUnauthorized)
    fetchMock.mockReturnValue(jsonResponse({ message: "Invalid token" }, 401))

    await expect(api("/products", { method: "POST", body: {}, auth: true })).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)

    await expect(api("/auth/login", { method: "POST", body: {} })).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it("persists the token in localStorage", () => {
    setToken("xyz")
    expect(getToken()).toBe("xyz")
    setToken(null)
    expect(getToken()).toBeNull()
  })
})
