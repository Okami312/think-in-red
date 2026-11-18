// Fixed product categories. Keep in sync with ecommerce-main/src/products/categories.ts.
export const CATEGORIES = [
  { slug: "laptops", label: "Laptops", blurb: "Ultralights to mobile workstations" },
  { slug: "monitors", label: "Monitors", blurb: "16:10 classics to USB-C QHD" },
  { slug: "keyboards", label: "Keyboards", blurb: "TrackPoint, at any desk" },
  { slug: "mice", label: "Mice", blurb: "Wired and wireless classics" },
  { slug: "bags", label: "Bags", blurb: "Carry it all, protected" },
  { slug: "desktops", label: "Desktops", blurb: "ThinkCentre towers, SFF and Tiny PCs" },
] as const

export type Category = (typeof CATEGORIES)[number]["slug"]

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as [Category, ...Category[]]

export function isCategory(value: string | null | undefined): value is Category {
  return CATEGORIES.some((c) => c.slug === value)
}

/** Inline style that sets --accent to the category's colour (see --cat-* in index.css). */
export function categoryStyle(slug: string): React.CSSProperties {
  const accent = isCategory(slug) ? `var(--cat-${slug})` : "var(--primary)"
  return { "--accent": accent } as React.CSSProperties
}

export function categoryLabel(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug
}
