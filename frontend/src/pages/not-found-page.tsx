import { CompassIcon } from "lucide-react"
import { Link } from "react-router"
import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-24 text-center">
      <CompassIcon className="size-10 stroke-[1.25] text-muted-foreground" />
      <div>
        <h1 className="text-xl font-semibold">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">That page or product doesn’t exist. Head back to the store to keep browsing.</p>
      </div>
      <Button asChild>
        <Link to="/">Back to the Store</Link>
      </Button>
    </div>
  )
}
