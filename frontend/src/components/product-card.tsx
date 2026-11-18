import { PlusIcon } from "lucide-react"
import { motion } from "motion/react"
import { Link } from "react-router"
import { toast } from "sonner"
import { AvailabilityBadge } from "@/components/availability-badge"
import { ProductVisual } from "@/components/product-visual"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart"
import { categoryLabel, categoryStyle } from "@/lib/categories"
import { formatPrice, getAvailability } from "@/lib/format"
import { EASE_OUT, IN_VIEW } from "@/lib/motion"
import type { Product } from "@/lib/types"

export function ProductCard({
  product,
  index = 0,
  ref,
}: {
  product: Product
  index?: number
  ref?: React.Ref<HTMLElement>
}) {
  const cart = useCart()
  const canBuy = getAvailability(product).status === "available"
  const keySpecs = product.specs.slice(0, 2).map((s) => s.value).join(" · ")

  return (
    <motion.article
      ref={ref}
      layout="position"
      // enters as it scrolls into view; columns stagger slightly
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={IN_VIEW}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: EASE_OUT } }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: (index % 4) * 0.07 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-[border-color,box-shadow] duration-300 hover:border-(--accent)/50 hover:shadow-xl hover:shadow-(--accent)/10 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50"
      style={categoryStyle(product.category)}
    >
      <ProductVisual
        category={product.category}
        imageUrl={product.image_url}
        alt={product.name}
        className="aspect-4/3 border-b"
        artClassName="transition-transform duration-700 ease-(--ease-out) group-hover:scale-110"
      />
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 shrink-0 rounded-full bg-(--accent)" aria-hidden />
            <span className="truncate">{categoryLabel(product.category)}</span>
          </span>
          <AvailabilityBadge product={product} />
        </div>
        <h3 className="min-w-0 font-medium leading-snug break-words">
          {/* The stretched link makes the whole card clickable. */}
          <Link to={`/products/${product.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        {keySpecs && <p className="line-clamp-1 font-mono text-xs text-muted-foreground">{keySpecs}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-mono text-base font-medium tabular-nums">
            {formatPrice(product.price, product.currency)}
          </span>
          <Button
            size="icon-sm"
            variant={canBuy ? "default" : "outline"}
            disabled={!canBuy}
            aria-label={`Add ${product.name} to cart`}
            className="relative z-10"
            onClick={() => {
              cart.add(product)
              toast.success(`Added ${product.name} to cart`)
            }}
          >
            <PlusIcon />
          </Button>
        </div>
      </div>
    </motion.article>
  )
}
