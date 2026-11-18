import { ScrollTrigger } from "gsap/ScrollTrigger"
import Lenis from "lenis"
import "lenis/dist/lenis.css"
import { useEffect } from "react"
import { useLocation } from "react-router"

/**
 * Smooth (inertial) page scrolling on desktop via Lenis.
 * - Off for prefers-reduced-motion and touch devices (native scrolling is better there).
 * - Leaves scrollable popups (dialogs, sheets, selects, menus) to native scrolling.
 * - Pauses while a modal locks the page.
 */
export function SmoothScroll() {
  const { pathname } = useLocation()

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
    const fine = matchMedia("(pointer: fine)").matches
    if (reduce || !fine) return

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.12,
      prevent: (node) =>
        !!node.closest?.('[role="dialog"], [role="listbox"], [role="menu"], [data-slot$="-content"]'),
    })
    window.__lenis = lenis
    lenis.on("scroll", ScrollTrigger.update) // keep GSAP scroll triggers in step with smoothing

    // Radix modals set data-scroll-locked on <body>; stop smoothing while it's there.
    const sync = () => (document.body.hasAttribute("data-scroll-locked") ? lenis.stop() : lenis.start())
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] })

    return () => {
      observer.disconnect()
      lenis.destroy()
      window.__lenis = undefined
    }
  }, [])

  // GSAP scroll triggers cache positions; recompute when the page height changes
  // (pinned sections measure themselves after mount, products load async, …).
  useEffect(() => {
    let frame = 0
    let lastHeight = 0
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight
      if (h === lastHeight) return
      lastHeight = h
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => ScrollTrigger.refresh())
    })
    ro.observe(document.body)
    return () => {
      ro.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [])

  // New page → start at the top (immediately, no smooth scroll-up).
  useEffect(() => {
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])

  return null
}

declare global {
  interface Window {
    __lenis?: Lenis
  }
}
