import { ArrowRightIcon } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { Link } from "react-router"
import { CountUp } from "@/components/home/count-up"
import SplitText from "@/components/SplitText"
import { Button } from "@/components/ui/button"
import { EASE_OUT } from "@/lib/motion"
import type { Product } from "@/lib/types"

export function Hero({ products }: { products: Product[] | undefined }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  // 0 → 1 while the hero scrolls from the top of the viewport to out of view
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const still = reduce ?? false
  const artScale = useTransform(scrollYProgress, [0, 1], still ? [1, 1] : [1, 1.22])
  const artY = useTransform(scrollYProgress, [0, 1], still ? ["0%", "0%"] : ["0%", "22%"])
  const artTilt = useTransform(scrollYProgress, [0, 1], still ? [0, 0] : [0, 22])
  const textY = useTransform(scrollYProgress, [0, 1], still ? ["0%", "0%"] : ["0%", "-35%"])
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0])
  const glow = useTransform(scrollYProgress, [0, 1], [0.7, 1])

  const laptops = products?.filter((p) => p.category === "laptops").length
  const tp25 = products?.find((p) => p.name === "ThinkPad 25")

  return (
    <section ref={ref} className="relative -mt-20 flex min-h-svh items-center overflow-hidden pt-20">
      {/* grid + colour glows */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: glow }}>
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 6%, transparent) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 65% 45%, black 25%, transparent 75%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(44rem 26rem at 74% 48%, color-mix(in oklch, var(--cat-laptops) 22%, transparent), transparent 70%), radial-gradient(30rem 20rem at 8% 90%, color-mix(in oklch, var(--cat-desktops) 14%, transparent), transparent 70%), radial-gradient(24rem 16rem at 50% -5%, color-mix(in oklch, var(--cat-keyboards) 10%, transparent), transparent 70%)",
          }}
        />
      </motion.div>

      {/* vertical rail (editorial detail) */}
      <p className="pointer-events-none absolute top-1/2 left-5 hidden origin-left -translate-y-1/2 -rotate-90 font-mono text-[10px] tracking-[0.35em] text-muted-foreground uppercase xl:block">
        Classic ThinkPads — 2010 / 2020
      </p>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.45fr_1fr]">
        <motion.div style={{ y: textY, opacity: fade }}>
          <motion.p
            className="font-mono text-xs tracking-[0.25em] text-primary uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            Pre-owned · Tested · Ready for work
          </motion.p>
          <h1
            aria-label="Built for work. Finished in red."
            className="mt-5 text-[clamp(2.75rem,5.6vw,4.5rem)] leading-[0.95] font-semibold tracking-[-0.05em]"
          >
            {/* React Bits SplitText: letters rise out of a mask on load */}
            {["Built for work.", "Finished in red."].map((line, i) => (
              // SplitText renders inline-block, so each line gets its own block wrapper
              <span key={line} className="block">
              <SplitText
                text={line}
                tag="span"
                splitType="chars"
                mask
                textAlign="left"
                trigger="load"
                delay={22}
                duration={1}
                ease="expo.out"
                from={{ yPercent: 110 }}
                to={{ yPercent: 0, delay: 0.1 + i * 0.25 }}
                className={i === 1 ? "pb-[0.07em] text-primary" : "pb-[0.07em]"}
              />
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-6 max-w-md text-pretty text-muted-foreground sm:text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.35 }}
          >
            ThinkPads and ThinkCentres from the decade they got everything right — plus the displays,
            TrackPoint keyboards, mice and bags that go with them.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.45 }}
          >
            <Button size="lg" className="h-11 rounded-full px-5" asChild>
              <Link to="/shop?category=laptops">
                Shop Laptops
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 rounded-full px-5" asChild>
              <Link to="/shop">Browse Everything</Link>
            </Button>
          </motion.div>

          {products && (
            <motion.dl
              className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div>
                <dt className="text-xs text-muted-foreground">Machines</dt>
                <dd className="font-mono text-3xl tabular-nums">
                  <CountUp value={products.length} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">ThinkPads</dt>
                <dd className="font-mono text-3xl tabular-nums">
                  <CountUp value={laptops ?? 0} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Years covered</dt>
                <dd className="font-mono text-3xl tabular-nums">
                  <CountUp value={11} />
                </dd>
              </div>
            </motion.dl>
          )}
        </motion.div>

        {/* entrance (outer) + scroll-linked tilt/zoom (inner) */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: EASE_OUT, delay: 0.2 }}
        >
          <motion.div style={{ scale: artScale, y: artY, rotateX: artTilt, transformPerspective: 1200 }}>
            {/* Hero photo: the ThinkPad 25 (links to its page once products load) */}
            <Link
              to={tp25 ? `/products/${tp25.id}` : "/shop?category=laptops"}
              aria-label="ThinkPad 25 — 25th-anniversary edition"
              className="group relative mx-auto block w-full max-w-[34rem] rounded-3xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <img
                src="/products/hero-thinkpad-25.webp"
                alt=""
                width={1400}
                height={1148}
                fetchPriority="high"
                className="relative w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-(--ease-out) group-hover:-rotate-1 group-hover:scale-[1.02]"
              />
              <span className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background/70 px-3 py-1.5 text-xs whitespace-nowrap backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
                ThinkPad 25 · 2017 limited edition
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        aria-hidden
        style={{ opacity: fade }}
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex"
      >
        <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Scroll</span>
        <span className="scroll-cue h-10 w-px origin-top bg-foreground/40" />
      </motion.div>
    </section>
  )
}
