import { MinusIcon, PlusIcon, ShoppingBagIcon, ShoppingCartIcon, Trash2Icon } from "lucide-react"
import { useEffect, useRef } from "react"
import { Link } from "react-router"
import { toast } from "sonner"
import { ProductVisual } from "@/components/product-visual"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useCart } from "@/lib/cart"
import { formatPrice } from "@/lib/format"

export function CartSheet() {
  const cart = useCart()

  // Feedback: bump the count badge when something is added (WAAPI, interruptible).
  const badgeRef = useRef<HTMLSpanElement>(null)
  const prevCount = useRef(cart.count)
  useEffect(() => {
    const grew = cart.count > prevCount.current
    prevCount.current = cart.count
    const el = badgeRef.current
    if (!grew || !el || matchMedia("(prefers-reduced-motion: reduce)").matches) return
    el.getAnimations().forEach((a) => a.cancel())
    el.animate([{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], {
      duration: 320,
      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
    })
  }, [cart.count])

  // Destructive actions get an undo window instead of a confirm dialog.
  function removeWithUndo(productId: number) {
    const before = cart.items
    const item = before.find((i) => i.product.id === productId)
    cart.remove(productId)
    toast(`Removed ${item?.product.name ?? "item"}`, { action: { label: "Undo", onClick: () => cart.replace(before) } })
  }
  function clearWithUndo() {
    const before = cart.items
    cart.clear()
    toast("Cart cleared", { action: { label: "Undo", onClick: () => cart.replace(before) } })
  }

  // Products can be priced in different currencies, so total per currency.
  const totals = new Map<string, number>()
  for (const { product, quantity } of cart.items) {
    totals.set(product.currency, (totals.get(product.currency) ?? 0) + product.price * quantity)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label={`Cart, ${cart.count} items`}>
          <ShoppingCartIcon />
          {cart.count > 0 && (
            <span ref={badgeRef} className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-semibold text-primary-foreground tabular-nums">
              {cart.count > 99 ? "99+" : cart.count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        className="flex w-full flex-col sm:max-w-md"
        // clicking a toast (e.g. "Undo") isn't "outside" — keep the cart open
        onInteractOutside={(e) => {
          if ((e.target as Element | null)?.closest?.("[data-sonner-toaster]")) e.preventDefault()
        }}
      >
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
          <SheetDescription>
            {cart.count === 0 ? "Nothing here yet." : `${cart.count} item${cart.count === 1 ? "" : "s"}`}
          </SheetDescription>
        </SheetHeader>

        {cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-muted-foreground">
            <ShoppingBagIcon className="size-10 stroke-[1.25]" />
            <p className="text-sm">Add something from the store to see it here.</p>
          </div>
        ) : (
          <ul className="flex-1 space-y-4 overflow-y-auto px-4">
            {cart.items.map(({ product, quantity }) => (
              <li key={product.id} className="flex gap-3">
                <ProductVisual category={product.category} imageUrl={product.image_url} className="size-16 shrink-0 rounded-md" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/products/${product.id}`} className="truncate text-sm font-medium hover:underline">
                      {product.name}
                    </Link>
                    <span className="text-sm font-medium tabular-nums">
                      {formatPrice(product.price * quantity, product.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-xs"
                      aria-label="Decrease quantity"
                      onClick={() => cart.setQuantity(product.id, quantity - 1)}
                    >
                      <MinusIcon />
                    </Button>
                    <span className="w-7 text-center text-sm tabular-nums">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon-xs"
                      aria-label="Increase quantity"
                      disabled={quantity >= product.available_quantity}
                      onClick={() => cart.setQuantity(product.id, quantity + 1)}
                    >
                      <PlusIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="ml-auto text-muted-foreground"
                      aria-label={`Remove ${product.name}`}
                      onClick={() => removeWithUndo(product.id)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {cart.items.length > 0 && (
          <SheetFooter>
            <Separator />
            {[...totals].map(([currency, total]) => (
              <div key={currency} className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal{totals.size > 1 ? ` (${currency})` : ""}</span>
                <span className="font-semibold tabular-nums">{formatPrice(total, currency)}</span>
              </div>
            ))}
            <Button
              size="lg"
              onClick={() => toast.info("Checkout isn’t connected yet — this portfolio demo has no orders API.")}
            >
              Checkout
            </Button>
            <Button variant="ghost" size="sm" onClick={clearWithUndo}>
              Clear Cart
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
