import { render, screen } from "@testing-library/react"
import { AvailabilityBadge } from "@/components/availability-badge"
import { makeProduct } from "@/test/utils"

const show = (overrides: Parameters<typeof makeProduct>[0]) =>
  render(<AvailabilityBadge product={makeProduct(overrides)} />)

describe("AvailabilityBadge", () => {
  it.each([
    [{ available_quantity: 12 }, "In Stock"],
    [{ available_quantity: 2 }, "Only 2 Left"],
    [{ available_quantity: 1 }, "Last One"],
    [{ available_quantity: 0 }, "Sold Out"],
    [{ sold_to: "2001-01-01" }, "Discontinued"],
  ])("%o → %s", (overrides, label) => {
    show(overrides)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it("shows the start date for upcoming products", () => {
    show({ sold_from: "2999-03-01" })
    expect(screen.getByText(/^From .*2999/)).toBeInTheDocument()
  })
})
