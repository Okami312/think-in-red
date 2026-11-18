export type Spec = { label: string; value: string }

export type Product = {
  id: number
  name: string
  /** One of CATEGORIES (see lib/categories.ts) */
  category: string
  description: string
  price: number
  currency: string
  available_quantity: number
  /** YYYY-MM-DD, first day the product can be sold */
  sold_from: string | null
  /** YYYY-MM-DD, last day the product can be sold */
  sold_to: string | null
  image_url: string | null
  /** Extra images for the product page gallery */
  gallery: string[]
  specs: Spec[]
  featured: boolean
}

export type ProductInput = Omit<Product, "id">

export type Admin = { id: number; email: string; name: string }

export type LoginResponse = { access_token: string; admin: Admin }
