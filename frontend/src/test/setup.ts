import "@testing-library/jest-dom"

// Browser APIs jsdom doesn't implement.

// Motion's whileInView uses IntersectionObserver: report everything as visible.
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
Object.assign(globalThis, { IntersectionObserver: MockIntersectionObserver })

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.assign(globalThis, { ResizeObserver: MockResizeObserver })

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
})

window.scrollTo = () => {}
Element.prototype.scrollIntoView = () => {}

// Radix Select uses pointer capture when it opens.
Element.prototype.hasPointerCapture = () => false
Element.prototype.setPointerCapture = () => {}
Element.prototype.releasePointerCapture = () => {}

afterEach(() => {
  localStorage.clear()
})
