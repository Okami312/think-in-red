import { act, render, renderHook, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { ThemeProvider, useTheme } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { mockMatchMedia } from "@/test/utils"

const DARK = "(prefers-color-scheme: dark)"
const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>
const root = document.documentElement

describe("ThemeProvider", () => {
  let mm: ReturnType<typeof mockMatchMedia>
  let meta: HTMLMetaElement
  beforeEach(() => {
    mm = mockMatchMedia()
    meta = document.createElement("meta")
    meta.name = "theme-color"
    document.head.append(meta)
  })
  afterEach(() => {
    mm.restore()
    meta.remove()
    root.classList.remove("dark")
  })

  it("defaults to dark and applies it to the page", () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current).toMatchObject({ theme: "dark", resolvedTheme: "dark" })
    expect(root).toHaveClass("dark")
    expect(root.style.colorScheme).toBe("dark")
    expect(meta.content).toBe("#121216")
  })

  it("restores a saved theme and persists changes", () => {
    localStorage.setItem("ecommerce.theme", "light")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.resolvedTheme).toBe("light")
    expect(root).not.toHaveClass("dark")
    expect(meta.content).toBe("#f9f9fb")

    act(() => result.current.setTheme("dark"))
    expect(localStorage.getItem("ecommerce.theme")).toBe("dark")
    expect(root).toHaveClass("dark")
  })

  it("ignores an unknown saved value", () => {
    localStorage.setItem("ecommerce.theme", "sepia")
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("dark")
  })

  it("follows the operating system in system mode, including live changes", () => {
    localStorage.setItem("ecommerce.theme", "system")
    const { result, unmount } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.resolvedTheme).toBe("light")

    act(() => mm.set(DARK, true))
    expect(result.current.resolvedTheme).toBe("dark")
    expect(root).toHaveClass("dark")

    unmount()
    expect(mm.listenerCount(DARK)).toBe(0) // stops listening when unmounted
  })

  it("still works when storage is unavailable (e.g. private mode)", () => {
    const get = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const set = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked")
    })
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.theme).toBe("dark")
    act(() => result.current.setTheme("light"))
    expect(result.current.theme).toBe("light")
    get.mockRestore()
    set.mockRestore()
  })

  it("useTheme explains what's wrong when used outside the provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    expect(() => renderHook(() => useTheme())).toThrow("useTheme must be used inside <ThemeProvider>")
    jest.restoreAllMocks()
  })
})

describe("ThemeToggle", () => {
  it("switches between dark and light with a matching label", async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />, { wrapper })
    await user.click(screen.getByRole("button", { name: "Switch to light theme" }))
    expect(root).not.toHaveClass("dark")
    await user.click(screen.getByRole("button", { name: "Switch to dark theme" }))
    expect(root).toHaveClass("dark")
  })
})
