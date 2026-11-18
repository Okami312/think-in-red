import type { Product } from "@/lib/types"

export function formatPrice(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount)
  } catch {
    // Unknown currency code — fall back to "12.34 XYZ"
    return `${amount.toFixed(2)} ${currency}`
  }
}

/** Parse a YYYY-MM-DD string as a local date (no timezone shift). */
export function parseDay(value: string): Date {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function formatDay(value: string) {
  return parseDay(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}

export type Availability =
  | { status: "available" }
  | { status: "out-of-stock" }
  | { status: "upcoming"; from: string }
  | { status: "ended" }

export function getAvailability(product: Product, today = new Date()): Availability {
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (product.sold_from && parseDay(product.sold_from) > day) {
    return { status: "upcoming", from: product.sold_from }
  }
  if (product.sold_to && parseDay(product.sold_to) < day) return { status: "ended" }
  if (product.available_quantity <= 0) return { status: "out-of-stock" }
  return { status: "available" }
}

/** Year from the "Released" spec row (e.g. "2017 — limited edition" → 2017). */
export function releaseYear(product: Product): number | null {
  const value = product.specs.find((s) => s.label === "Released")?.value
  const year = value ? Number.parseInt(value, 10) : Number.NaN
  return Number.isFinite(year) ? year : null
}
