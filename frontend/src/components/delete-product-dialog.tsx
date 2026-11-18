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
import { useDeleteProduct } from "@/lib/products"
import type { Product } from "@/lib/types"

export function DeleteProductDialog({
  product,
  onOpenChange,
}: {
  product: Product | null
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteProduct()

  async function confirm() {
    if (!product) return
    try {
      await remove.mutateAsync(product.id)
      toast.success(`Deleted ${product.name}`)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't delete the product")
    }
  }

  return (
    <AlertDialog open={product !== null} onOpenChange={(open) => !remove.isPending && onOpenChange(open)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {product?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            It will be removed from the store. The record is soft-deleted in the database, so it can
            be restored there if needed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Cancel</AlertDialogCancel>
          {/* A plain Button (not AlertDialogAction) so the dialog stays open while deleting. */}
          <Button variant="destructive" disabled={remove.isPending} onClick={confirm}>
            {remove.isPending && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
            {remove.isPending ? "Deleting…" : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
