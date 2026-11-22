import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { AdminProductsPage } from "@/pages/admin-products-page"
import { jsonResponse, makeProduct, mockFetch, renderWithProviders, signInAsAdmin } from "@/test/utils"

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }))

const catalog = [
  makeProduct({ id: 1, name: "ThinkPad T470", image_url: "/products/t470.webp" }),
  makeProduct({ id: 2, name: "ThinkPad X220" }),
  makeProduct({ id: 3, name: "ThinkPad Mouse", category: "mice", gallery: ["/images/abc"] }),
  makeProduct({ id: 4, name: "ThinkPad Bag", category: "bags" }),
]

const rowNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => within(r).queryByRole("link")?.textContent)

describe("AdminProductsPage photo tools", () => {
  beforeEach(() => jest.clearAllMocks())

  it("filters to products without photos and deletes them all after confirming", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    let list = catalog
    fetchMock.mockImplementation((url, init) => {
      if (init?.method === "DELETE") {
        const id = Number(String(url).split("/").pop())
        list = list.filter((p) => p.id !== id)
        return jsonResponse(undefined, 204)
      }
      return jsonResponse(list)
    })
    renderWithProviders(<AdminProductsPage />)

    expect(await screen.findByText("ThinkPad X220")).toBeInTheDocument()
    // Only the two products without any photo get the badge (gallery-only counts as having photos).
    expect(screen.getAllByText("No photos")).toHaveLength(2)

    await user.click(screen.getByRole("combobox", { name: "Filter by photos" }))
    await user.click(screen.getByRole("option", { name: "No photos" }))
    expect(rowNames()).toEqual(["ThinkPad X220", "ThinkPad Bag"])

    await user.click(screen.getByRole("button", { name: "Delete all 2" }))
    const dialog = await screen.findByRole("alertdialog")
    expect(within(dialog).getByText("Delete 2 products without photos?")).toBeInTheDocument()
    await user.click(within(dialog).getByRole("button", { name: "Delete 2 products" }))

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    const deleted = fetchMock.mock.calls.filter(([, init]) => init?.method === "DELETE").map(([url]) => url)
    expect(deleted).toEqual(["http://api.test/products/2", "http://api.test/products/4"])
    // Products with photos were never touched.
    expect(list.map((p) => p.id)).toEqual([1, 3])
  })

  it("reports when only some products could be deleted", async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch()
    let list = catalog
    fetchMock.mockImplementation((url, init) => {
      if (init?.method === "DELETE") {
        const id = Number(String(url).split("/").pop())
        if (id === 4) return jsonResponse({ message: "Server error" }, 500)
        list = list.filter((p) => p.id !== id)
        return jsonResponse(undefined, 204)
      }
      return jsonResponse(list)
    })
    renderWithProviders(<AdminProductsPage />)

    await screen.findByText("ThinkPad X220")
    await user.click(screen.getByRole("combobox", { name: "Filter by photos" }))
    await user.click(screen.getByRole("option", { name: "No photos" }))
    await user.click(screen.getByRole("button", { name: "Delete all 2" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete 2 products" }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Deleted 1, but 1 couldn’t be deleted. Try again."))
    // The list refreshes: only the one that failed is left under "No photos".
    await waitFor(() => expect(rowNames()).toEqual(["ThinkPad Bag"]))
    expect(screen.getByRole("button", { name: "Delete this product" })).toBeInTheDocument()
  })
})

describe("AdminProductsPage", () => {
  const products = [
    makeProduct({ id: 1, name: "ThinkPad T470", available_quantity: 5, featured: true }),
    makeProduct({ id: 2, name: "ThinkPad X220", available_quantity: 2 }),
    makeProduct({ id: 3, name: "Silent Mouse", category: "mice", available_quantity: 0 }),
    makeProduct({ id: 4, name: "Future Bag", category: "bags", sold_from: "2099-01-01" }),
  ]
  let fetchMock: ReturnType<typeof mockFetch>
  beforeEach(() => {
    jest.clearAllMocks()
    signInAsAdmin()
    let list = products
    fetchMock = mockFetch()
    fetchMock.mockImplementation((url, init) => {
      if (init?.method === "DELETE") {
        list = list.filter((p) => !String(url).endsWith(`/${p.id}`))
        return jsonResponse(undefined, 204)
      }
      return jsonResponse(list)
    })
  })

  it("summarises the catalog", async () => {
    renderWithProviders(<AdminProductsPage />)
    await screen.findByText("ThinkPad T470")
    // Stat cards: a small label with the number right after it.
    const stat = (label: RegExp) => screen.getByText(label, { selector: "span" }).nextSibling
    expect(stat(/^Products$/)).toHaveTextContent("4")
    expect(stat(/^On Sale Now$/)).toHaveTextContent("2")
    expect(stat(/^Low Stock/)).toHaveTextContent("1")
    expect(stat(/^Out of Stock$/)).toHaveTextContent("1")
    expect(screen.getByLabelText("Featured")).toBeInTheDocument()
  })

  it("searches by name or ID and filters by category", async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminProductsPage />)
    await screen.findByText("ThinkPad T470")
    await user.type(screen.getByRole("searchbox", { name: "Search products" }), "thinkpad")
    expect(rowNames()).toEqual(["ThinkPad T470", "ThinkPad X220"])
    await user.clear(screen.getByRole("searchbox"))
    await user.type(screen.getByRole("searchbox"), "3")
    expect(rowNames()).toEqual(["Silent Mouse"])
    await user.clear(screen.getByRole("searchbox"))

    await user.click(screen.getByRole("combobox", { name: "Filter by category" }))
    await user.click(screen.getByRole("option", { name: "Mice" }))
    expect(rowNames()).toEqual(["Silent Mouse"])
    await user.click(screen.getByRole("combobox", { name: "Filter by photos" }))
    await user.click(screen.getByRole("option", { name: "With photos" }))
    expect(screen.getByText("No products match these filters.")).toBeInTheDocument()
  })

  it("opens an empty form for a new product and a filled one for editing", async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminProductsPage />)
    await screen.findByText("ThinkPad T470")

    await user.click(screen.getByRole("button", { name: "New Product" }))
    expect(screen.getByRole("dialog", { name: "New Product" })).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("")
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    await user.click(screen.getByRole("button", { name: "Actions for ThinkPad X220" }))
    await user.click(screen.getByRole("menuitem", { name: "Edit" }))
    expect(screen.getByRole("dialog", { name: "Edit Product" })).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("ThinkPad X220")
  })

  it("deletes one product after confirming", async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminProductsPage />)
    await screen.findByText("ThinkPad T470")
    await user.click(screen.getByRole("button", { name: "Actions for Silent Mouse" }))
    await user.click(screen.getByRole("menuitem", { name: "Delete" }))
    const dialog = screen.getByRole("alertdialog", { name: "Delete Silent Mouse?" })
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(screen.queryByText("Silent Mouse")).not.toBeInTheDocument())
    expect(toast.success).toHaveBeenCalledWith("Deleted Silent Mouse")
    expect(fetchMock).toHaveBeenCalledWith("http://api.test/products/3", expect.objectContaining({ method: "DELETE" }))
  })

  it("invites adding the first product to an empty store", async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation(() => jsonResponse([]))
    renderWithProviders(<AdminProductsPage />)
    await user.click(await screen.findByRole("button", { name: "Add Your First Product" }))
    expect(screen.getByRole("dialog", { name: "New Product" })).toBeInTheDocument()
  })

  it("shows an error with a retry", async () => {
    const user = userEvent.setup()
    let fail = true
    fetchMock.mockImplementation(() => (fail ? jsonResponse({ message: "Server down" }, 500) : jsonResponse(products)))
    renderWithProviders(<AdminProductsPage />)
    expect(await screen.findByText("Server down")).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole("button", { name: "Try Again" }))
    expect(await screen.findByText("ThinkPad T470")).toBeInTheDocument()
  })

  it("uses singular wording for one product, and can be cancelled", async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((_url, init) =>
      init?.method === "DELETE" ? jsonResponse(undefined, 204) : jsonResponse([makeProduct({ id: 9, name: "Lonely Bag" })]),
    )
    renderWithProviders(<AdminProductsPage />)
    await screen.findByText("Lonely Bag")
    await user.click(screen.getByRole("combobox", { name: "Filter by photos" }))
    await user.click(screen.getByRole("option", { name: "No photos" }))

    await user.click(screen.getByRole("button", { name: "Delete this product" }))
    expect(screen.getByRole("alertdialog", { name: "Delete 1 product without photos?" })).toHaveTextContent("It will be removed")
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())

    await user.click(screen.getByRole("button", { name: "Delete this product" }))
    await user.click(screen.getByRole("button", { name: "Delete 1 product" }))
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Deleted 1 product"))
  })

  it("can't be dismissed while deleting", async () => {
    const user = userEvent.setup()
    let finish!: () => void
    fetchMock.mockImplementation((_url, init) =>
      init?.method === "DELETE"
        ? new Promise((resolve) => (finish = () => resolve(jsonResponse(undefined, 204) as never)))
        : jsonResponse([makeProduct({ id: 9, name: "Lonely Bag" })]),
    )
    renderWithProviders(<AdminProductsPage />)
    await screen.findByText("Lonely Bag")
    await user.click(screen.getByRole("combobox", { name: "Filter by photos" }))
    await user.click(screen.getByRole("option", { name: "No photos" }))
    await user.click(screen.getByRole("button", { name: "Delete this product" }))
    await user.click(screen.getByRole("button", { name: "Delete 1 product" }))
    expect(await screen.findByRole("button", { name: "Deleting…" })).toBeDisabled()
    await user.keyboard("{Escape}")
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    finish()
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
  })
})
