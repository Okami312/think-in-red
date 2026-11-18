import { act, renderHook } from "@testing-library/react"
import { CartProvider, useCart } from "@/lib/cart"
import { makeProduct } from "@/test/utils"

const setup = () => renderHook(() => useCart(), { wrapper: CartProvider })

describe("cart", () => {
  const t470 = makeProduct({ id: 1, available_quantity: 3 })
  const mouse = makeProduct({ id: 2, name: "Silent Mouse", category: "mice", price: 22 })

  it("adds products and counts items", () => {
    const { result } = setup()
    act(() => result.current.add(t470))
    act(() => result.current.add(t470))
    act(() => result.current.add(mouse, 2))
    expect(result.current.items.map((i) => [i.product.id, i.quantity])).toEqual([
      [1, 2],
      [2, 2],
    ])
    expect(result.current.count).toBe(4)
  })

  it("never exceeds the available stock", () => {
    const { result } = setup()
    act(() => result.current.add(t470, 10))
    expect(result.current.items[0].quantity).toBe(3)
    act(() => result.current.setQuantity(1, 99))
    expect(result.current.items[0].quantity).toBe(3)
  })

  it("removes an item when its quantity drops to 0", () => {
    const { result } = setup()
    act(() => result.current.add(t470))
    act(() => result.current.setQuantity(1, 0))
    expect(result.current.items).toEqual([])
  })

  it("restores a previous cart for Undo", () => {
    const { result } = setup()
    act(() => result.current.add(t470))
    act(() => result.current.add(mouse))
    const before = result.current.items
    act(() => result.current.clear())
    expect(result.current.count).toBe(0)
    act(() => result.current.replace(before))
    expect(result.current.count).toBe(2)
  })

  it("persists to localStorage and loads it back", () => {
    const first = setup()
    act(() => first.result.current.add(mouse, 2))
    first.unmount()
    expect(JSON.parse(localStorage.getItem("ecommerce.cart")!)).toHaveLength(1)

    const second = setup()
    expect(second.result.current.count).toBe(2)
  })

  it("throws a helpful error outside the provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useCart())).toThrow("useCart must be used inside <CartProvider>")
  })
})
