import { act, renderHook } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { createElement } from "react"
import { useMediaQuery } from "@/lib/use-media-query"
import { mockMatchMedia } from "@/test/utils"

describe("useMediaQuery", () => {
  let mm: ReturnType<typeof mockMatchMedia>
  beforeEach(() => (mm = mockMatchMedia({ "(min-width: 768px)": true })))
  afterEach(() => mm.restore())

  it("returns the current match and updates when it changes", () => {
    const { result, unmount } = renderHook(() => useMediaQuery("(min-width: 768px)"))
    expect(result.current).toBe(true)
    act(() => mm.set("(min-width: 768px)", false))
    expect(result.current).toBe(false)
    unmount()
    expect(mm.listenerCount("(min-width: 768px)")).toBe(0)
  })

  it("is false when rendered on a server (no window to ask)", () => {
    function Probe() {
      return String(useMediaQuery("(min-width: 768px)"))
    }
    expect(renderToString(createElement(Probe))).toBe("false")
  })
})
