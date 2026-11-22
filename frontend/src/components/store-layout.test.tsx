import { act, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { StoreLayout } from "@/components/store-layout"
import { renderRoutes } from "@/test/utils"

jest.mock("lenis", () => jest.fn())

// jsdom can't scroll, so capture the header's scroll handler and drive it directly.
let onScrollY: ((y: number) => void) | undefined
let previousY = 0
jest.mock("motion/react", () => {
  const actual = jest.requireActual("motion/react")
  return {
    ...actual,
    useScroll: () => ({ scrollY: { getPrevious: () => previousY } }),
    useMotionValueEvent: (_value: unknown, _event: string, cb: (y: number) => void) => {
      onScrollY = cb
    },
  }
})
jest.mock("lenis/dist/lenis.css", () => ({}), { virtual: true })

function renderStore(path = "/") {
  return renderRoutes(
    [{ element: <StoreLayout />, children: [{ path: "*", element: <p>Page content</p> }] }],
    { initialPath: path },
  )
}

/** Simulates the page scrolling from the last position to `y`. */
function scrollTo(y: number) {
  act(() => onScrollY!(y))
  previousY = y
}

describe("StoreLayout", () => {
  beforeEach(() => {
    previousY = 0
  })

  it("wraps the page with a skip link, header, main area and footer", () => {
    renderStore()
    expect(screen.getByRole("link", { name: "Skip to Content" })).toHaveAttribute("href", "#main")
    expect(screen.getByRole("main")).toHaveTextContent("Page content")
    const footer = screen.getByRole("contentinfo")
    expect(within(footer).getByRole("link", { name: "Admin Panel" })).toHaveAttribute("href", "/admin")
    expect(within(footer).getByRole("link", { name: "Mice" })).toHaveAttribute("href", "/shop?category=mice")
  })

  it("marks the current category in the navigation", () => {
    renderStore("/shop?category=monitors")
    const header = screen.getByRole("banner")
    expect(within(header).getByRole("link", { name: "Monitors" })).toHaveAttribute("aria-current", "page")
    expect(within(header).getByRole("link", { name: "Laptops" })).not.toHaveAttribute("aria-current")
  })

  it("doesn't mark a category outside the shop", () => {
    renderStore("/products/1?category=monitors")
    expect(within(screen.getByRole("banner")).getByRole("link", { name: "Monitors" })).not.toHaveAttribute("aria-current")
  })

  it("opens the mobile menu and closes it after choosing a link", async () => {
    const user = userEvent.setup()
    const { router } = renderStore()
    await user.click(screen.getByRole("button", { name: "Open menu" }))
    const menu = screen.getByRole("dialog")
    await user.click(within(menu).getByRole("link", { name: "Keyboards" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(router.state.location.search).toBe("?category=keyboards")

    await user.click(screen.getByRole("button", { name: "Open menu" }))
    await user.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Shop All" }))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(router.state.location.pathname).toBe("/shop")
  })

  it("gives the header a background once scrolled", () => {
    renderStore()
    const bar = () => screen.getByRole("banner").firstElementChild!
    expect(bar()).toHaveClass("bg-transparent")
    scrollTo(100)
    expect(bar()).toHaveClass("backdrop-blur-xl")
    scrollTo(10)
    expect(bar()).toHaveClass("bg-transparent")
  })

  it("hides the header while scrolling down far, and brings it back on scroll up", async () => {
    renderStore()
    const header = screen.getByRole("banner")
    const isHidden = () => header.style.transform.includes("-140%")
    scrollTo(200)
    scrollTo(400) // down, past 240px
    await waitFor(() => expect(isHidden()).toBe(true))
    scrollTo(350) // up
    await waitFor(() => expect(isHidden()).toBe(false))
  })

  it("keeps the header visible while the mobile menu is open", async () => {
    const user = userEvent.setup()
    renderStore()
    await user.click(screen.getByRole("button", { name: "Open menu" }))
    scrollTo(300)
    scrollTo(600)
    const header = screen.getByRole("banner", { hidden: true })
    await new Promise((r) => setTimeout(r, 50))
    expect(header.style.transform).not.toContain("-140%")
  })

  it("treats the first scroll as coming from the top", async () => {
    renderStore()
    previousY = undefined as unknown as number
    scrollTo(500)
    await waitFor(() => expect(screen.getByRole("banner").style.transform).toContain("-140%"))
  })
})
