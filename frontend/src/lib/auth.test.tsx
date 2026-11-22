import { act, renderHook } from "@testing-library/react"
import { getToken, setToken } from "@/lib/api"
import { AuthProvider, useAuth } from "@/lib/auth"
import { jsonResponse, mockFetch } from "@/test/utils"

/** Unsigned JWT-shaped token with the given expiry (seconds since epoch). */
function fakeJwt(exp: number) {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "")
  return `${b64({ alg: "HS256" })}.${b64({ sub: 1, exp })}.sig`
}
const admin = { id: 1, email: "admin@example.com", name: "Admin User" }
const setup = () => renderHook(() => useAuth(), { wrapper: AuthProvider })

describe("auth", () => {
  it("starts signed out", () => {
    expect(setup().result.current.isAuthenticated).toBe(false)
  })

  it("logs in, stores the token and admin, and logs out", async () => {
    const token = fakeJwt(Date.now() / 1000 + 3600)
    mockFetch().mockReturnValue(jsonResponse({ access_token: token, admin }))
    const { result } = setup()

    await act(() => result.current.login("admin@example.com", "admin123"))
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.admin).toEqual(admin)
    expect(getToken()).toBe(token)

    act(() => result.current.logout())
    expect(result.current.isAuthenticated).toBe(false)
    expect(getToken()).toBeNull()
  })

  it("surfaces the API error on bad credentials", async () => {
    mockFetch().mockReturnValue(jsonResponse({ message: "Invalid credentials" }, 401))
    const { result } = setup()
    await expect(act(() => result.current.login("admin@example.com", "nope"))).rejects.toThrow("Invalid credentials")
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("restores a valid session from storage", () => {
    setToken(fakeJwt(Date.now() / 1000 + 3600))
    localStorage.setItem("ecommerce.admin", JSON.stringify(admin))
    expect(setup().result.current.admin).toEqual(admin)
  })

  it("drops an expired session on load", () => {
    setToken(fakeJwt(Date.now() / 1000 - 60))
    localStorage.setItem("ecommerce.admin", JSON.stringify(admin))
    expect(setup().result.current.isAuthenticated).toBe(false)
    expect(getToken()).toBeNull()
  })

  it("treats a valid token without saved admin details as signed out", () => {
    setToken(fakeJwt(Date.now() / 1000 + 3600))
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("accepts tokens without an expiry claim", () => {
    const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "")
    setToken(`${b64({ alg: "HS256" })}.${b64({ sub: 1 })}.sig`)
    localStorage.setItem("ecommerce.admin", JSON.stringify(admin))
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("throws a helpful error outside the provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow("useAuth must be used inside <AuthProvider>")
    jest.restoreAllMocks()
  })
})
