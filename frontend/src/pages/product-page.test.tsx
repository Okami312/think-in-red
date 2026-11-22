import { screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { ProductPage } from "@/pages/product-page"
import type { Product } from "@/lib/types"
import { jsonResponse, makeProduct, mockFetch, renderRoutes } from "@/test/utils"

jest.mock("sonner", () => ({ toast: Object.assign(jest.fn(), { success: jest.fn(), error: jest.fn(), info: jest.fn() }) }))

const t470 = makeProduct({
  id: 1,
  name: "ThinkPad T470",
  available_quantity: 3,
  image_url: "/products/t470.webp",
  gallery: ["/products/t470-2.webp", "/images/up-1"],
  description: "Line one.\nLine two.",
})
const related = [2, 3, 4, 5, 6].map((id) => makeProduct({ id, name: `Laptop ${id}` }))
const mouse = makeProduct({ id: 9, name: "Mouse", category: "mice" })

function renderProduct(path: string, products: Product[] = [t470, ...related, mouse], one?: () => Promise<Response>) {
  mockFetch().mockImplementation((url) => {
    const m = /\/products\/(\d+)$/.exec(String(url))
    if (m) {
      if (one) return one()
      const p = products.find((x) => x.id === Number(m[1]))
      return p ? jsonResponse(p) : jsonResponse({ message: "Product with ID 99 not found" }, 404)
    }
    return jsonResponse(products)
  })
  return renderRoutes([{ path: "/products/:id", element: <ProductPage /> }], { initialPath: path })
}

describe("ProductPage", () => {
  beforeEach(() => jest.clearAllMocks())

  it("shows the product: breadcrumb, price, description, specs and stock", async () => {
    renderProduct("/products/1")
    expect(await screen.findByRole("heading", { level: 1, name: "ThinkPad T470" })).toBeInTheDocument()
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(within(crumbs).getByRole("link", { name: "Shop" })).toHaveAttribute("href", "/shop")
    expect(within(crumbs).getByRole("link", { name: "Laptops" })).toHaveAttribute("href", "/shop?category=laptops")
    expect(screen.getByText("€199.00")).toBeInTheDocument()
    expect(screen.getByText(/Line one\./)).toBeInTheDocument()
    expect(screen.getByText("Intel Core i5-7300U")).toBeInTheDocument()
    expect(screen.getByText("In stock").nextSibling).toHaveTextContent("3")
  })

  it("switches gallery photos, resolving uploaded ones against the API", async () => {
    const user = userEvent.setup()
    renderProduct("/products/1")
    const thumbs = await screen.findByRole("group", { name: "Product images" })
    expect(within(thumbs).getAllByRole("button")).toHaveLength(3)
    expect(screen.getByRole("img", { name: "ThinkPad T470" })).toHaveAttribute("src", "/products/t470.webp")

    await user.click(within(thumbs).getByRole("button", { name: "Show image 3 of 3" }))
    expect(within(thumbs).getByRole("button", { name: "Show image 3 of 3" })).toHaveAttribute("aria-pressed", "true")
    expect(await screen.findByRole("img", { name: "ThinkPad T470 — image 3" })).toHaveAttribute("src", "http://api.test/images/up-1")
  })

  it("hides the thumbnail strip with fewer than two photos", async () => {
    renderProduct("/products/2")
    await screen.findByRole("heading", { level: 1, name: "Laptop 2" })
    expect(screen.queryByRole("group", { name: "Product images" })).not.toBeInTheDocument()
  })

  it("adds the chosen quantity to the cart, capped at what's in stock", async () => {
    const user = userEvent.setup()
    renderProduct("/products/1")
    await screen.findByRole("heading", { level: 1 })
    const plus = screen.getByRole("button", { name: "Increase quantity" })
    const minus = screen.getByRole("button", { name: "Decrease quantity" })
    expect(minus).toBeDisabled()
    await user.click(plus)
    await user.click(plus)
    expect(plus).toBeDisabled() // 3 in stock
    await user.click(minus)

    await user.click(screen.getByRole("button", { name: "Add to Cart" }))
    expect(toast.success).toHaveBeenCalledWith("Added 2 × ThinkPad T470 to cart")
    expect(JSON.parse(localStorage.getItem("ecommerce.cart")!)).toEqual([expect.objectContaining({ quantity: 2 })])

    // Only 1 left to add; then the button explains why it's disabled.
    expect(plus).toBeDisabled()
    await user.click(screen.getByRole("button", { name: "Add to Cart" }))
    expect(screen.getByRole("button", { name: "All Stock Is in Your Cart" })).toBeDisabled()
  })

  it("can't be bought before its sale date, and says when it can", async () => {
    renderProduct("/products/1", [makeProduct({ id: 1, sold_from: "2099-03-01" })])
    expect(await screen.findByText("Available to order from Mar 1, 2099.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add to Cart" })).toBeDisabled()
  })

  it("shows up to four related products from the same category", async () => {
    renderProduct("/products/1")
    const section = (await screen.findByRole("heading", { name: "More Laptops" })).closest("section")!
    expect(within(section).getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Laptop 2",
      "Laptop 3",
      "Laptop 4",
      "Laptop 5",
    ])
  })

  it("hides specs and related products when there are none", async () => {
    renderProduct("/products/9", [makeProduct({ id: 9, name: "Mouse", category: "mice", specs: [] })])
    await screen.findByRole("heading", { level: 1, name: "Mouse" })
    expect(screen.queryByRole("heading", { name: "Specifications" })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /^More / })).not.toBeInTheDocument()
  })

  it.each(["/products/99", "/products/abc", "/products/0"])("shows Not Found for %s", async (path) => {
    renderProduct(path)
    expect(await screen.findByRole("heading", { name: "Page Not Found" })).toBeInTheDocument()
  })

  it("offers a retry when the server fails", async () => {
    const user = userEvent.setup()
    let fail = true
    renderProduct("/products/1", undefined, () => (fail ? jsonResponse({ message: "Database down" }, 500) : jsonResponse(t470)))
    expect(await screen.findByText("Database down")).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole("button", { name: /Try again/i }))
    expect(await screen.findByRole("heading", { level: 1, name: "ThinkPad T470" })).toBeInTheDocument()
  })
})
