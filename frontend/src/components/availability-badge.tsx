import { Badge } from "@/components/ui/badge"
import { formatDay, getAvailability } from "@/lib/format"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

export const LOW_STOCK = 2

export function AvailabilityBadge({ product, className }: { product: Product; className?: string }) {
  const a = getAvailability(product)
  const base = cn("font-normal", className)
  switch (a.status) {
    case "available":
      // Used stock is always low, so only flag the very last units.
      return product.available_quantity <= LOW_STOCK ? (
        <Badge variant="outline" className={cn(base, "border-warning/40 bg-warning/10 text-warning")}>
          {product.available_quantity === 1 ? "Last One" : `Only ${product.available_quantity} Left`}
        </Badge>
      ) : (
        <Badge variant="outline" className={cn(base, "border-success/30 bg-success/10 text-success")}>
          In Stock
        </Badge>
      )
    case "out-of-stock":
      return (
        <Badge variant="outline" className={cn(base, "text-muted-foreground")}>
          Sold Out
        </Badge>
      )
    case "upcoming":
      return (
        <Badge variant="outline" className={cn(base, "border-info/40 bg-info/10 text-info")}>
          From {formatDay(a.from)}
        </Badge>
      )
    case "ended":
      return (
        <Badge variant="outline" className={cn(base, "text-muted-foreground")}>
          Discontinued
        </Badge>
      )
  }
}
