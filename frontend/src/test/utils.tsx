import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render } from "@testing-library/react"
import type { ReactNode } from "react"
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router"
import { AuthProvider } from "@/lib/auth"
import { CartProvider } from "@/lib/cart"
import type { Product } from "@/lib/types"

/** Render routes inside the same providers the app uses (React Query, auth, cart, router). */
export function renderRoutes(routes: RouteObject[], { initialPath = "/" } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>,
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
