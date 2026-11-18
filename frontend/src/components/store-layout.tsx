import { MenuIcon } from "lucide-react"
import { motion, useMotionValueEvent, useScroll } from "motion/react"
import { useState } from "react"
import { Link, NavLink, Outlet, useLocation, useSearchParams } from "react-router"
import { CartSheet } from "@/components/cart-sheet"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { CATEGORIES, categoryStyle } from "@/lib/categories"
import { cn } from "@/lib/utils"

function useActiveCategory() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  return pathname === "/shop" ? (params.get("category") ?? "all") : null
}

function CategoryNav({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const active = useActiveCategory()
  return (
    <nav className={className}>
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          to={`/shop?category=${c.slug}`}
          onClick={onNavigate}
          aria-current={active === c.slug ? "page" : undefined}
          style={categoryStyle(c.slug)}
          className={cn(
            "group/nav flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            active === c.slug && "text-foreground",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 rounded-full bg-(--accent) opacity-60 transition-opacity group-hover/nav:opacity-100",
              active === c.slug && "opacity-100",
            )}
          />
          {c.label}
        </Link>
      ))}
    </nav>
  )
}

export function StoreLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Header state from scroll position/direction.
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 24)
    setHidden(y > 240 && y > prev && !menuOpen)
  })

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to Content
      </a>
      <SmoothScroll />
      {/* Floating pill header: hides while scrolling down, returns on scroll up */}
      <motion.header
        className="fixed inset-x-0 top-3 z-40 px-3"
        initial={false}
        animate={{ y: hidden ? "-140%" : "0%" }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      >
        <div
          className={cn(
            "mx-auto flex h-12 max-w-6xl items-center gap-3 rounded-full border px-2 pl-4 transition-[background-color,border-color,box-shadow] duration-300",
            scrolled
              ? "border-border bg-background/70 shadow-lg shadow-black/10 backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-2 rounded-full lg:hidden" aria-label="Open menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-2">
                <NavLink to="/shop" onClick={() => setMenuOpen(false)} className="rounded-md px-2.5 py-1.5 text-sm font-medium focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
                  Shop All
                </NavLink>
                <CategoryNav className="flex flex-col" onNavigate={() => setMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <Logo />
          <CategoryNav className="mx-auto hidden items-center lg:flex" />

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Button variant="ghost" size="sm" className="hidden rounded-full sm:inline-flex" asChild>
              <Link to="/shop">Shop All</Link>
            </Button>
            <ThemeToggle />
            <CartSheet />
          </div>
        </div>
      </motion.header>

      <main id="main" tabIndex={-1} className="flex-1 overflow-x-clip pt-20 focus:outline-none">
        {/* keyed by path: a short fade between pages (query changes don't re-trigger it) */}
        <div key={pathname} className="animate-page">
          <Outlet />
        </div>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-sm text-sm text-muted-foreground">
              ThinkInRed is a portfolio project: a shop for pre-owned ThinkPad and ThinkCentre gear from 2010–2020.
              It is not affiliated with or endorsed by Lenovo. Prices are estimates of typical used
              prices on eBay.de; specs are illustrative.
            </p>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-medium">Shop</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link to={`/shop?category=${c.slug}`} className="hover:text-foreground">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-sm font-medium">Project</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/admin" className="hover:text-foreground">
                  Admin Panel
                </Link>
              </li>
              <li>Built with React, shadcn/ui &amp; NestJS</li>
            </ul>
          </div>
        </div>
        <p className="border-t py-4 text-center text-xs text-muted-foreground">
          <span translate="no">ThinkPad</span>, <span translate="no">ThinkCentre</span> &amp; <span translate="no">ThinkVision</span> are trademarks of Lenovo.
        </p>
      </footer>
    </div>
  )
}
