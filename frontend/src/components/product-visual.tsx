import { useState } from "react"
import { ProductArt } from "@/components/product-art"
import { categoryStyle } from "@/lib/categories"
import { resolveImageUrl } from "@/lib/images"
import { cn } from "@/lib/utils"

/**
 * Product image if there is one (and it loads), otherwise the category
 * illustration on a subtle dot-grid backdrop.
 */
export function ProductVisual({
  category,
  imageUrl,
  alt = "",
  className,
  artClassName,
  animated,
  imageClassName,
}: {
  category: string
  imageUrl?: string | null
  alt?: string
  className?: string
  artClassName?: string
  animated?: boolean
  imageClassName?: string
}) {
  // Remember which URL failed, so a new URL gets a fresh attempt.
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const src = resolveImageUrl(imageUrl)
  const showImage = src && failedUrl !== src

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-muted/60 text-foreground/80",
        className,
      )}
      style={{
        ...categoryStyle(category),
        // category-coloured glow + subtle dot grid (also behind cut-out product photos)
        backgroundImage:
          "radial-gradient(ellipse at 50% 65%, color-mix(in oklch, var(--accent) 22%, transparent), transparent 70%), radial-gradient(circle, color-mix(in oklch, var(--foreground) 9%, transparent) 1px, transparent 1px)",
        backgroundSize: "100% 100%, 14px 14px",
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          width={800}
          height={600}
          loading="lazy"
          onError={() => setFailedUrl(src)}
          className={cn("size-full object-contain p-[7%] drop-shadow-2xl", imageClassName)}
        />
      ) : (
        <ProductArt category={category} animated={animated} className={cn("w-3/5", artClassName)} />
      )}
    </div>
  )
}
