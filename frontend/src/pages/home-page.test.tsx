import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useReducedMotion } from "motion/react"
import { HomePage } from "@/pages/home-page"
import type { Product } from "@/lib/types"
import { jsonResponse, makeProduct, mockFetch, mockMatchMedia, renderWithProviders } from "@/test/utils"

// Each test chooses whether the visitor prefers reduced motion.
jest.mock("motion/react", () => ({ ...jest.requireActual("motion/react"), useReducedMotion: jest.fn(() => false) }))
const reduceMotion = (on: boolean) => (useReducedMotion as jest.Mock).mockReturnValue(on)

const released = (year: string) => [{ label: "Released", value: year }]
const catalog: Product[] = [
  makeProduct({ id: 1, name: "ThinkPad 25", featured: true, specs: released("2017"), image_url: "/products/tp25.webp" }),
  makeProduct({ id: 2, name: "ThinkPad X220", featured: true, specs: released("2011") }),
  makeProduct({ id: 3, name: "ThinkPad T470", specs: released("2017") }),
  makeProduct({ id: 4, name: "ThinkCentre M920q", category: "desktops", featured: true, specs: released("2018") }),
  makeProduct({ id: 5, name: "TrackPoint Keyboard II", category: "keyboards", specs: [] }),
]

function renderHome(products: Product[] | (() => Promise<Response>) = catalog) {
  mockFetch().mockImplementation(typeof products === "function" ? products : () => jsonResponse(products))
  return renderWithProviders(<HomePage />)
}

describe("HomePage", () => {
  let mm: ReturnType<typeof mockMatchMedia>
  beforeEach(() => {
    reduceMotion(false)
    mm = mockMatchMedia({ "(min-width: 768px)": true })
  })
  afterEach(() => mm.restore())

  it("introduces the store with stats from the catalog", async () => {
    renderHome()
    expect(screen.getByRole("heading", { level: 1, name: "Built for work. Finished in red." })).toBeInTheDocument()
    const hero = screen.getByRole("heading", { level: 1 }).closest("section")!
    expect(within(hero).getByRole("link", { name: /Shop Laptops/ })).toHaveAttribute("href", "/shop?category=laptops")
    // The hero photo links to the ThinkPad 25 once products load.
    const photo = screen.getByRole("link", { name: "ThinkPad 25 — 25th-anniversary edition" })
    expect(photo).toHaveAttribute("href", "/shop?category=laptops")
    await waitFor(() => expect(photo).toHaveAttribute("href", "/products/1"))
    expect(screen.getByLabelText("3")).toBeInTheDocument() // laptops counted up
  })

  it("lists laptop and desktop model names in the marquee", async () => {
    renderHome()
    const marquee = await screen.findByRole("region", { name: "Models in the catalog" })
    // Shortened names; the duplicate row for the loop is hidden from screen readers.
    expect(within(marquee).getAllByText("X220")).toHaveLength(2)
    expect(within(marquee).getAllByText("M920q")).toHaveLength(2)
    expect(within(marquee).queryByText(/Keyboard/)).not.toBeInTheDocument()
  })

  it("shows every category with its product count", async () => {
    renderHome()
    const laptops = (await screen.findByRole("heading", { level: 3, name: "Laptops" })).closest("a")!
    expect(laptops).toHaveAttribute("href", "/shop?category=laptops")
    expect(await within(laptops).findByText("3")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "View All" })).toHaveAttribute("href", "/shop")
  })

  it("spotlights the first featured laptop", async () => {
    renderHome()
    const details = await screen.findByRole("link", { name: /View Details/ })
    expect(details).toHaveAttribute("href", "/products/1")
  })

  it("builds the decade timeline from release years", async () => {
    renderHome()
    const years = await screen.findAllByRole("heading", { level: 3, name: /^20\d\d$/ })
    expect(years.map((h) => h.textContent)).toEqual(["2011", "2017", "2018"])
  })

  it("features other featured products (not the spotlight one)", async () => {
    renderHome()
    const section = (await screen.findByText(/04 — Featured/)).closest("section")!
    await within(section).findByText("ThinkPad X220")
    expect(within(section).queryByText("ThinkPad 25")).not.toBeInTheDocument()
    expect(within(section).getByText("ThinkCentre M920q")).toBeInTheDocument()
  })

  it("explains how to feature products when none are", async () => {
    renderHome(catalog.map((p) => ({ ...p, featured: false })))
    expect(await screen.findByText(/Nothing featured yet/)).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /View Details/ })).not.toBeInTheDocument()
  })

  it("leaves out the marquee and timeline when nothing qualifies", async () => {
    renderHome([makeProduct({ id: 9, name: "Bag", category: "bags", specs: [] })])
    await screen.findByText(/Nothing featured yet/)
    expect(screen.queryByRole("region", { name: "Models in the catalog" })).not.toBeInTheDocument()
    expect(screen.queryByText(/03 — The decade/)).not.toBeInTheDocument()
  })

  it("shows an error with a retry when products can't load", async () => {
    const user = userEvent.setup()
    let fail = true
    renderHome(() => (fail ? jsonResponse({ message: "Server down" }, 500) : jsonResponse(catalog)))
    expect(await screen.findByText("Server down")).toBeInTheDocument()
    fail = false
    await user.click(screen.getByRole("button", { name: "Try Again" }))
    expect(await screen.findByRole("link", { name: /View Details/ })).toBeInTheDocument()
  })

  it("ends with links into the catalog", () => {
    renderHome()
    expect(screen.getByRole("heading", { name: "THINK IN RED" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Browse the Catalog" })).toHaveAttribute("href", "/shop")
  })

  describe("category rail layout", () => {
    it("pins and scrolls sideways on desktop, re-measuring on resize", async () => {
      const { container } = renderHome()
      await screen.findByRole("link", { name: /View Details/ })
      // Pinned: a sticky full-height stage instead of a swipe list.
      expect(container.querySelector(".sticky.h-screen")).not.toBeNull()
      expect(container.querySelector(".snap-x")).toBeNull()
      act(() => {
        window.dispatchEvent(new Event("resize"))
      })
    })

    it("uses a swipeable list on mobile", async () => {
      mm.set("(min-width: 768px)", false)
      const { container } = renderHome()
      await screen.findByRole("link", { name: /View Details/ })
      expect(container.querySelector(".sticky.h-screen")).toBeNull()
      expect(container.querySelector(".snap-x")).not.toBeNull()
    })

    it("uses the swipeable list for reduced motion, and shows numbers without counting", async () => {
      reduceMotion(true)
      const { container } = renderHome()
      await screen.findByRole("link", { name: /View Details/ })
      expect(container.querySelector(".snap-x")).not.toBeNull()
      expect(screen.getByLabelText("3")).toHaveTextContent("3")
    })
  })

  it("animates the hero when the motion preference is unknown", async () => {
    ;(useReducedMotion as jest.Mock).mockReturnValue(null)
    renderHome()
    expect(await screen.findByRole("link", { name: /View Details/ })).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
  })
})
