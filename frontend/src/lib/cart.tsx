import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import type { Product } from "@/lib/types"

const CART_KEY = "ecommerce.cart"

export type CartItem = { product: Product; quantity: number }

type CartState = {
  items: CartItem[]
  count: number
  add: (product: Product, quantity?: number) => void
  setQuantity: (productId: number, quantity: number) => void
  remove: (productId: number) => void
  clear: () => void
  /** Restore a previous cart (used by "Undo"). */
  replace: (items: CartItem[]) => void
}

const CartContext = createContext<CartState | null>(null)

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

/** Browser-only cart: the backend has no orders yet. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load)

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items])

  const value = useMemo<CartState>(() => {
    const clamp = (product: Product, quantity: number) =>
      Math.max(0, Math.min(quantity, product.available_quantity))
    return {
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      add: (product, quantity = 1) =>
        setItems((prev) => {
          const existing = prev.find((i) => i.product.id === product.id)
          if (existing) {
            return prev.map((i) =>
              i.product.id === product.id
                ? { product, quantity: clamp(product, i.quantity + quantity) }
                : i,
            )
          }
          return [...prev, { product, quantity: clamp(product, quantity) }]
        }),
      setQuantity: (productId, quantity) =>
        setItems((prev) =>
          prev
            .map((i) => (i.product.id === productId ? { ...i, quantity: clamp(i.product, quantity) } : i))
            .filter((i) => i.quantity > 0),
        ),
      remove: (productId) => setItems((prev) => prev.filter((i) => i.product.id !== productId)),
      clear: () => setItems([]),
      replace: (next) => setItems(next),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>")
  return ctx
}
