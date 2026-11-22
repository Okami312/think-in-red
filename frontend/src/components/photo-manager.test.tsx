import { fireEvent, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { toast } from "sonner"
import { PhotoManager } from "@/components/photo-manager"
import { jsonResponse, mockFetch, renderWithProviders, signInAsAdmin } from "@/test/utils"

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }))

/** Controlled wrapper that exposes the current value for assertions. */
function Harness({ initial = [] as string[], onValue }: { initial?: string[]; onValue?: (photos: string[]) => void }) {
  const [photos, setPhotos] = useState(initial)
  return (
    <PhotoManager
      value={photos}
      onChange={(next) => {
        setPhotos(next)
        onValue?.(next)
      }}
      category="laptops"
    />
  )
}

const webp = (name: string) => new File(["x"], name, { type: "image/webp" })
const photoAlts = () => screen.queryAllByRole("img", { name: /^Photo \d+$/ }).map((img) => img.getAttribute("src"))

describe("PhotoManager", () => {
  let fetchMock: ReturnType<typeof mockFetch>
  let uploads = 0
  let token: string
  beforeEach(() => {
    uploads = 0
    jest.clearAllMocks()
    token = signInAsAdmin()
    fetchMock = mockFetch()
    fetchMock.mockImplementation(() => jsonResponse({ url: `/images/up-${++uploads}` }, 201))
    URL.createObjectURL = jest.fn(() => "blob:preview")
    URL.revokeObjectURL = jest.fn()
  })

  it("uploads picked files in order with the admin token, then shows them", async () => {
    const onValue = jest.fn()
    renderWithProviders(<Harness onValue={onValue} />)
    fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [webp("a.webp"), webp("b.webp")] } })

    await waitFor(() => expect(onValue).toHaveBeenLastCalledWith(["/images/up-1", "/images/up-2"]))
    expect(photoAlts()).toEqual(["http://api.test/images/up-1", "http://api.test/images/up-2"])
    expect(screen.getByText("Cover")).toBeInTheDocument()
    expect(screen.getByText(/2 of 10 photos/)).toBeInTheDocument()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe("http://api.test/images")
    expect(init?.method).toBe("POST")
    expect(init?.body).toBeInstanceOf(FormData)
    // No JSON Content-Type: the browser sets the multipart boundary itself.
    expect(init?.headers).toEqual({ Authorization: `Bearer ${token}` })
  })

  it("stops at 10 photos and says how many were skipped", async () => {
    const nine = Array.from({ length: 9 }, (_, i) => `/products/p${i}.webp`)
    const onValue = jest.fn()
    renderWithProviders(<Harness initial={nine} onValue={onValue} />)
    fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [webp("a.webp"), webp("b.webp"), webp("c.webp")] } })

    await waitFor(() => expect(onValue).toHaveBeenLastCalledWith([...nine, "/images/up-1"]))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/at most 10 photos, so 2 were skipped/))
    // Full: no more upload tile, URL field disabled.
    expect(screen.queryByRole("button", { name: /Upload photos/ })).not.toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Image URL" })).toBeDisabled()
  })

  it("reports a failed upload and keeps going", async () => {
    fetchMock
      .mockImplementationOnce(() => jsonResponse({ message: "Unsupported image. Use JPEG, PNG, WebP, GIF or AVIF" }, 400))
      .mockImplementationOnce(() => jsonResponse({ url: "/images/ok" }, 201))
    const onValue = jest.fn()
    renderWithProviders(<Harness onValue={onValue} />)
    fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [webp("bad.webp"), webp("good.webp")] } })

    await waitFor(() => expect(onValue).toHaveBeenLastCalledWith(["/images/ok"]))
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/^bad\.webp: Unsupported image/))
  })

  it("reorders, sets the cover and removes photos", async () => {
    const user = userEvent.setup()
    const onValue = jest.fn()
    renderWithProviders(<Harness initial={["/a.webp", "/b.webp", "/c.webp"]} onValue={onValue} />)

    await user.click(screen.getByRole("button", { name: "Make photo 3 the cover" }))
    expect(onValue).toHaveBeenLastCalledWith(["/c.webp", "/a.webp", "/b.webp"])
    await user.click(screen.getByRole("button", { name: "Move photo 2 right" }))
    expect(onValue).toHaveBeenLastCalledWith(["/c.webp", "/b.webp", "/a.webp"])
    await user.click(screen.getByRole("button", { name: "Remove photo 1" }))
    expect(onValue).toHaveBeenLastCalledWith(["/b.webp", "/a.webp"])
  })

  it("adds photos by URL and rejects invalid or duplicate ones", async () => {
    const user = userEvent.setup()
    const onValue = jest.fn()
    renderWithProviders(<Harness initial={["/a.webp"]} onValue={onValue} />)
    const field = screen.getByRole("textbox", { name: "Image URL" })

    await user.type(field, "not a url{Enter}")
    expect(screen.getByText(/Use an http\(s\):\/\/ URL/)).toBeInTheDocument()
    await user.clear(field)
    await user.type(field, "/a.webp{Enter}")
    expect(screen.getByText("That photo is already added")).toBeInTheDocument()
    await user.clear(field)
    await user.type(field, "https://cdn.example/x.jpg")
    await user.click(screen.getByRole("button", { name: "Add URL" }))
    expect(onValue).toHaveBeenLastCalledWith(["/a.webp", "https://cdn.example/x.jpg"])
  })

  it("uploads photos dropped onto the grid, and highlights it while dragging", async () => {
    const onValue = jest.fn()
    const { container } = renderWithProviders(<Harness onValue={onValue} />)
    const grid = container.querySelector(".grid")!
    fireEvent.dragOver(grid)
    expect(grid).toHaveClass("ring-2")
    fireEvent.dragLeave(grid)
    expect(grid).not.toHaveClass("ring-2")

    fireEvent.drop(grid, { dataTransfer: { files: [webp("dropped.webp")] } })
    expect(grid).not.toHaveClass("ring-2")
    await waitFor(() => expect(onValue).toHaveBeenLastCalledWith(["/images/up-1"]))
  })

  it("ignores drops when the product already has 10 photos", () => {
    const ten = Array.from({ length: 10 }, (_, i) => `/products/p${i}.webp`)
    const { container } = renderWithProviders(<Harness initial={ten} />)
    fireEvent.drop(container.querySelector(".grid")!, { dataTransfer: { files: [webp("x.webp")] } })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("skips files that aren't images", async () => {
    renderWithProviders(<Harness />)
    fireEvent.change(screen.getByTestId("photo-input"), { target: { files: [new File(["%PDF"], "doc.pdf", { type: "application/pdf" })] } })
    expect(toast.error).toHaveBeenCalledWith("Only image files can be added")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("opens the file picker from the upload tile", async () => {
    const user = userEvent.setup()
    renderWithProviders(<Harness />)
    const click = jest.spyOn(screen.getByTestId("photo-input"), "click")
    await user.click(screen.getByRole("button", { name: /Upload photos/ }))
    expect(click).toHaveBeenCalled()
  })

  it("moves a photo left", async () => {
    const user = userEvent.setup()
    const onValue = jest.fn()
    renderWithProviders(<Harness initial={["/a.webp", "/b.webp"]} onValue={onValue} />)
    await user.click(screen.getByRole("button", { name: "Move photo 2 left" }))
    expect(onValue).toHaveBeenLastCalledWith(["/b.webp", "/a.webp"])
  })
})
