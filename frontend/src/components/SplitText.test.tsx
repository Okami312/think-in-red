import { act, render, screen, waitFor } from "@testing-library/react"
import SplitText from "@/components/SplitText"
import { SectionHeading } from "@/components/home/reveal-text"
import { mockMatchMedia } from "@/test/utils"

/**
 * SplitText is a third-party React Bits component (excluded from coverage).
 * These tests cover how this app uses it: hero letters on load, section
 * headings by word on scroll, masked, with the red accent colour.
 */
describe("SplitText as used by the app", () => {
  let mm: ReturnType<typeof mockMatchMedia>
  afterEach(() => mm?.restore())

  it("splits hero lines into letters and reveals them on load", async () => {
    mm = mockMatchMedia()
    const { container } = render(
      <SplitText text="Built for work." tag="span" splitType="chars" mask trigger="load" from={{ yPercent: 110 }} to={{ yPercent: 0 }} />,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.tagName).toBe("SPAN")
    // The full sentence is still the element's text…
    expect(el).toHaveTextContent("Built for work.")
    // …but it's now split into one piece per letter (spaces excluded), and becomes visible.
    await waitFor(() => expect(el.style.visibility).not.toBe("hidden"))
    const letters = [...el.querySelectorAll("*")].filter((n) => n.children.length === 0 && n.textContent!.trim().length === 1)
    expect(letters.length).toBe("Builtforwork.".length)
  })

  it("renders a section heading as an h2 split into words", async () => {
    mm = mockMatchMedia()
    render(<SectionHeading index="01" eyebrow="Categories" title="Six ways in." />)
    const heading = screen.getByRole("heading", { level: 2 })
    expect(heading).toHaveTextContent("Six ways in.")
    expect(screen.getByText("01 — Categories")).toBeInTheDocument()
  })

  it("shows text at once for reduced motion, and reports it's done", () => {
    mm = mockMatchMedia({ "(prefers-reduced-motion: reduce)": true })
    const onDone = jest.fn()
    const { container } = render(
      <SplitText text="Finished in red." trigger="load" accentColor="#e0281f" onLetterAnimationComplete={onDone} />,
    )
    expect((container.firstElementChild as HTMLElement).style.visibility).not.toBe("hidden")
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it("stays hidden until web fonts load, so letters are measured with the right font", async () => {
    mm = mockMatchMedia({ "(prefers-reduced-motion: reduce)": true })
    let fontsReady!: () => void
    Object.defineProperty(document, "fonts", {
      configurable: true,
      value: { status: "loading", ready: new Promise<void>((r) => (fontsReady = r)) },
    })
    const { container } = render(<SplitText text="Six ways in." trigger="view" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.style.visibility).toBe("hidden")

    Object.defineProperty(document, "fonts", { configurable: true, value: { status: "loaded", ready: Promise.resolve() } })
    await act(async () => fontsReady())
    expect(el.style.visibility).not.toBe("hidden")
    // @ts-expect-error -- remove the test stub
    delete document.fonts
  })
})
