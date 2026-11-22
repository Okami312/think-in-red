import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { ProductFormDialog } from "@/components/product-form-dialog"
import type { ProductInput } from "@/lib/types"
import { jsonResponse, makeProduct, mockFetch, renderWithProviders, signInAsAdmin } from "@/test/utils"

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }))

const webp = (name: string) => new File(["x"], name, { type: "image/webp" })

/** Body of the first request to `path` with `method`, parsed as JSON. */
function sentBody(fetchMock: ReturnType<typeof mockFetch>, method: string, path: string): ProductInput {
  const call = fetchMock.mock.calls.find(([url, init]) => url === `http://api.test${path}` && init?.method === method)
  if (!call) throw new Error(`no ${method} ${path} request`)
  return JSON.parse(String(call[1]?.body)) as ProductInput
}

describe("ProductFormDialog photos", () => {
  let fetchMock: ReturnType<typeof mockFetch>
  let uploads: number
  /** Lets a test hold an upload open to check the form while it's in flight. */
  let releaseUpload: (() => void) | null

  beforeEach(() => {
    jest.clearAllMocks()
    signInAsAdmin()
    URL.createObjectURL = jest.fn(() => "blob:preview")
    URL.revokeObjectURL = jest.fn()
    uploads = 0
    releaseUpload = null
    fetchMock = mockFetch()
    fetchMock.mockImplementation((url, init) => {
      if (url === "http://api.test/images") {
        const result = jsonResponse({ url: `/images/up-${++uploads}` }, 201)
        if (!releaseUpload) return result
        return new Promise((resolve) => {
          const release = releaseUpload!
          releaseUpload = () => {
            release()
            resolve(result)
          }
        })
      }
      const body = JSON.parse(String(init?.body ?? "{}")) as ProductInput
      return jsonResponse(makeProduct({ ...body, id: 7 }), init?.method === "POST" ? 201 : 200)
    })
  })

  it("creates a product with uploaded photos: the first is the cover, the rest the gallery", async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    renderWithProviders(<ProductFormDialog open onOpenChange={onOpenChange} />)

    await user.type(screen.getByLabelText("Name"), "ThinkPad X220")
    await user.type(screen.getByLabelText("Description"), "Classic 12-inch, 7-row keyboard.")
    await user.type(screen.getByLabelText("Price"), "169")
    await user.type(screen.getByLabelText("In stock"), "3")
    fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [webp("front.webp"), webp("side.webp"), webp("ports.webp")] } })
    expect(await screen.findByText(/3 of 10 photos/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Create Product" }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
    expect(sentBody(fetchMock, "POST", "/products")).toMatchObject({
      name: "ThinkPad X220",
      description: "Classic 12-inch, 7-row keyboard.",
      image_url: "/images/up-1",
      gallery: ["/images/up-2", "/images/up-3"],
    })
  })

  it("saves a product without photos as no cover and an empty gallery", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductFormDialog open onOpenChange={() => {}} product={makeProduct({ id: 7, image_url: "/a.webp" })} />)

    await user.click(screen.getByRole("button", { name: "Remove photo 1" }))
    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() => expect(sentBody(fetchMock, "PUT", "/products/7")).toMatchObject({ image_url: null, gallery: [] }))
  })

  it("loads an existing product's photos, adds more and saves the new order", async () => {
    const user = userEvent.setup()
    const product = makeProduct({ id: 7, image_url: "/products/t470.webp", gallery: ["/products/t470-2.webp"], description: "Old text" })
    renderWithProviders(<ProductFormDialog open onOpenChange={() => {}} product={product} />)

    expect(screen.getByText(/2 of 10 photos/)).toBeInTheDocument()
    fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [webp("new.webp")] } })
    expect(await screen.findByText(/3 of 10 photos/)).toBeInTheDocument()
    // Make the new upload the cover, and rewrite the description.
    await user.click(screen.getByRole("button", { name: "Make photo 3 the cover" }))
    await user.clear(screen.getByLabelText("Description"))
    await user.type(screen.getByLabelText("Description"), "Fresh battery, new keyboard.")
    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() =>
      expect(sentBody(fetchMock, "PUT", "/products/7")).toMatchObject({
        description: "Fresh battery, new keyboard.",
        image_url: "/images/up-1",
        gallery: ["/products/t470.webp", "/products/t470-2.webp"],
      }),
    )
  })

  it("can't be saved while a photo is still uploading", async () => {
    releaseUpload = () => {}
    renderWithProviders(<ProductFormDialog open onOpenChange={() => {}} product={makeProduct({ id: 7 })} />)

    fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [webp("slow.webp")] } })
    const button = await screen.findByRole("button", { name: "Uploading photos…" })
    expect(button).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()

    releaseUpload!()
    expect(await screen.findByRole("button", { name: "Save Changes" })).toBeEnabled()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === "PUT")).toBe(false)
  })
})

describe("ProductFormDialog fields", () => {
  let fetchMock: ReturnType<typeof mockFetch>
  beforeEach(() => {
    jest.clearAllMocks()
    signInAsAdmin()
    fetchMock = mockFetch()
  })

  it("validates required fields and the sale period before saving", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductFormDialog open onOpenChange={() => {}} product={makeProduct({ id: 7, sold_from: "2026-06-01" })} />)
    await user.clear(screen.getByLabelText("Name"))
    await user.clear(screen.getByLabelText("Price"))
    await user.type(screen.getByLabelText("Price"), "1.999")
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByText("Name is required")).toBeInTheDocument()
    expect(screen.getByText("Enter a price like 19.99 (max 2 decimals)")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("rejects an end date before the start date", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ProductFormDialog open onOpenChange={() => {}} product={makeProduct({ id: 7, sold_from: "2026-06-10", sold_to: "2026-06-01" })} />,
    )
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByText("End date can't be before the start date")).toBeInTheDocument()
  })

  it("shows the server's error and stays open when saving fails", async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    fetchMock.mockImplementation(() => jsonResponse({ message: "A product can have at most 10 photos" }, 400))
    renderWithProviders(<ProductFormDialog open onOpenChange={onOpenChange} product={makeProduct({ id: 7 })} />)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("A product can have at most 10 photos"))
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("adds, reorders, validates and removes spec rows", async () => {
    const user = userEvent.setup()
    fetchMock.mockImplementation((_url, init) => jsonResponse(makeProduct({ id: 7, ...JSON.parse(String(init?.body)) })))
    renderWithProviders(<ProductFormDialog open onOpenChange={() => {}} product={makeProduct({ id: 7, specs: [] })} />)
    expect(screen.getByText(/No specs yet/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Add Spec" }))
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByText("Label required")).toBeInTheDocument()
    expect(screen.getByText("Value required")).toBeInTheDocument()

    await user.type(screen.getByRole("textbox", { name: "Spec 1 label" }), "CPU")
    await user.type(screen.getByRole("textbox", { name: "Spec 1 value" }), "i5")
    await user.click(screen.getByRole("button", { name: "Add Spec" }))
    await user.type(screen.getByRole("textbox", { name: "Spec 2 label" }), "RAM")
    await user.type(screen.getByRole("textbox", { name: "Spec 2 value" }), "16 GB")
    await user.click(screen.getAllByRole("button", { name: "Move up" })[1])
    await user.click(screen.getAllByRole("button", { name: "Move down" })[0])
    await user.click(screen.getAllByRole("button", { name: "Move up" })[1])
    await user.click(screen.getByRole("button", { name: "Add Spec" }))
    await user.click(screen.getByRole("button", { name: "Remove spec 3" }))
    await user.click(screen.getByRole("button", { name: "Save Changes" }))

    await waitFor(() =>
      expect(sentBody(fetchMock, "PUT", "/products/7").specs).toEqual([
        { label: "RAM", value: "16 GB" },
        { label: "CPU", value: "i5" },
      ]),
    )
  })

  it("lists a product's unusual currency alongside the standard ones", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductFormDialog open onOpenChange={() => {}} product={makeProduct({ id: 7, currency: "JPY" })} />)
    await user.click(screen.getByRole("combobox", { name: "Currency" }))
    expect(screen.getByRole("option", { name: "JPY" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "EUR" })).toBeInTheDocument()
  })

  it("can be cancelled", async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    renderWithProviders(<ProductFormDialog open onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes on Escape, but not while saving", async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    let finish!: () => void
    fetchMock.mockReturnValue(new Promise((resolve) => (finish = () => resolve(jsonResponse(makeProduct({ id: 7 })) as never))))
    renderWithProviders(<ProductFormDialog open onOpenChange={onOpenChange} product={makeProduct({ id: 7 })} />)
    await user.keyboard("{Escape}")
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    onOpenChange.mockClear()

    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled()
    await user.keyboard("{Escape}")
    expect(onOpenChange).not.toHaveBeenCalled()
    finish()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("asks to remove photos from products saved before the 10-photo limit", async () => {
    const user = userEvent.setup()
    // Before the limit, products could have a cover + 12 gallery photos.
    const legacy = makeProduct({ id: 7, image_url: "/c.webp", gallery: Array.from({ length: 12 }, (_, i) => `/g${i}.webp`) })
    renderWithProviders(<ProductFormDialog open onOpenChange={() => {}} product={legacy} />)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByText("At most 10 photos")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("flags a stored photo URL that's no longer valid", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProductFormDialog open onOpenChange={() => {}} product={makeProduct({ id: 7, image_url: "ftp://old.example/x.jpg" })} />)
    await user.click(screen.getByRole("button", { name: "Save Changes" }))
    expect(await screen.findByText("One of the photo URLs isn’t valid")).toBeInTheDocument()
  })
})
