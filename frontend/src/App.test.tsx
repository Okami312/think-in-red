import { act, render, screen } from "@testing-library/react"
import App from "@/App"
import { jsonResponse, makeProduct, mockFetch, signInAsAdmin } from "@/test/utils"

jest.mock("lenis", () => jest.fn())
jest.mock("lenis/dist/lenis.css", () => ({}), { virtual: true })

/**
 * App's browser router is created once at import time and follows the real
 * history, so tests move it like a browser would: pushState + popstate.
 */
async function renderAppAt(path: string) {
  act(() => {
    window.history.pushState(null, "", path)
    window.dispatchEvent(new PopStateEvent("popstate"))
  })
  await act(async () => {
    render(<App />)
  })
}

describe("App routes", () => {
  beforeEach(() => {
    mockFetch().mockImplementation((url) =>
      /\/products\/1$/.test(String(url))
        ? jsonResponse(makeProduct({ id: 1, name: "ThinkPad T470" }))
        : jsonResponse([makeProduct({ id: 1, name: "ThinkPad T470" })]),
    )
  })

  it("serves the home page inside the store layout", async () => {
    await renderAppAt("/")
    expect(screen.getByRole("heading", { level: 1, name: "Built for work. Finished in red." })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Skip to Content" })).toBeInTheDocument()
  })

  it("serves the shop", async () => {
    await renderAppAt("/shop")
    expect(await screen.findByRole("heading", { level: 1, name: "Everything" })).toBeInTheDocument()
  })

  it("serves product pages", async () => {
    await renderAppAt("/products/1")
    expect(await screen.findByRole("heading", { level: 1, name: "ThinkPad T470" })).toBeInTheDocument()
  })

  it("shows Not Found for unknown paths", async () => {
    await renderAppAt("/nope")
    expect(screen.getByRole("heading", { name: "Page Not Found" })).toBeInTheDocument()
  })

  it("loads the admin pages on demand: login when signed out…", async () => {
    await renderAppAt("/admin/login")
    expect(await screen.findByRole("button", { name: "Sign In" })).toBeInTheDocument()
  })

  it("…and the product list when signed in", async () => {
    signInAsAdmin()
    await renderAppAt("/admin")
    expect(await screen.findByRole("heading", { level: 1, name: "Products" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Account" })).toBeInTheDocument()
  })
})
