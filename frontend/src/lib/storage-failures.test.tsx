import { act, renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { getToken, setToken } from "@/lib/api"
import { AuthProvider, useAuth } from "@/lib/auth"
import { CartProvider, useCart } from "@/lib/cart"
import { jsonResponse, makeProduct, mockFetch, signInAsAdmin } from "@/test/utils"

/** Storage that throws, like Safari private mode or a blocked-cookies setting. */
function blockStorage() {
  const error = () => {
    throw new DOMException("blocked", "SecurityError")
  }
  return [
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(error),
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(error),
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation(error),
  ]
}

describe("when browser storage is blocked", () => {
  afterEach(() => jest.restoreAllMocks())

  it("the API client works without a saved token", () => {
    blockStorage()
    expect(getToken()).toBeNull()
    expect(() => setToken("abc")).not.toThrow()
    expect(() => setToken(null)).not.toThrow()
  })

  it("the cart starts empty and still works in memory", () => {
    blockStorage()
    const { result } = renderHook(() => useCart(), { wrapper: ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider> })
    expect(result.current.items).toEqual([])
    act(() => result.current.add(makeProduct()))
    expect(result.current.count).toBe(1)
  })

  it("signing in and out still works for the current visit", async () => {
    mockFetch().mockReturnValue(
      jsonResponse({ access_token: "t", admin: { id: 1, email: "admin@example.com", name: "Admin User" } }),
    )
    const { result } = renderHook(() => useAuth(), { wrapper: ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider> })
    blockStorage()
    await act(() => result.current.login("admin@example.com", "admin123"))
    expect(result.current.isAuthenticated).toBe(true)
    act(() => result.current.logout())
    expect(result.current.isAuthenticated).toBe(false)
  })
})

describe("when saved data is corrupt", () => {
  const authWrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>

  it("the cart ignores unreadable JSON", () => {
    localStorage.setItem("ecommerce.cart", "{not json")
    const { result } = renderHook(() => useCart(), { wrapper: ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider> })
    expect(result.current.items).toEqual([])
  })

  it("auth treats a malformed token as signed out and drops it", () => {
    localStorage.setItem("ecommerce.token", "not-a-jwt")
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper })
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem("ecommerce.token")).toBeNull()
  })

  it("auth treats unreadable admin details as signed out", () => {
    signInAsAdmin()
    localStorage.setItem("ecommerce.admin", "{not json")
    const { result } = renderHook(() => useAuth(), { wrapper: authWrapper })
    expect(result.current.isAuthenticated).toBe(false)
  })
})
