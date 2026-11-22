import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { DatePicker } from "@/components/date-picker"
import { ErrorState } from "@/components/error-state"
import { ProductArt } from "@/components/product-art"
import { ProductVisual } from "@/components/product-visual"
import { CATEGORIES } from "@/lib/categories"

describe("DatePicker", () => {
  function Harness({ initial = "", onValue = jest.fn() }: { initial?: string; onValue?: (v: string) => void }) {
    const [value, setValue] = useState(initial)
    return (
      <DatePicker
        id="d"
        value={value}
        placeholder="Anytime"
        onChange={(v) => {
          setValue(v)
          onValue(v)
        }}
      />
    )
  }

  it("shows the placeholder, then the picked day as YYYY-MM-DD", async () => {
    const user = userEvent.setup()
    const onValue = jest.fn()
    render(<Harness initial="2026-06-10" onValue={onValue} />)
    expect(screen.getByRole("button", { name: /Jun 10, 2026/ })).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /Jun 10, 2026/ }))
    await user.click(screen.getByRole("button", { name: /June 15/ }))
    expect(onValue).toHaveBeenLastCalledWith("2026-06-15")
    expect(screen.queryByRole("grid")).not.toBeInTheDocument() // closes after picking
  })

  it("clears with the X button, and by un-selecting the day", async () => {
    const user = userEvent.setup()
    const onValue = jest.fn()
    render(<Harness initial="2026-06-10" onValue={onValue} />)
    await user.click(screen.getByRole("button", { name: "Clear date" }))
    expect(onValue).toHaveBeenLastCalledWith("")
    expect(screen.getByRole("button", { name: /Anytime/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Clear date" })).not.toBeInTheDocument()

    render(<Harness initial="2026-06-10" onValue={onValue} />)
    await user.click(screen.getByRole("button", { name: /Jun 10, 2026/ }))
    await user.click(screen.getByRole("button", { name: /June 10/ }))
    expect(onValue).toHaveBeenLastCalledWith("")
  })
})

it("DatePicker shows 'No date' when no placeholder is given", () => {
  render(<DatePicker value="" onChange={() => {}} />)
  expect(screen.getByRole("button", { name: /No date/ })).toBeInTheDocument()
})

describe("ErrorState", () => {
  it("shows a generic message for non-Error values and hides retry without a handler", () => {
    render(<ErrorState error="weird" />)
    expect(screen.getByText("Unknown error")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })
})

describe("ProductVisual", () => {
  it("falls back to the category art when a photo fails, and retries a new URL", () => {
    const { rerender, container } = render(<ProductVisual category="mice" imageUrl="/broken.webp" alt="Mouse" />)
    fireEvent.error(screen.getByRole("img", { name: "Mouse" }))
    expect(screen.queryByRole("img", { name: "Mouse" })).not.toBeInTheDocument()
    expect(container.querySelector("svg")).not.toBeNull()

    rerender(<ProductVisual category="mice" imageUrl="/fixed.webp" alt="Mouse" />)
    expect(screen.getByRole("img", { name: "Mouse" })).toHaveAttribute("src", "/fixed.webp")
  })
})

describe("ProductArt", () => {
  it.each(CATEGORIES.map((c) => c.slug))("draws an illustration for %s", (slug) => {
    const { container } = render(<ProductArt category={slug} />)
    expect(container.querySelector("svg")?.children.length).toBeGreaterThan(0)
  })

  it("draws a generic illustration for unknown categories", () => {
    const { container } = render(<ProductArt category="phones" />)
    expect(container.querySelector("svg")?.children.length).toBeGreaterThan(0)
  })

  it("animates the laptop's details only when asked", () => {
    const still = render(<ProductArt category="laptops" />)
    expect(still.container.querySelector(".animate-pop")).toBeNull()
    still.unmount()
    const animated = render(<ProductArt category="laptops" animated />)
    expect(animated.container.querySelector(".animate-pop")).not.toBeNull()
  })
})
