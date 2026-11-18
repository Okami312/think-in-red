import { PackageSearchIcon, SearchIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router"
import { ErrorState } from "@/components/error-state"
import { ProductGrid, ProductGridSkeleton } from "@/components/product-grid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CATEGORIES, categoryStyle, isCategory } from "@/lib/categories"
import { getAvailability } from "@/lib/format"
import { useProducts } from "@/lib/products"
import type { Product } from "@/lib/types"
import { cn } from "@/lib/utils"

const SORTS = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name",
} as const
type Sort = keyof typeof SORTS

const compare: Record<Sort, (a: Product, b: Product) => number> = {
  featured: (a, b) => {
    const rank = (p: Product) => (getAvailability(p).status === "available" ? 0 : 2) - (p.featured ? 1 : 0)
    return rank(a) - rank(b) || a.id - b.id
  },
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  name: (a, b) => a.name.localeCompare(b.name),
}

export function ShopPage() {
  const { data: products, isPending, error, refetch } = useProducts()
  // Filters live in the URL so they survive reloads and can be shared.
  const [params, setParams] = useSearchParams()
  const category = isCategory(params.get("category")) ? params.get("category")! : null
  const urlSearch = params.get("q") ?? ""
  const location = useLocation()
  // The search box keeps its own state: URL updates are async, so binding the
  // input straight to the URL drops keystrokes. The URL is synced after a pause.
  const [search, setSearch] = useState(urlSearch)
  const sort: Sort = (params.get("sort") as Sort) in SORTS ? (params.get("sort") as Sort) : "featured"
  const current = CATEGORIES.find((c) => c.slug === category)

  function update(key: string, value: string | null) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
    )
  }

  // Write the search to the URL once typing pauses.
  useEffect(() => {
    if (search === urlSearch) return
    const timer = setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (search) next.set("q", search)
          else next.delete("q")
          return next
        },
        { replace: true, state: { fromSearchBox: true } },
      )
    }, 250)
    return () => clearTimeout(timer)
  }, [search, urlSearch, setParams])

  // Follow URL changes that didn't come from the box (links, back button).
  // (Adjusting state during render, as React recommends over an effect.)
  const fromSearchBox = (location.state as { fromSearchBox?: boolean } | null)?.fromSearchBox
  const [seenUrlSearch, setSeenUrlSearch] = useState(urlSearch)
  if (urlSearch !== seenUrlSearch) {
    setSeenUrlSearch(urlSearch)
    if (!fromSearchBox) setSearch(urlSearch)
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (products ?? [])
      .filter((p) => !category || p.category === category)
      .filter(
        (p) =>
          !q ||
          [p.name, p.description, ...p.specs.map((s) => s.value)].join(" ").toLowerCase().includes(q),
      )
      .sort(compare[sort])
  }, [products, category, search, sort])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="font-mono text-xs tracking-[0.2em] text-primary uppercase">Shop</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">{current?.label ?? "Everything"}</h1>
        <p className="mt-1 text-muted-foreground">{current?.blurb ?? "Every pre-owned piece in the ThinkInRed catalog."}</p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Categories">
        {[{ slug: null, label: "All" }, ...CATEGORIES].map((c) => (
          <Button
            key={c.slug ?? "all"}
            role="tab"
            aria-selected={category === c.slug}
            size="sm"
            variant="outline"
            style={c.slug ? categoryStyle(c.slug) : ({ "--accent": "var(--foreground)" } as React.CSSProperties)}
            className={cn(
              "rounded-full",
              category === c.slug
                ? "border-(--accent) bg-(--accent)/15 text-foreground hover:bg-(--accent)/20"
                : "text-muted-foreground hover:border-(--accent)/50",
            )}
            onClick={() => update("category", c.slug)}
          >
            {c.slug && <span className="size-1.5 rounded-full bg-(--accent)" aria-hidden />}
            {c.label}
          </Button>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            name="q"
            autoComplete="off"
            spellCheck={false}
            placeholder="Search name or specs, e.g. “Quadro” or “7-row”…"
            aria-label="Search products"
            className="pl-8"
          />
        </div>
        <Select value={sort} onValueChange={(v) => update("sort", v === "featured" ? null : v)}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(SORTS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <ProductGridSkeleton />
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center">
          <PackageSearchIcon className="size-10 stroke-[1.25] text-muted-foreground" />
          <div>
            <p className="font-medium">No matches</p>
            <p className="text-sm text-muted-foreground">Try a different search or category.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/shop">Clear Filters</Link>
          </Button>
        </div>
      ) : (
        <>
          <p className="mb-3 font-mono text-xs text-muted-foreground">
            {visible.length} product{visible.length === 1 ? "" : "s"}
          </p>
          {/* keyed by category: switching category replays the entrance; typing doesn't */}
          <ProductGrid key={category ?? "all"} products={visible} />
        </>
      )}
    </div>
  )
}
