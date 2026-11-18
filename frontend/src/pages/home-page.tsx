import { ErrorState } from "@/components/error-state"
import { CategoryRail } from "@/components/home/category-rail"
import { DecadeTimeline } from "@/components/home/decade-timeline"
import { Hero } from "@/components/home/hero"
import { ModelMarquee } from "@/components/home/model-marquee"
import { Outro } from "@/components/home/outro"
import { SectionHeading } from "@/components/home/reveal-text"
import { Spotlight } from "@/components/home/spotlight"
import { ProductGrid, ProductGridSkeleton } from "@/components/product-grid"
import { useProducts } from "@/lib/products"

export function HomePage() {
  const { data: products, isPending, error, refetch } = useProducts()
  const featured = (products ?? []).filter((p) => p.featured)
  const spotlight = featured.find((p) => p.category === "laptops")
  const counts = products?.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <>
      <Hero products={products} />
      {products && <ModelMarquee products={products} />}
      <CategoryRail counts={counts} />
      {spotlight && <Spotlight product={spotlight} />}
      {products && <DecadeTimeline products={products} />}

      <section className="mx-auto max-w-6xl px-4 py-24">
        <SectionHeading index="04" eyebrow="Featured" title="Picked from the shelf." />
        {error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <ProductGridSkeleton count={4} />
        ) : featured.length > 0 ? (
          <ProductGrid products={featured.filter((p) => p !== spotlight).slice(0, 4)} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing featured yet — mark products as featured in the admin panel.
          </p>
        )}
      </section>

      <Outro />
    </>
  )
}
