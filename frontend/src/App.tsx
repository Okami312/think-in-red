import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MotionConfig } from "motion/react"
import { createBrowserRouter, RouterProvider } from "react-router"
import { ThemeProvider } from "@/components/theme-provider"
import { StoreLayout } from "@/components/store-layout"
import { Toaster } from "@/components/ui/sonner"
import { ApiError } from "@/lib/api"
import { AuthProvider } from "@/lib/auth"
import { CartProvider } from "@/lib/cart"
import { NotFoundPage } from "@/pages/not-found-page"
import { ProductPage } from "@/pages/product-page"
import { HomePage } from "@/pages/home-page"
import { ShopPage } from "@/pages/shop-page"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Don't retry client errors like 404 — only network/server failures.
      retry: (count, error) =>
        count < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
})

const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "shop", element: <ShopPage /> },
      { path: "products/:id", element: <ProductPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  // Admin is code-split: loaded only when someone opens /admin.
  { path: "admin/login", lazy: async () => ({ Component: (await import("@/pages/login-page")).LoginPage }) },
  {
    path: "admin",
    lazy: async () => ({ Component: (await import("@/components/admin-layout")).AdminLayout }),
    children: [
      {
        index: true,
        lazy: async () => ({ Component: (await import("@/pages/admin-products-page")).AdminProductsPage }),
      },
    ],
  },
])

export default function App() {
  return (
    // reducedMotion="user": Motion drops transform/layout animation for prefers-reduced-motion
    <MotionConfig reducedMotion="user">
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <RouterProvider router={router} />
            <Toaster richColors position="top-center" />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
    </MotionConfig>
  )
}
