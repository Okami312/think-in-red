import { AlertTriangleIcon, CheckCircle2Icon, CircleSlashIcon, ImageOffIcon, MoreHorizontalIcon, PackageIcon, PencilIcon, PlusIcon, SearchIcon, StarIcon, Trash2Icon, type LucideIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router"
import { AvailabilityBadge, LOW_STOCK } from "@/components/availability-badge"
import { BulkDeleteDialog } from "@/components/bulk-delete-dialog"
import { DeleteProductDialog } from "@/components/delete-product-dialog"
import { ErrorState } from "@/components/error-state"
import { ProductFormDialog } from "@/components/product-form-dialog"
import { ProductVisual } from "@/components/product-visual"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CATEGORIES, categoryLabel, categoryStyle } from "@/lib/categories"
import { formatPrice, getAvailability } from "@/lib/format"
import { hasPhotos } from "@/lib/images"
import { useProducts } from "@/lib/products"
import type { Product } from "@/lib/types"

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: string }) {
  return (
    <Card className="flex-row items-center gap-3 px-4 py-3">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs text-muted-foreground">{label}</span>
        <span className="font-mono text-2xl leading-tight font-medium tabular-nums">{value}</span>
      </div>
    </Card>
  )
}

export function AdminProductsPage() {
  const { data: products, isPending, error, refetch } = useProducts()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [photos, setPhotos] = useState<"all" | "with" | "without">("all")
  const [bulkOpen, setBulkOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState<Product | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (products ?? []).filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (photos === "all" || hasPhotos(p) === (photos === "with")) &&
        (!q || `${p.id} ${p.name}`.toLowerCase().includes(q)),
    )
  }, [products, search, category, photos])

  const stats = useMemo(() => {
    const list = products ?? []
    return {
      total: list.length,
      available: list.filter((p) => getAvailability(p).status === "available").length,
      outOfStock: list.filter((p) => p.available_quantity === 0).length,
      lowStock: list.filter((p) => p.available_quantity > 0 && p.available_quantity <= LOW_STOCK).length,
    }
  }, [products])

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }
  function openEdit(product: Product) {
    setEditing(product)
    setFormOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Create, edit and remove products in the store.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon data-icon="inline-start" />
          New Product
        </Button>
      </div>

      {products && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Products" value={stats.total} icon={PackageIcon} tone="bg-primary/12 text-primary" />
          <Stat label="On Sale Now" value={stats.available} icon={CheckCircle2Icon} tone="bg-success/12 text-success" />
          <Stat label={`Low Stock (≤\u00a0${LOW_STOCK})`} value={stats.lowStock} icon={AlertTriangleIcon} tone="bg-warning/12 text-warning" />
          <Stat label="Out of Stock" value={stats.outOfStock} icon={CircleSlashIcon} tone="bg-muted text-muted-foreground" />
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
      <div className="relative max-w-sm flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="search"
          name="admin-search"
          autoComplete="off"
          placeholder="Search by name or ID…"
          aria-label="Search products"
          className="pl-8"
        />
      </div>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by category">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={photos} onValueChange={(v) => setPhotos(v as typeof photos)}>
        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by photos">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any photos</SelectItem>
          <SelectItem value="with">With photos</SelectItem>
          <SelectItem value="without">No photos</SelectItem>
        </SelectContent>
      </Select>
      {photos === "without" && filtered.length > 0 && (
        <Button variant="destructive" className="sm:ml-auto" onClick={() => setBulkOpen(true)}>
          <Trash2Icon data-icon="inline-start" />
          Delete {filtered.length === 1 ? "this product" : `all ${filtered.length}`}
        </Button>
      )}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-14 pl-4">ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Stock</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-4"><Skeleton className="h-4 w-6" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-4 w-16" /></TableCell>
                    <TableCell className="hidden sm:table-cell"><Skeleton className="ml-auto h-4 w-8" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <PackageIcon className="size-8 stroke-[1.25]" />
                      {products.length === 0 ? (
                        <>
                          <p className="text-sm">No products yet.</p>
                          <Button size="sm" onClick={openCreate}>
                            <PlusIcon data-icon="inline-start" />
                            Add Your First Product
                          </Button>
                        </>
                      ) : (
                        <p className="text-sm">No products match these filters.</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="pl-4 text-muted-foreground tabular-nums">{p.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductVisual
                            category={p.category}
                            imageUrl={p.image_url}
                            className="h-9 w-12 shrink-0 rounded-md border"
                            artClassName="w-4/5"
                          />
                          <div className="min-w-0">
                            <Link to={`/products/${p.id}`} className="flex items-center gap-1.5 truncate font-medium hover:underline">
                              <span className="truncate">{p.name}</span>
                              {p.featured && <StarIcon className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Featured" />}
                            </Link>
                            {!hasPhotos(p) && (
                              <Badge variant="outline" className="mt-0.5 gap-1 text-muted-foreground">
                                <ImageOffIcon aria-hidden />
                                No photos
                              </Badge>
                            )}
                            <span style={categoryStyle(p.category)} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <span className="size-1.5 rounded-full bg-(--accent)" aria-hidden />
                              {categoryLabel(p.category)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <AvailabilityBadge product={p} />
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatPrice(p.price, p.currency)}</TableCell>
                      <TableCell className="hidden text-right font-mono tabular-nums sm:table-cell">{p.available_quantity}</TableCell>
                      <TableCell className="pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.name}`}>
                              <MoreHorizontalIcon />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => openEdit(p)}>
                              <PencilIcon />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(p)}>
                              <Trash2Icon />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} />
      {/* The confirmed list is what's shown now: search + category + "No photos" filters. */}
      <BulkDeleteDialog products={photos === "without" ? filtered : []} open={bulkOpen} onOpenChange={setBulkOpen} />
      <DeleteProductDialog product={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </div>
  )
}
