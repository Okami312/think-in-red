import { ArrowLeftIcon, ArrowRightIcon, ImagePlusIcon, LinkIcon, Loader2Icon, StarIcon, XIcon } from "lucide-react"
import { useEffect, useRef, useState, type DragEvent } from "react"
import { toast } from "sonner"
import { ProductVisual } from "@/components/product-visual"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { errorMessage } from "@/lib/errors"
import { IMAGE_URL, MAX_PHOTOS, useUploadImage } from "@/lib/images"
import { cn } from "@/lib/utils"

type Pending = { key: number; preview: string; name: string }

/**
 * Upload, order and remove a product's photos (max MAX_PHOTOS).
 * The first photo is the cover; the rest form the gallery.
 * Files upload as soon as they're picked, one at a time so they keep their order.
 */
export function PhotoManager({
  value,
  onChange,
  category,
  onUploadingChange,
}: {
  value: string[]
  onChange: (photos: string[]) => void
  /** Only used for the placeholder styling of failed previews. */
  category: string
  onUploadingChange?: (uploading: boolean) => void
}) {
  const upload = useUploadImage()
  const [pending, setPending] = useState<Pending[]>([])
  const [url, setUrl] = useState("")
  const [urlError, setUrlError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // Uploads can finish before React re-renders with the previous one added,
  // so every change goes through `commit`, which keeps this ref current
  // immediately. The effect picks up changes from outside (e.g. a form reset).
  const latest = useRef(value)
  useEffect(() => {
    latest.current = value
  }, [value])
  function commit(next: string[]) {
    latest.current = next
    onChange(next)
  }
  const nextKey = useRef(0)

  const uploading = pending.length > 0
  useEffect(() => onUploadingChange?.(uploading), [uploading, onUploadingChange])

  const free = MAX_PHOTOS - value.length - pending.length

  async function addFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"))
    if (images.length < files.length) toast.error("Only image files can be added")
    const accepted = images.slice(0, Math.max(0, free))
    if (accepted.length < images.length) {
      toast.error(`A product can have at most ${MAX_PHOTOS} photos, so ${images.length - accepted.length} were skipped`)
    }
    if (accepted.length === 0) return

    const queued = accepted.map((file) => ({ key: nextKey.current++, preview: URL.createObjectURL(file), name: file.name, file }))
    setPending((p) => [...p, ...queued])
    for (const item of queued) {
      try {
        const { url } = await upload.mutateAsync(item.file)
        commit([...latest.current, url])
      } catch (error) {
        toast.error(`${item.name}: ${errorMessage(error, "upload failed")}`)
      } finally {
        URL.revokeObjectURL(item.preview)
        setPending((p) => p.filter((x) => x.key !== item.key))
      }
    }
  }

  function addUrl() {
    const v = url.trim()
    if (!IMAGE_URL.test(v)) {
      setUrlError("Use an http(s):// URL or a path like /products/x.jpg")
      return
    }
    if (latest.current.includes(v)) {
      setUrlError("That photo is already added")
      return
    }
    commit([...latest.current, v])
    setUrl("")
    setUrlError(null)
  }

  function move(from: number, to: number) {
    const next = [...latest.current]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    commit(next)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (free > 0) void addFiles(Array.from(e.dataTransfer.files))
  }

  return (
    <div className="space-y-3">
      <div
        className={cn("grid grid-cols-2 gap-2 rounded-lg sm:grid-cols-4", dragging && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {value.map((photo, i) => (
          <figure key={photo} className="group relative overflow-hidden rounded-lg border">
            <ProductVisual category={category} imageUrl={photo} alt={`Photo ${i + 1}`} className="aspect-4/3" imageClassName="p-1.5 drop-shadow-none" />
            {i === 0 && (
              <Badge className="absolute top-1.5 left-1.5 gap-1">
                <StarIcon className="size-3" aria-hidden />
                Cover
              </Badge>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-background/80 p-1 backdrop-blur-sm">
              <div className="flex">
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move photo ${i + 1} left`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                  <ArrowLeftIcon />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move photo ${i + 1} right`} disabled={i === value.length - 1} onClick={() => move(i, i + 1)}>
                  <ArrowRightIcon />
                </Button>
                {i > 0 && (
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Make photo ${i + 1} the cover`} onClick={() => move(i, 0)}>
                    <StarIcon />
                  </Button>
                )}
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove photo ${i + 1}`} onClick={() => commit(latest.current.filter((_, j) => j !== i))}>
                <XIcon />
              </Button>
            </div>
          </figure>
        ))}

        {pending.map((p) => (
          <figure key={p.key} className="relative overflow-hidden rounded-lg border" aria-busy="true">
            <img src={p.preview} alt="" className="aspect-4/3 w-full object-contain p-1.5 opacity-50" />
            <figcaption className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-medium">
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Uploading…
            </figcaption>
          </figure>
        ))}

        {free > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-4/3 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <ImagePlusIcon className="size-5" aria-hidden />
            Upload photos
            <span className="text-xs">or drop them here</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        hidden
        aria-label="Choose photos to upload"
        data-testid="photo-input"
        onChange={(e) => {
          void addFiles(Array.from(e.target.files!)) // always a FileList on a file input
          e.target.value = "" // allow picking the same file again
        }}
      />

      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-1">
          <Input
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setUrlError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addUrl()
              }
            }}
            disabled={free <= 0}
            placeholder="…or paste an image URL or /products/ path"
            aria-label="Image URL"
            aria-invalid={urlError !== null}
          />
          {urlError && <p className="text-sm text-destructive">{urlError}</p>}
        </div>
        <Button type="button" variant="outline" disabled={free <= 0 || !url.trim()} onClick={addUrl}>
          <LinkIcon data-icon="inline-start" />
          Add URL
        </Button>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {value.length} of {MAX_PHOTOS} photos
        {uploading && ` · uploading ${pending.length}…`}
        {value.length === 0 && !uploading && " · without photos, the category illustration is shown"}
      </p>
    </div>
  )
}
