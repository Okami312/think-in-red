import { CATEGORIES, categoryLabel, categoryStyle, isCategory } from "@/lib/categories"

describe("categories", () => {
  it("has the six shop categories", () => {
    expect(CATEGORIES.map((c) => c.slug)).toEqual(["laptops", "monitors", "keyboards", "mice", "bags", "desktops"])
  })

  it("recognises valid slugs only", () => {
    expect(isCategory("mice")).toBe(true)
    expect(isCategory("writing-pads")).toBe(false)
    expect(isCategory(null)).toBe(false)
  })

  it("maps slugs to labels, passing unknown values through", () => {
    expect(categoryLabel("desktops")).toBe("Desktops")
    expect(categoryLabel("phones")).toBe("phones")
  })

  it("sets --accent to the category colour, falling back to the brand colour", () => {
    expect(categoryStyle("mice")).toEqual({ "--accent": "var(--cat-mice)" })
    expect(categoryStyle("phones")).toEqual({ "--accent": "var(--primary)" })
  })
})
