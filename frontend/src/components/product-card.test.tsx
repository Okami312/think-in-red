import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductCard } from "@/components/product-card"
import { makeProduct, renderWithProviders } from "@/test/utils"

describe("ProductCard", () => {
  it("shows the product, its category, key specs and price, and links to it", () => {
    renderWithProviders(<ProductCard product={makeProduct({ id: 8 })} />)
    expect(screen.getByRole("heading", { name: "ThinkPad T470" })).toBeInTheDocument()
    expect(screen.getByText("Laptops")).toBeInTheDocument()
    expect(screen.getByText("2017 · Intel Core i5-7300U")).toBeInTheDocument()
    expect(screen.getByText(/199[.,]00/)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "ThinkPad T470" })).toHaveAttribute("href", "/products/8")
  })

  it("adds the product to the cart", async () => {
    renderWithProviders(<ProductCard product={makeProduct({ id: 8 })} />)
    await userEvent.click(screen.getByRole("button", { name: "Add ThinkPad T470 to cart" }))
    const stored = JSON.parse(localStorage.getItem("ecommerce.cart")!)
    expect(stored).toEqual([expect.objectContaining({ quantity: 1, product: expect.objectContaining({ id: 8 }) })])
  })

  it("can't be added when sold out", () => {
    renderWithProviders(<ProductCard product={makeProduct({ available_quantity: 0 })} />)
    expect(screen.getByRole("button", { name: /to cart/ })).toBeDisabled()
  })

  it("shows the product photo when there is one", () => {
    renderWithProviders(<ProductCard product={makeProduct({ image_url: "/products/t470.webp" })} />)
    expect(screen.getByRole("img", { name: "ThinkPad T470" })).toHaveAttribute("src", "/products/t470.webp")
  })
})
