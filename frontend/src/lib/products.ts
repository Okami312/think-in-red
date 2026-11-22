import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { Product, ProductInput } from "@/lib/types"

const keys = {
  all: ["products"] as const,
  one: (id: number) => ["products", id] as const,
}

export function useProducts() {
  return useQuery({ queryKey: keys.all, queryFn: () => api<Product[]>("/products") })
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: keys.one(id),
    queryFn: () => api<Product>(`/products/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) =>
      api<Product>("/products", { method: "POST", body: input, auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<ProductInput> }) =>
      api<Product>(`/products/${id}`, { method: "PUT", body: input, auth: true }),
    onSuccess: (product) => {
      qc.setQueryData(keys.one(product.id), product)
      return qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) =>
      api<void>(`/products/${id}`, { method: "DELETE", auth: true }),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: keys.one(id) })
      return qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}

/**
 * Deletes several products, one request each, and reports which failed.
 * Not all-or-nothing: products deleted before a failure stay deleted.
 */
export function useDeleteProducts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => api<void>(`/products/${id}`, { method: "DELETE", auth: true })),
      )
      const deleted = ids.filter((_, i) => results[i].status === "fulfilled")
      return { deleted, failed: ids.length - deleted.length }
    },
    onSuccess: ({ deleted }) => {
      deleted.forEach((id) => qc.removeQueries({ queryKey: keys.one(id) }))
      return qc.invalidateQueries({ queryKey: keys.all })
    },
  })
}
