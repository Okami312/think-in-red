import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { CartSheet } from "@/components/cart-sheet"
import { useCart, type CartItem } from "@/lib/cart"
import { makeProduct, mockMatchMedia, renderWithProviders } from "@/test/utils"

jest.mock("sonner", () => ({ toast: Object.assign(jest.fn(), { info: jest.fn(), success: jest.fn(), error: jest.fn() }) }))
const toastMock = toast as unknown as jest.Mock & { info: jest.Mock }

const t470 = makeProduct({ id: 1, name: "ThinkPad T470", price: 199, available_quantity: 2 })
const mouse = makeProduct({ id: 2, name: "Silent Mouse", category: "mice", price: 22.5, available_quantity: 9 })
const usd = makeProduct({ id: 3, name: "US Keyboard", category: "keyboards", price: 40, currency: "USD" })

function renderCart(items: CartItem[]) {
  localStorage.setItem("ecommerce.cart", JSON.stringify(items))
  return renderWithProviders(<CartSheet />)
}
const stored = () => JSON.parse(localStorage.getItem("ecommerce.cart")!) as CartItem[]
/** Clicks "Undo" on the most recent toast. */
const undoLastToast = () => act(() => (toastMock.mock.lastCall![1] as { action: { onClick: () => void } }).action.onClick())

describe("CartSheet", () => {
  const animate = jest.fn()
  beforeEach(() => {
    jest.clearAllMocks()
    // jsdom has no Web Animations API.
    Element.prototype.animate = animate
    Element.prototype.getAnimations = () => []
  })

  it("shows an empty state", async () => {
    const user = userEvent.setup()
    renderCart([])
    await user.click(screen.getByRole("button", { name: "Cart, 0 items" }))
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Checkout" })).not.toBeInTheDocument()
  })

  it("lists items with line totals and a subtotal", async () => {
    const user = userEvent.setup()
    renderCart([{ product: t470, quantity: 2 }, { product: mouse, quantity: 1 }])
    await user.click(screen.getByRole("button", { name: "Cart, 3 items" }))
    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("3 items")).toBeInTheDocument()
    expect(within(dialog).getByText("€398.00")).toBeInTheDocument()
    expect(within(dialog).getByRole("link", { name: "ThinkPad T470" })).toHaveAttribute("href", "/products/1")
    expect(within(dialog).getByText("Subtotal").nextSibling).toHaveTextContent("€420.50")
  })

  it("totals each currency separately", async () => {
    const user = userEvent.setup()
    renderCart([{ product: t470, quantity: 1 }, { product: usd, quantity: 1 }])
    await user.click(screen.getByRole("button", { name: /Cart/ }))
    expect(screen.getByText("Subtotal (EUR)")).toBeInTheDocument()
    expect(screen.getByText("Subtotal (USD)")).toBeInTheDocument()
  })

  it("changes quantities within stock, dropping an item at zero", async () => {
    const user = userEvent.setup()
    renderCart([{ product: t470, quantity: 1 }])
    await user.click(screen.getByRole("button", { name: "Cart, 1 items" }))
    const plus = screen.getByRole("button", { name: "Increase quantity" })
    await user.click(plus)
    expect(stored()[0].quantity).toBe(2)
    expect(plus).toBeDisabled() // only 2 in stock
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }))
    await user.click(screen.getByRole("button", { name: "Decrease quantity" }))
    expect(stored()).toEqual([])
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument()
  })

  it("removes an item with an Undo", async () => {
    const user = userEvent.setup()
    renderCart([{ product: t470, quantity: 1 }, { product: mouse, quantity: 1 }])
    await user.click(screen.getByRole("button", { name: /Cart/ }))
    await user.click(screen.getByRole("button", { name: "Remove ThinkPad T470" }))
    expect(toastMock).toHaveBeenCalledWith("Removed ThinkPad T470", expect.anything())
    expect(stored().map((i) => i.product.id)).toEqual([2])
    undoLastToast()
    expect(stored().map((i) => i.product.id)).toEqual([1, 2])
  })

  it("clears the cart with an Undo", async () => {
    const user = userEvent.setup()
    renderCart([{ product: t470, quantity: 1 }])
    await user.click(screen.getByRole("button", { name: /Cart/ }))
    await user.click(screen.getByRole("button", { name: "Clear Cart" }))
    expect(toastMock).toHaveBeenCalledWith("Cart cleared", expect.anything())
    expect(stored()).toEqual([])
    undoLastToast()
    expect(stored()).toHaveLength(1)
  })

  it("explains that checkout isn't connected", async () => {
    const user = userEvent.setup()
    renderCart([{ product: t470, quantity: 1 }])
    await user.click(screen.getByRole("button", { name: /Cart/ }))
    await user.click(screen.getByRole("button", { name: "Checkout" }))
    expect(toastMock.info).toHaveBeenCalledWith(expect.stringContaining("Checkout isn’t connected"))
  })

  it("keeps the cart open when a toast (e.g. Undo) is clicked", async () => {
    const user = userEvent.setup()
    renderCart([{ product: t470, quantity: 1 }])
    const toaster = document.createElement("section")
    toaster.setAttribute("data-sonner-toaster", "")
    const button = document.createElement("button")
    toaster.append(button)
    document.body.append(toaster)

    await user.click(screen.getByRole("button", { name: /Cart/ }))
    fireEvent.pointerDown(button)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    toaster.remove()
  })

  it("caps the badge at 99+", () => {
    renderCart([{ product: { ...mouse, available_quantity: 500 }, quantity: 120 }])
    expect(screen.getByRole("button", { name: "Cart, 120 items" })).toHaveTextContent("99+")
  })

  describe("badge bump when something is added", () => {
    /** Rendered next to the cart so the test can add items. */
    function AddButton() {
      const cart = useCart()
      return <button onClick={() => cart.add(mouse)}>add</button>
    }

    it("animates the badge, unless reduced motion is on", async () => {
      const user = userEvent.setup()
      const mm = mockMatchMedia()
      localStorage.setItem("ecommerce.cart", JSON.stringify([{ product: mouse, quantity: 1 }]))
      renderWithProviders(
        <>
          <CartSheet />
          <AddButton />
        </>,
      )
      await user.click(screen.getByRole("button", { name: "add" }))
      expect(animate).toHaveBeenCalledTimes(1)

      mm.set("(prefers-reduced-motion: reduce)", true)
      await user.click(screen.getByRole("button", { name: "add" }))
      expect(animate).toHaveBeenCalledTimes(1)
      mm.restore()
    })
  })

  it("closes when clicking outside it", async () => {
    const user = userEvent.setup()
    renderCart([{ product: t470, quantity: 1 }])
    await user.click(screen.getByRole("button", { name: /Cart/ }))
    fireEvent.pointerDown(document.body)
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })

  it("restarts the badge bump instead of stacking animations", async () => {
    const user = userEvent.setup()
    const running = { cancel: jest.fn() }
    Element.prototype.getAnimations = () => [running as unknown as Animation]
    localStorage.setItem("ecommerce.cart", JSON.stringify([{ product: mouse, quantity: 1 }]))
    function Add() {
      const cart = useCart()
      return <button onClick={() => cart.add(mouse)}>add</button>
    }
    renderWithProviders(
      <>
        <CartSheet />
        <Add />
      </>,
    )
    await user.click(screen.getByRole("button", { name: "add" }))
    expect(running.cancel).toHaveBeenCalled()
    expect(animate).toHaveBeenCalled()
  })
})
