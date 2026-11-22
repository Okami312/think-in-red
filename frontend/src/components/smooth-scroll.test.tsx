import { act, render } from "@testing-library/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import { createMemoryRouter, RouterProvider } from "react-router"
import { SmoothScroll } from "@/components/smooth-scroll"
import { mockMatchMedia } from "@/test/utils"

jest.mock("lenis", () => jest.fn())
jest.mock("lenis/dist/lenis.css", () => ({}), { virtual: true })
jest.mock("gsap/ScrollTrigger", () => ({ ScrollTrigger: { update: jest.fn(), refresh: jest.fn() } }))

const LenisMock = Lenis as unknown as jest.Mock
const FINE = "(pointer: fine)"
const REDUCE = "(prefers-reduced-motion: reduce)"

function fakeLenis() {
  const lenis = { on: jest.fn(), stop: jest.fn(), start: jest.fn(), destroy: jest.fn(), scrollTo: jest.fn() }
  LenisMock.mockImplementation(() => lenis)
  return lenis
}

function renderAt(path = "/a") {
  const router = createMemoryRouter([{ path: "*", element: <SmoothScroll /> }], { initialEntries: [path] })
  const utils = render(<RouterProvider router={router} />)
  return { ...utils, router }
}

describe("SmoothScroll", () => {
  let mm: ReturnType<typeof mockMatchMedia>
  let resize: (() => void) | undefined
  beforeEach(() => {
    jest.clearAllMocks()
    window.__lenis = undefined
    globalThis.ResizeObserver = class {
      constructor(cb: () => void) {
        resize = cb
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0)
      return 1
    })
  })
  afterEach(() => {
    mm.restore()
    jest.restoreAllMocks()
  })

  it("smooths scrolling with a mouse, keeping GSAP in sync, and cleans up", () => {
    mm = mockMatchMedia({ [FINE]: true })
    const lenis = fakeLenis()
    const { unmount } = renderAt()
    expect(LenisMock).toHaveBeenCalledWith(expect.objectContaining({ autoRaf: true }))
    expect(window.__lenis).toBe(lenis)
    expect(lenis.on).toHaveBeenCalledWith("scroll", ScrollTrigger.update)
    unmount()
    expect(lenis.destroy).toHaveBeenCalled()
    expect(window.__lenis).toBeUndefined()
  })

  it("leaves dialogs, menus and listboxes to native scrolling", () => {
    mm = mockMatchMedia({ [FINE]: true })
    fakeLenis()
    renderAt()
    const { prevent } = LenisMock.mock.calls[0][0] as { prevent: (n: Element) => boolean }
    const inDialog = document.createElement("div")
    const dialog = document.createElement("div")
    dialog.setAttribute("role", "dialog")
    dialog.append(inDialog)
    expect(prevent(inDialog)).toBe(true)
    expect(prevent(document.createElement("p"))).toBe(false)
  })

  it("pauses while a modal locks the page", async () => {
    mm = mockMatchMedia({ [FINE]: true })
    const lenis = fakeLenis()
    renderAt()
    await act(async () => document.body.setAttribute("data-scroll-locked", "1"))
    expect(lenis.stop).toHaveBeenCalled()
    await act(async () => document.body.removeAttribute("data-scroll-locked"))
    expect(lenis.start).toHaveBeenCalled()
  })

  it.each([
    ["reduced motion is on", { [FINE]: true, [REDUCE]: true }],
    ["the device is touch-only", { [FINE]: false }],
  ])("stays off when %s", (_label, media) => {
    mm = mockMatchMedia(media)
    renderAt()
    expect(LenisMock).not.toHaveBeenCalled()
  })

  it("scrolls to the top on navigation (instantly when smoothing)", async () => {
    mm = mockMatchMedia({ [FINE]: true })
    const lenis = fakeLenis()
    const { router } = renderAt("/a")
    await act(() => router.navigate("/b"))
    expect(lenis.scrollTo).toHaveBeenCalledWith(0, { immediate: true })
  })

  it("scrolls natively to the top when not smoothing", async () => {
    mm = mockMatchMedia()
    const scrollTo = jest.spyOn(window, "scrollTo").mockImplementation(() => {})
    const { router } = renderAt("/a")
    await act(() => router.navigate("/b"))
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })

  it("refreshes GSAP scroll positions only when the page height changes", () => {
    mm = mockMatchMedia()
    renderAt()
    const height = jest.spyOn(document.documentElement, "scrollHeight", "get")
    height.mockReturnValue(1000)
    resize!()
    resize!() // same height: ignored
    expect(ScrollTrigger.refresh).toHaveBeenCalledTimes(1)
    height.mockReturnValue(1500)
    resize!()
    expect(ScrollTrigger.refresh).toHaveBeenCalledTimes(2)
  })
})
