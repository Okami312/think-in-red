import type { Product } from "@/lib/types"

/** Endless strip of model names. Pauses on hover; static for reduced motion. */
export function ModelMarquee({ products }: { products: Product[] }) {
  const names = products
    .filter((p) => p.category === "laptops" || p.category === "desktops")
    .map((p) => p.name.replace(/^ThinkPad (?=[A-Z]\d|[A-Z]{1,2}\d)/, "").replace(/^ThinkCentre /, ""))
  if (names.length === 0) return null
  const row = (hidden: boolean) =>
    names.map((name, i) => (
      <span key={`${hidden}-${i}`} aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-10">
        <span
          className="text-5xl font-semibold tracking-[-0.04em] whitespace-nowrap text-transparent transition-colors duration-300 hover:text-foreground sm:text-7xl"
          style={{ WebkitTextStroke: "1px color-mix(in oklch, var(--foreground) 40%, transparent)" }}
        >
          {name}
        </span>
        <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
      </span>
    ))

  return (
    <section aria-label="Models in the catalog" className="group overflow-hidden border-y py-8">
      <div className="marquee flex w-max gap-10 group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </section>
  )
}
