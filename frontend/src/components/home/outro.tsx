import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"

/** Giant outlined wordmark that fills with red as it scrolls into view. */
export function Outro() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] })
  const clip = useTransform(
    scrollYProgress,
    [0.15, 0.85],
    reduce ? ["inset(0 0% 0 0)", "inset(0 0% 0 0)"] : ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
  )

  const word = "THINK IN RED"
  const type = "text-[12.5vw] leading-[0.85] font-semibold tracking-[-0.06em] whitespace-nowrap"

  return (
    <section ref={ref} className="overflow-hidden pt-24 pb-16">
      <div className="relative mx-auto w-fit px-2 select-none">
        <h2
          className={type + " text-transparent"}
          style={{ WebkitTextStroke: "1px color-mix(in oklch, var(--foreground) 30%, transparent)" }}
        >
          {word}
        </h2>
        <motion.p aria-hidden style={{ clipPath: clip }} className={type + " absolute inset-0 px-2 text-primary"}>
          {word}
        </motion.p>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4">
        <p className="max-w-sm text-pretty text-muted-foreground">
          Every machine is tested and cleaned before it ships. Find the one you’ve been looking for.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" className="h-11 rounded-full px-5" asChild>
            <Link to="/shop">Browse the Catalog</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-11 rounded-full px-5" asChild>
            <Link to="/shop?category=laptops">Shop Laptops</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
