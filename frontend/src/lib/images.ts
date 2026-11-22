import { useMutation } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { API_URL } from "@/lib/env"
import type { Product } from "@/lib/types"

/** A product shows at most this many photos: the cover + gallery. Mirrors the API. */
export const MAX_PHOTOS = 10

/** Full URL, or a path (a file in public/, or an uploaded /images/… photo). */
export const IMAGE_URL = /^(https?:\/\/\S+|\/\S*)$/i

/** Longest edge of an uploaded photo after resizing, in pixels. */
const MAX_EDGE = 1600
/** Images already this small and in a web format are uploaded untouched. */
const KEEP_BYTES = 400 * 1024
const WEB_FORMATS = ["image/webp", "image/jpeg", "image/png", "image/avif"]

/** Uploaded photos are served by the API at `/images/<id>`. */
const API_IMAGE_PATH = /^\/images\/[^/]+$/

/**
 * Turns a stored image reference into a URL the browser can load.
 * Uploaded photos live on the API (`/images/…`); other paths are files in the
 * frontend's public/ folder, and full URLs pass through unchanged.
 */
export function resolveImageUrl(url: string): string
export function resolveImageUrl(url: string | null | undefined): string | null
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return API_IMAGE_PATH.test(url) ? `${API_URL}${url}` : url
}

/** All of a product's photos in display order (cover first). */
export function productPhotos(product: Pick<Product, "image_url" | "gallery">): string[] {
  return [product.image_url, ...product.gallery].filter((x): x is string => !!x)
}

export function hasPhotos(product: Pick<Product, "image_url" | "gallery">): boolean {
  return productPhotos(product).length > 0
}

/**
 * Shrinks a photo before upload: at most MAX_EDGE px on the long side, saved
 * as WebP. Keeps uploads small (usually 100–300 KB), well under the API limit.
 * Small images that are already in a web format are sent as they are, and so
 * are files the browser can't decode (the API then reports what's wrong).
 */
export async function prepareImage(file: File): Promise<Blob> {
  if (file.size <= KEEP_BYTES && WEB_FORMATS.includes(file.type)) return file
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85))
    return blob && blob.size < file.size ? blob : file
  } finally {
    bitmap.close()
  }
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append("file", await prepareImage(file), file.name)
      return api<{ url: string }>("/images", { method: "POST", body: form, auth: true })
    },
  })
}
