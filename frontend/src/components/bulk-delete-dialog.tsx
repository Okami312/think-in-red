import { Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useDeleteProducts } from "@/lib/products"
import type { Product } from "@/lib/types"

/** Confirms deleting every product in `products` (e.g. all without photos). */
export function BulkDeleteDialog({
  products,
  open,
  onOpenChange,
}: {
  products: Product[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteProducts()
  const count = products.length
  const noun = count === 1 ? "product" : "products"

  async function confirm() {
    // Never rejects: individual failures come back as `failed`.
    const { deleted, failed } = await remove.mutateAsync(products.map((p) => p.id))
    if (failed === 0) toast.success(`Deleted ${deleted.length} ${deleted.length === 1 ? "product" : "products"}`)
    else toast.error(`Deleted ${deleted.length}, but ${failed} couldn’t be deleted. Try again.`)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !remove.isPending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {count} {noun} without photos?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {count === 1 ? "It" : "They"} will be removed from the store. Records are soft-deleted in the database, so
                they can be restored there if needed.
              </p>
              <ul className="max-h-40 list-inside list-disc overflow-y-auto text-foreground">
                {products.map((p) => (
                  <li key={p.id} className="truncate">
                    {p.name}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" disabled={remove.isPending || count === 0} onClick={confirm}>
            {remove.isPending && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
            {remove.isPending ? "Deleting…" : `Delete ${count} ${noun}`}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
