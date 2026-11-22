import { ArrowUpRightIcon } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { SectionHeading } from "@/components/home/reveal-text"
import { ProductVisual } from "@/components/product-visual"
import { CATEGORIES, categoryStyle } from "@/lib/categories"
import { useMediaQuery } from "@/lib/use-media-query"
import { cn } from "@/lib/utils"

function CategoryCard({ index, slug, label, blurb, count, className }: {
  index: number; slug: string; label: string; blurb: string; count?: number; className?: string
}) {
  return (
    <Link
      to={`/shop?category=${slug}`}
      style={categoryStyle(slug)}
      className={cn(
        "group relative flex shrink-0 flex-col overflow-hidden rounded-3xl border bg-card transition-[border-color,box-shadow] duration-300 hover:border-(--accent)/60 hover:shadow-2xl hover:shadow-(--accent)/15 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <ProductVisual
        category={slug}
        className="min-h-0 flex-1 border-b"
        artClassName="w-1/2 transition-transform duration-700 ease-(--ease-out) group-hover:scale-110"
      />
      <div className="flex items-end justify-between gap-4 p-6">
        <div className="min-w-0">
          <p className="font-mono text-xs text-(--accent)">0{index + 1}</p>
          <h3 className="mt-1 text-3xl font-semibold tracking-[-0.03em]">{label}</h3>
          <p className="mt-1 truncate text-sm text-muted-foreground">{blurb}</p>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {count !== undefined && (
            <span className="rounded-full bg-(--accent)/12 px-2.5 py-1 font-mono text-xs text-(--accent) tabular-nums">
              {count}
            </span>
          )}
          <span className="flex size-10 items-center justify-center rounded-full border transition-[background-color,border-color,color] duration-300 group-hover:border-(--accent) group-hover:bg-(--accent) group-hover:text-background">
            <ArrowUpRightIcon className="size-4" aria-hidden />
          </span>
        </span>
      </div>
    </Link>
  )
}

/**
 * Desktop: the section pins and vertical scrolling moves the cards sideways.
 * Mobile / reduced motion: a native horizontal snap list instead.
 */
export function CategoryRail({ counts }: { counts?: Record<string, number> }) {
  const desktop = useMediaQuery("(min-width: 768px)")
  const reduce = useReducedMotion()
  const pinned = desktop && !reduce

  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    if (!pinned || !track.current) return
    const el = track.current
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [pinned])

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])

  const cards = CATEGORIES.map((c, i) => (
    <CategoryCard
      key={c.slug}
      index={i}
      slug={c.slug}
      label={c.label}
      blurb={c.blurb}
      count={counts?.[c.slug]}
      className={pinned ? "h-[58vh] w-[min(26rem,70vw)]" : "aspect-4/5 w-[80vw] max-w-sm snap-start"}
    />
  ))

  const heading = (
    <div className="mx-auto w-full max-w-6xl px-4">
      <SectionHeading index="01" eyebrow="Categories" title="Six ways in.">
        <Link to="/shop" className="rounded-full border px-4 py-2 text-sm transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
          View All
        </Link>
      </SectionHeading>
    </div>
  )

  if (!pinned) {
    return (
      // ref even though nothing pins here: useScroll throws if its target is never attached
      <section ref={section} className="py-20">
        {heading}
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">{cards}</div>
      </section>
    )
  }

  return (
    <section ref={section} className="relative" style={{ height: `calc(100vh + ${distance}px)` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden pt-16">
        {heading}
        <motion.div
          ref={track}
          style={{ x }}
          className="flex w-max gap-5 pr-[max(1rem,calc((100vw-72rem)/2+1rem))] pl-[max(1rem,calc((100vw-72rem)/2+1rem))]"
        >
          {cards}
        </motion.div>
        <div className="mx-auto mt-8 h-px w-full max-w-6xl bg-border px-4">
          <motion.div
            className="h-px origin-left"
            style={{
              scaleX: scrollYProgress,
              backgroundImage:
                "linear-gradient(to right, var(--cat-laptops), var(--cat-monitors), var(--cat-keyboards), var(--cat-mice), var(--cat-bags), var(--cat-desktops))",
            }}
          />
        </div>
      </div>
    </section>
  )
}
