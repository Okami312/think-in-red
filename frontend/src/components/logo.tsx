import { Link } from "react-router"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="ThinkInRed home"
      translate="no"
      className={cn("group flex items-center gap-2 rounded-md text-[1.05rem] font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", className)}
    >
      <span className="relative flex size-6 items-center justify-center rounded-[5px] bg-foreground">
        <span className="size-2 rounded-full bg-primary transition-transform group-hover:scale-125" />
      </span>
      <span>
        ThinkIn<span className="text-primary">Red</span>
      </span>
    </Link>
  )
}
