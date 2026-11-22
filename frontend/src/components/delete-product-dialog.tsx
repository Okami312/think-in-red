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
import { errorMessage } from "@/lib/errors"
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
    // Only reachable while open, i.e. while there's a product.
    const target = product!
    try {
      await remove.mutateAsync(target.id)
      toast.success(`Deleted ${target.name}`)
      onOpenChange(false)
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't delete the product"))
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
