import { act, screen, waitFor, within } from "@testing-library/react"
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

  it("sorts by price, name and the default (available and featured first)", async () => {
    const user = userEvent.setup()
    const items = [
      makeProduct({ id: 1, name: "B Laptop", price: 300 }),
      makeProduct({ id: 2, name: "A Laptop", price: 100, featured: true }),
      makeProduct({ id: 3, name: "C Laptop", price: 200, available_quantity: 0 }),
      makeProduct({ id: 4, name: "D Laptop", price: 50 }),
    ]
    mockFetch().mockReturnValue(jsonResponse(items))
    const { router } = renderRoutes([{ path: "/shop", element: <main><ShopPage /></main> }], { initialPath: "/shop" })
    await screen.findByText("A Laptop")
    // Featured first, then available by ID, then unavailable.
    expect(productNames()).toEqual(["A Laptop", "B Laptop", "D Laptop", "C Laptop"])

    const sortBy = async (label: string) => {
      await user.click(screen.getByRole("combobox", { name: "Sort by" }))
      await user.click(screen.getByRole("option", { name: label }))
    }
    await sortBy("Price: low to high")
    expect(productNames()).toEqual(["D Laptop", "A Laptop", "C Laptop", "B Laptop"])
    expect(router.state.location.search).toBe("?sort=price-asc")
    await sortBy("Price: high to low")
    expect(productNames()).toEqual(["B Laptop", "C Laptop", "A Laptop", "D Laptop"])
    await sortBy("Name")
    expect(productNames()).toEqual(["A Laptop", "B Laptop", "C Laptop", "D Laptop"])
    await sortBy("Featured")
    expect(router.state.location.search).toBe("") // the default isn't written to the URL
  })

  it("ignores an unknown sort or category in the URL", async () => {
    renderShop("/shop?sort=cheapest&category=phones")
    await screen.findByText("ThinkPad T470")
    expect(screen.getByRole("heading", { level: 1, name: "Everything" })).toBeInTheDocument()
    expect(productNames()).toHaveLength(3)
  })

  it("writes the search to the URL after typing pauses, and removes it when cleared", async () => {
    const user = userEvent.setup()
    const { router } = renderShop()
    await screen.findByText("ThinkPad T470")
    await user.type(screen.getByLabelText("Search products"), "mouse")
    await waitFor(() => expect(router.state.location.search).toBe("?q=mouse"))
    await user.clear(screen.getByLabelText("Search products"))
    await waitFor(() => expect(router.state.location.search).toBe(""))
  })

  it("follows search changes from links and the back button", async () => {
    const { router } = renderShop("/shop?q=quadro")
    await waitFor(() => expect(productNames()).toEqual(["ThinkPad W530"]))
    expect(screen.getByLabelText("Search products")).toHaveValue("quadro")
    await act(() => router.navigate("/shop?q=mouse"))
    expect(screen.getByLabelText("Search products")).toHaveValue("mouse")
    await waitFor(() => expect(productNames()).toEqual(["ThinkPad Bluetooth Silent Mouse"]))
  })

  it("retries after an error", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch")).mockReturnValue(jsonResponse(catalog))
    renderRoutes([{ path: "/shop", element: <main><ShopPage /></main> }], { initialPath: "/shop" })
    await user.click(await screen.findByRole("button", { name: "Try Again" }))
    expect(await screen.findByText("ThinkPad T470")).toBeInTheDocument()
  })
})
