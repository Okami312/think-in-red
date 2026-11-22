import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { DeleteProductDialog } from "@/components/delete-product-dialog"
import { jsonResponse, makeProduct, mockFetch, renderWithProviders, signInAsAdmin } from "@/test/utils"

jest.mock("sonner", () => ({ toast: { error: jest.fn(), success: jest.fn() } }))

describe("DeleteProductDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    signInAsAdmin()
  })

  it("stays open and shows the error when deleting fails", async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    mockFetch().mockReturnValue(jsonResponse({ message: "Product with ID 1 not found" }, 404))
    renderWithProviders(<DeleteProductDialog product={makeProduct({ id: 1 })} onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Product with ID 1 not found"))
    expect(onOpenChange).not.toHaveBeenCalledWith(false)
  })

  it("can't be dismissed while the delete is in progress", async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    let finish!: () => void
    mockFetch().mockReturnValue(new Promise((resolve) => (finish = () => resolve(jsonResponse(undefined, 204) as never))))
    renderWithProviders(<DeleteProductDialog product={makeProduct({ id: 1 })} onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole("button", { name: "Delete" }))
    expect(await screen.findByRole("button", { name: "Deleting…" })).toBeDisabled()
    await user.keyboard("{Escape}")
    expect(onOpenChange).not.toHaveBeenCalled()
    finish()
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("is closed when there's no product", () => {
    renderWithProviders(<DeleteProductDialog product={null} onOpenChange={() => {}} />)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("closes on Cancel", async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    renderWithProviders(<DeleteProductDialog product={makeProduct({ id: 1 })} onOpenChange={onOpenChange} />)
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
