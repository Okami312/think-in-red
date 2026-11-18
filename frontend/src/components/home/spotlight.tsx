import { ArrowRightIcon } from "lucide-react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { Link } from "react-router"
import { SectionHeading } from "@/components/home/reveal-text"
import { ProductVisual } from "@/components/product-visual"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/format"
import { EASE_OUT, IN_VIEW } from "@/lib/motion"
import type { Product } from "@/lib/types"

/** The visual stays pinned while the spec sheet scrolls past and reveals row by row. */
export function Spotlight({ product }: { product: Product }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-6, 6])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], reduce ? [1, 1, 1] : [0.9, 1.04, 0.95])

  return (
    <section ref={ref} className="relative border-y bg-muted/20">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-2">
        <div className="md:sticky md:top-24 md:h-[min(72vh,620px)]">
          <motion.div style={{ rotate, scale }} className="h-full">
            <ProductVisual
              category={product.category}
              imageUrl={product.image_url}
              alt={product.name}
              className="aspect-square h-full w-full rounded-3xl border md:aspect-auto"
              artClassName="w-4/5"
            />
          </motion.div>
        </div>

        <div className="min-w-0">
          <SectionHeading index="02" eyebrow="Spotlight" title={product.name} />
          <motion.p
            className="max-w-md text-pretty text-muted-foreground sm:text-lg"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={IN_VIEW}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            {product.description}
          </motion.p>

          <dl className="mt-10 border-t">
            {product.specs.map((s, i) => (
              <motion.div
                key={i}
                className="flex items-baseline justify-between gap-6 border-b py-5"
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "0px 0px -18% 0px" }}
                transition={{ duration: 0.6, ease: EASE_OUT }}
              >
                <dt className="shrink-0 font-mono text-xs tracking-[0.15em] text-muted-foreground uppercase">{s.label}</dt>
                <dd className="text-right text-lg sm:text-xl">{s.value}</dd>
              </motion.div>
            ))}
          </dl>

          <motion.div
            className="mt-10 flex flex-wrap items-center gap-5"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={IN_VIEW}
            transition={{ duration: 0.6, ease: EASE_OUT }}
          >
            <span className="font-mono text-4xl tabular-nums">{formatPrice(product.price, product.currency)}</span>
            <Button size="lg" className="h-11 rounded-full px-5" asChild>
              <Link to={`/products/${product.id}`}>
                View Details
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
