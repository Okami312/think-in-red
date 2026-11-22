import { motion, useReducedMotion, useScroll } from "motion/react"
import { useRef } from "react"
import { Link } from "react-router"
import { SectionHeading } from "@/components/home/reveal-text"
import { categoryStyle } from "@/lib/categories"
import { formatPrice, releaseYear } from "@/lib/format"
import { EASE_OUT, IN_VIEW } from "@/lib/motion"
import type { Product } from "@/lib/types"

/** 2010 → 2020, built from the catalog. A red line draws down as you scroll. */
export function DecadeTimeline({ products }: { products: Product[] }) {
  const byYear = new Map<number, Product[]>()
  for (const p of products) {
    const y = releaseYear(p)
    if (y === null) continue
    byYear.set(y, [...(byYear.get(y) ?? []), p])
  }
  // Return before the scroll hooks: useScroll throws if its target ref is never attached.
  if (byYear.size === 0) return null
  return <Timeline byYear={byYear} />
}

function Timeline({ byYear }: { byYear: Map<number, Product[]> }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] })
  const years = [...byYear.keys()].sort((a, b) => a - b)

  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <SectionHeading index="03" eyebrow="The decade" title="Ten years of getting it right." />
      <div ref={ref} className="relative">
        {/* rail + scroll-drawn progress */}
        <div aria-hidden className="absolute top-2 bottom-2 left-[6.5px] w-0.5 rounded-full bg-border" />
        <motion.div
          aria-hidden
          className="absolute top-2 bottom-2 left-[6.5px] w-0.5 origin-top rounded-full bg-primary shadow-[0_0_12px_var(--primary)]"
          style={{ scaleY: reduce ? 1 : scrollYProgress }}
        />
        <ol className="space-y-14">
          {years.map((year) => (
            <li key={year} className="relative grid gap-4 pl-10 md:grid-cols-[12rem_1fr] md:gap-10">
              <motion.span
                aria-hidden
                className="absolute top-3 left-0 size-[15px] rounded-full border-2 border-primary bg-background"
                initial={{ scale: 0.4, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={IN_VIEW}
                transition={{ duration: 0.4, ease: EASE_OUT }}
              />
              <motion.h3
                className="font-mono text-5xl tracking-tight tabular-nums md:text-6xl"
                initial={{ opacity: 0.15 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "0px 0px -30% 0px" }}
                transition={{ duration: 0.6 }}
              >
                {year}
              </motion.h3>
              <ul className="flex flex-wrap gap-2 self-center">
                {byYear.get(year)!.map((p, i) => (
                  <motion.li
                    key={p.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={IN_VIEW}
                    transition={{ duration: 0.5, ease: EASE_OUT, delay: i * 0.05 }}
                  >
                    <Link
                      to={`/products/${p.id}`}
                      style={categoryStyle(p.category)}
                      className="group flex items-center gap-2 rounded-full border bg-card py-1.5 pr-3 pl-2.5 text-sm transition-[border-color,background-color] duration-200 hover:border-(--accent)/60 hover:bg-(--accent)/8 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <span className="size-2 rounded-full bg-(--accent)" aria-hidden />
                      {p.name}
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">
                        {formatPrice(p.price, p.currency)}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
