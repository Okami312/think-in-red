import { formatDay, formatPrice, getAvailability, parseDay, releaseYear } from "@/lib/format"
import { makeProduct } from "@/test/utils"

describe("formatPrice", () => {
  it("formats euros with two decimals", () => {
    const text = formatPrice(449, "EUR")
    expect(text).toContain("€")
    expect(text).toMatch(/449[.,]00/)
  })

  it("falls back to 'amount CODE' for an unknown currency", () => {
    expect(formatPrice(12.5, "NOPE")).toBe("12.50 NOPE")
  })
})

describe("parseDay / formatDay", () => {
  it("parses YYYY-MM-DD as a local date (no timezone shift)", () => {
    const d = parseDay("2027-02-01")
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2027, 1, 1])
  })

  it("formats a readable date", () => {
    expect(formatDay("2027-02-01")).toMatch(/2027/)
  })
})

describe("getAvailability", () => {
  const today = new Date(2026, 10, 18)

  it("is available when in stock and inside the sale window", () => {
    expect(getAvailability(makeProduct(), today)).toEqual({ status: "available" })
  })

  it("is out of stock at quantity 0", () => {
    expect(getAvailability(makeProduct({ available_quantity: 0 }), today).status).toBe("out-of-stock")
  })

  it("is upcoming before sold_from (even with stock)", () => {
    expect(getAvailability(makeProduct({ sold_from: "2027-02-01" }), today)).toEqual({
      status: "upcoming",
      from: "2027-02-01",
    })
  })

  it("has ended after sold_to", () => {
    expect(getAvailability(makeProduct({ sold_to: "2026-01-01" }), today).status).toBe("ended")
  })

  it("treats sold_to === today as still on sale", () => {
    expect(getAvailability(makeProduct({ sold_to: "2026-11-18" }), today).status).toBe("available")
  })
})

describe("releaseYear", () => {
  it("reads the year from the Released spec row", () => {
    expect(releaseYear(makeProduct())).toBe(2017)
    expect(
      releaseYear(makeProduct({ specs: [{ label: "Released", value: "2017 — limited edition" }] })),
    ).toBe(2017)
  })

  it("is null without a Released row", () => {
    expect(releaseYear(makeProduct({ specs: [] }))).toBeNull()
  })
})
