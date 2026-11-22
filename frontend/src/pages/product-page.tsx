import { BadgeCheckIcon, ChevronRightIcon, MinusIcon, PlusIcon, ShoppingCartIcon, TruckIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { Link, useParams } from "react-router"
import { toast } from "sonner"
import { AvailabilityBadge } from "@/components/availability-badge"
import { ErrorState } from "@/components/error-state"
import { ProductGrid } from "@/components/product-grid"
import { ProductVisual } from "@/components/product-visual"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api"
import { useCart } from "@/lib/cart"
import { categoryLabel, categoryStyle } from "@/lib/categories"
import { formatDay, formatPrice, getAvailability } from "@/lib/format"
import { useProduct, useProducts } from "@/lib/products"
import { productPhotos } from "@/lib/images"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"
import { NotFoundPage } from "@/pages/not-found-page"

export function ProductPage() {
  const id = Number(useParams().id)
  const { data: product, isPending, error, refetch } = useProduct(id)

  if (!Number.isInteger(id) || id <= 0 || (error instanceof ApiError && error.status === 404)) {
    return <NotFoundPage />
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : (
        // key: reset quantity state when navigating between products
        <ProductDetails key={product.id} product={product} />
      )}
    </div>
  )
}

function ProductDetails({ product }: { product: Product }) {
  const cart = useCart()
  const { data: all } = useProducts()
  const [qty, setQty] = useState(1)

  const canBuy = getAvailability(product).status === "available"
  const inCart = cart.items.find((i) => i.product.id === product.id)?.quantity ?? 0
  const maxQty = Math.max(0, product.available_quantity - inCart)
  const related = (all ?? []).filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  return (
    <>
      <nav aria-label="Breadcrumb" style={categoryStyle(product.category)} className="mb-6 flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
        <Link to="/shop" className="hover:text-foreground">Shop</Link>
        <ChevronRightIcon className="size-3.5" />
        <Link to={`/shop?category=${product.category}`} className="flex items-center gap-1.5 hover:text-foreground">
          <span className="size-1.5 rounded-full bg-(--accent)" aria-hidden />
          {categoryLabel(product.category)}
        </Link>
        <ChevronRightIcon className="size-3.5" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <ProductGallery product={product} />

        <div className="animate-enter flex min-w-0 flex-col" style={{ "--delay": "60ms" } as React.CSSProperties}>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="font-mono text-2xl tabular-nums">{formatPrice(product.price, product.currency)}</span>
            <AvailabilityBadge product={product} />
          </div>
          <p className="mt-6 leading-relaxed whitespace-pre-line text-muted-foreground">{product.description}</p>

          <div className="mt-8 flex items-center gap-3">
            <div className="flex items-center rounded-lg border">
              <Button variant="ghost" size="icon" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}>
                <MinusIcon />
              </Button>
              <span className="w-8 text-center font-mono text-sm tabular-nums" aria-live="polite">{qty}</span>
              <Button variant="ghost" size="icon" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty((q) => q + 1)}>
                <PlusIcon />
              </Button>
            </div>
            <Button
              size="lg"
              className="flex-1"
              disabled={!canBuy || maxQty === 0}
              onClick={() => {
                const n = Math.min(qty, maxQty)
                cart.add(product, n)
                toast.success(`Added ${n} × ${product.name} to cart`)
                setQty(1)
              }}
            >
              <ShoppingCartIcon data-icon="inline-start" />
              {canBuy && maxQty === 0 ? "All Stock Is in Your Cart" : "Add to Cart"}
            </Button>
          </div>
          {getAvailability(product).status === "upcoming" && product.sold_from && (
            <p className="mt-3 text-sm text-muted-foreground">Available to order from {formatDay(product.sold_from)}.</p>
          )}

          <ul className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li className="flex items-center gap-2"><TruckIcon className="size-4" /> Free shipping over €99</li>
            <li className="flex items-center gap-2"><BadgeCheckIcon className="size-4" /> Tested before shipping</li>
          </ul>

          {product.specs.length > 0 && (
            <section className="mt-10">
              <h2 className="mb-3 font-medium">Specifications</h2>
              <dl className="divide-y rounded-xl border">
                {product.specs.map((s, i) => (
                  <div key={i} className="grid grid-cols-[8rem_1fr] gap-4 px-4 py-3 text-sm sm:grid-cols-[10rem_1fr]">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="font-mono">{s.value}</dd>
                  </div>
                ))}
                <div className="grid grid-cols-[8rem_1fr] gap-4 px-4 py-3 text-sm sm:grid-cols-[10rem_1fr]">
                  <dt className="text-muted-foreground">In stock</dt>
                  <dd className="font-mono tabular-nums">{product.available_quantity}</dd>
                </div>
              </dl>
            </section>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-xl font-semibold tracking-tight">More {categoryLabel(product.category)}</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  )
}

/** Main image + thumbnails. Switching crossfades (it's a state change, not navigation). */
function ProductGallery({ product }: { product: Product }) {
  const images = productPhotos(product)
  const [active, setActive] = useState(0)
  const current = images[active] ?? null

  return (
    <div className="animate-enter md:sticky md:top-24 md:self-start">
      <div className="relative aspect-square overflow-hidden rounded-3xl border">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={current ?? "art"}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <ProductVisual
              category={product.category}
              imageUrl={current}
              alt={active === 0 ? product.name : `${product.name} — image ${active + 1}`}
              className="size-full"
              artClassName="w-3/4"
              imageClassName="p-[6%]"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2" role="group" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "size-20 shrink-0 overflow-hidden rounded-xl border transition-[border-color,opacity] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                i === active ? "border-(--accent)" : "opacity-60 hover:opacity-100",
              )}
              style={categoryStyle(product.category)}
            >
              <ProductVisual
                category={product.category}
                imageUrl={src}
                className="size-full"
                imageClassName="p-1.5 drop-shadow-none"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
