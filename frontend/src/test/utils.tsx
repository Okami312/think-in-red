import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import type { ReactNode } from "react"
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { CartProvider } from "@/lib/cart"
import type { Product } from "@/lib/types"

/** Render routes inside the same providers the app uses (theme, React Query, auth, cart, router). */
export function renderRoutes(routes: RouteObject[], { initialPath = "/" } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  const utils = render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  )
  return { ...utils, router }
}

/** Render a single element at "/" with all providers. */
export function renderWithProviders(ui: ReactNode, path = "/") {
  return renderRoutes([{ path: "*", element: ui }], { initialPath: path })
}

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 1,
    name: "ThinkPad T470",
    category: "laptops",
    description: "The 2017 all-rounder.",
    price: 199,
    currency: "EUR",
    available_quantity: 5,
    sold_from: null,
    sold_to: null,
    image_url: null,
    gallery: [],
    specs: [
      { label: "Released", value: "2017" },
      { label: "Processor", value: "Intel Core i5-7300U" },
    ],
    featured: false,
    ...overrides,
  }
}

/** A minimal fetch Response (jsdom has no Response class). */
export function jsonResponse(body: unknown, status = 200, statusText = ""): Promise<Response> {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => (body === undefined ? Promise.reject(new SyntaxError("no body")) : Promise.resolve(body)),
  } as Response)
}

/** Install a jest.fn() as global fetch and return it. */
export function mockFetch() {
  const fn = jest.fn<Promise<Response>, [RequestInfo | URL, RequestInit?]>()
  globalThis.fetch = fn as unknown as typeof fetch
  return fn
}

/**
 * Stores an admin session that AuthProvider accepts (an unexpired JWT shape +
 * the cached admin), so authenticated requests carry a Bearer token.
 * Returns the token.
 */
export function signInAsAdmin(): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "")
  const token = `${b64({ alg: "HS256" })}.${b64({ sub: 1, exp: Date.now() / 1000 + 3600 })}.sig`
  localStorage.setItem("ecommerce.token", token)
  localStorage.setItem("ecommerce.admin", JSON.stringify({ id: 1, email: "admin@example.com", name: "Admin User" }))
  return token
}

/**
 * Replaces window.matchMedia with one whose answers you control.
 * `set(query, matches)` flips a query and fires its "change" listeners.
 */
export function mockMatchMedia(initial: Record<string, boolean> = {}) {
  const state = new Map(Object.entries(initial))
  const listeners = new Map<string, Set<() => void>>()
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    get matches() {
      return state.get(query) ?? false
    },
    media: query,
    onchange: null,
    addEventListener: (_: string, fn: () => void) => {
      if (!listeners.has(query)) listeners.set(query, new Set())
      listeners.get(query)!.add(fn)
    },
    removeEventListener: (_: string, fn: () => void) => listeners.get(query)?.delete(fn),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  globalThis.matchMedia = window.matchMedia
  return {
    set(query: string, matches: boolean) {
      state.set(query, matches)
      listeners.get(query)?.forEach((fn) => fn())
    },
    listenerCount: (query: string) => listeners.get(query)?.size ?? 0,
    restore() {
      window.matchMedia = original
      globalThis.matchMedia = original
    },
  }
}
