import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ShopPage } from "@/pages/shop-page"
import { jsonResponse, makeProduct, mockFetch, renderRoutes } from "@/test/utils"

const catalog = [
  makeProduct({ id: 1, name: "ThinkPad T470", category: "laptops", price: 199 }),
  makeProduct({
    id: 2,
    name: "ThinkPad W530",
    category: "laptops",
    price: 219,
    specs: [{ label: "Graphics", value: "NVIDIA Quadro K1000M" }],
  }),
  makeProduct({ id: 3, name: "ThinkPad Bluetooth Silent Mouse", category: "mice", price: 22 }),
]

const productNames = () =>
  within(screen.getByRole("main")).queryAllByRole("heading", { level: 3 }).map((h) => h.textContent)

function renderShop(path = "/shop") {
  mockFetch().mockReturnValue(jsonResponse(catalog))
  return renderRoutes([{ path: "/shop", element: <main><ShopPage /></main> }], { initialPath: path })
}

describe("ShopPage", () => {
  it("lists every product", async () => {
    renderShop()
    expect(await screen.findByText("ThinkPad Bluetooth Silent Mouse")).toBeInTheDocument()
    expect(productNames()).toHaveLength(3)
    expect(screen.getByText("3 products")).toBeInTheDocument()
  })

  it("filters by the category in the URL", async () => {
    renderShop("/shop?category=mice")
    expect(await screen.findByRole("heading", { level: 1, name: "Mice" })).toBeInTheDocument()
    await waitFor(() => expect(productNames()).toEqual(["ThinkPad Bluetooth Silent Mouse"]))
  })

  it("switches category with the tabs and updates the URL", async () => {
    const { router } = renderShop()
    await screen.findByText("ThinkPad T470")
    await userEvent.click(screen.getByRole("tab", { name: "Laptops" }))
    await waitFor(() => expect(productNames()).toEqual(["ThinkPad T470", "ThinkPad W530"]))
    expect(router.state.location.search).toBe("?category=laptops")
  })

  it("searches names and specs", async () => {
    renderShop()
    await screen.findByText("ThinkPad T470")
    await userEvent.type(screen.getByLabelText("Search products"), "quadro")
    await waitFor(() => expect(productNames()).toEqual(["ThinkPad W530"]))
  })

  it("shows an empty state with a way back", async () => {
    renderShop()
    await screen.findByText("ThinkPad T470")
    await userEvent.type(screen.getByLabelText("Search products"), "no such thing")
    expect(await screen.findByText("No matches")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Clear Filters" })).toHaveAttribute("href", "/shop")
  })

  it("shows an error with a retry when the API is down", async () => {
    mockFetch().mockRejectedValue(new TypeError("Failed to fetch"))
    renderRoutes([{ path: "/shop", element: <ShopPage /> }], { initialPath: "/shop" })
    expect(await screen.findByText("Something Went Wrong")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument()
  })
})
