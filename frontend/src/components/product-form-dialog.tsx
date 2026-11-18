import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowDownIcon, ArrowUpIcon, Loader2Icon, PlusIcon, XIcon } from "lucide-react"
import { useEffect } from "react"
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { DatePicker } from "@/components/date-picker"
import { ProductVisual } from "@/components/product-visual"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { CATEGORIES, CATEGORY_SLUGS, isCategory } from "@/lib/categories"
import { useCreateProduct, useUpdateProduct } from "@/lib/products"
import type { Product, ProductInput } from "@/lib/types"

const CURRENCIES = ["EUR", "USD", "GBP", "RON", "CHF"]

// Full URL, or a path to a file in public/ (e.g. /products/x1-carbon-gen-8.jpg).
const IMAGE_URL = /^(https?:\/\/\S+|\/\S*)$/i

// Text inputs hold strings; they're converted to the API's types on submit.
// Rules mirror the backend DTOs.
const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255),
    category: z.enum(CATEGORY_SLUGS, { error: "Pick a category" }),
    description: z.string().trim().min(1, "Description is required"),
    price: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter a price like 19.99 (max 2 decimals)"),
    currency: z.string().min(1, "Pick a currency").max(10),
    available_quantity: z.string().trim().regex(/^\d+$/, "Enter a whole number, 0 or more"),
    sold_from: z.string(),
    sold_to: z.string(),
    image_url: z
      .string()
      .trim()
      .max(2048)
      .refine((v) => v === "" || IMAGE_URL.test(v), "Use an http(s):// URL or a path like /products/x.jpg"),
    featured: z.boolean(),
    gallery: z
      .array(
        z.object({
          url: z.string().trim().min(1, "Enter a URL or path").max(2048).refine((v) => IMAGE_URL.test(v), "Use an http(s):// URL or a path like /products/x.jpg"),
        }),
      )
      .max(12, "At most 12 gallery images"),
    specs: z
      .array(
        z.object({
          label: z.string().trim().min(1, "Label required").max(60),
          value: z.string().trim().min(1, "Value required").max(200),
        }),
      )
      .max(30, "At most 30 spec rows"),
  })
  .refine((v) => !v.sold_from || !v.sold_to || v.sold_to >= v.sold_from, {
    path: ["sold_to"],
    message: "End date can't be before the start date",
  })

type FormValues = z.input<typeof schema>

function toFormValues(product?: Product | null): FormValues {
  return {
    name: product?.name ?? "",
    category: product && isCategory(product.category) ? product.category : "laptops",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    currency: product?.currency ?? "EUR",
    available_quantity: product ? String(product.available_quantity) : "",
    sold_from: product?.sold_from ?? "",
    sold_to: product?.sold_to ?? "",
    image_url: product?.image_url ?? "",
    featured: product?.featured ?? false,
    gallery: (product?.gallery ?? []).map((url) => ({ url })),
    specs: product?.specs ?? [],
  }
}

function toInput(v: FormValues): ProductInput {
  return {
    name: v.name.trim(),
    category: v.category,
    description: v.description.trim(),
    price: Number(v.price),
    currency: v.currency,
    available_quantity: Number(v.available_quantity),
    sold_from: v.sold_from || null,
    sold_to: v.sold_to || null,
    image_url: v.image_url.trim() || null,
    featured: v.featured,
    gallery: v.gallery.map((g) => g.url.trim()),
    specs: v.specs.map((s) => ({ label: s.label.trim(), value: s.value.trim() })),
  }
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Product to edit; omit to create a new one. */
  product?: Product | null
}) {
  const isEdit = Boolean(product)
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const pending = create.isPending || update.isPending

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(product),
  })
  const specs = useFieldArray({ control: form.control, name: "specs" })
  const gallery = useFieldArray({ control: form.control, name: "gallery" })

  // Reset whenever the dialog opens for a (possibly different) product.
  useEffect(() => {
    if (open) form.reset(toFormValues(product))
  }, [open, product, form])

  const currencies =
    product && !CURRENCIES.includes(product.currency) ? [...CURRENCIES, product.currency] : CURRENCIES
  const previewCategory = useWatch({ control: form.control, name: "category" })
  const previewUrl = useWatch({ control: form.control, name: "image_url" })

  async function onSubmit(values: FormValues) {
    const input = toInput(values)
    try {
      if (product) {
        await update.mutateAsync({ id: product.id, input })
        toast.success(`Saved ${input.name}`)
      } else {
        await create.mutateAsync(input)
        toast.success(`Created ${input.name}`)
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "New Product"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Changes show up in the store right away." : "Add a product to the store."}
          </DialogDescription>
        </DialogHeader>

        <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="p-name">Name</FieldLabel>
                    <Input id="p-name" placeholder="ThinkPad X1 Carbon Gen 8…" aria-invalid={fieldState.invalid} {...field} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="category"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="p-category">Category</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="p-category" className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="p-description">Description</FieldLabel>
                  <Textarea id="p-description" rows={3} aria-invalid={fieldState.invalid} {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-[1fr_7rem_1fr]">
              <Controller
                name="price"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="p-price">Price</FieldLabel>
                    <Input id="p-price" inputMode="decimal" placeholder="0.00" aria-invalid={fieldState.invalid} {...field} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="currency"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="p-currency">Currency</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="p-currency" className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="available_quantity"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="p-qty">In stock</FieldLabel>
                    <Input id="p-qty" inputMode="numeric" placeholder="0" aria-invalid={fieldState.invalid} {...field} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="sold_from"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="p-from">On sale from</FieldLabel>
                    <DatePicker id="p-from" value={field.value} onChange={field.onChange} placeholder="Anytime" invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="sold_to"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="p-to">On sale until</FieldLabel>
                    <DatePicker id="p-to" value={field.value} onChange={field.onChange} placeholder="No end date" invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <Controller
                name="image_url"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="p-image">Image URL</FieldLabel>
                    <Input id="p-image" placeholder="/products/x1-carbon-gen-8.jpg…" aria-invalid={fieldState.invalid} {...field} />
                    {fieldState.invalid ? (
                      <FieldError errors={[fieldState.error]} />
                    ) : (
                      <FieldDescription>Optional. A file in <code className="font-mono">public/products/</code> or a full URL. Without one, the category illustration is shown.</FieldDescription>
                    )}
                  </Field>
                )}
              />
              <ProductVisual
                category={previewCategory}
                imageUrl={IMAGE_URL.test(previewUrl) ? previewUrl : null}
                className="aspect-4/3 self-start rounded-lg border sm:mt-6"
                artClassName="w-4/5"
              />
            </div>

            <Controller
              name="featured"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal" className="rounded-lg border p-3">
                  <div className="flex flex-1 flex-col gap-0.5">
                    <FieldLabel htmlFor="p-featured">Featured</FieldLabel>
                    <FieldDescription>Show on the home page.</FieldDescription>
                  </div>
                  <Switch id="p-featured" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />

            <FieldSet>
              <FieldLegend variant="label">Gallery</FieldLegend>
              <FieldDescription>Extra images shown as thumbnails on the product page.</FieldDescription>
              <div className="space-y-2">
                {gallery.fields.map((row, i) => (
                  <div key={row.id} className="flex items-start gap-2">
                    <Controller
                      name={`gallery.${i}.url`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="flex-1 gap-1">
                          <Input placeholder="/products/x1-carbon-gen-8-ports.webp…" aria-label={`Gallery image ${i + 1}`} aria-invalid={fieldState.invalid} {...field} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove gallery image ${i + 1}`} onClick={() => gallery.remove(i)}>
                      <XIcon />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                disabled={gallery.fields.length >= 12}
                onClick={() => gallery.append({ url: "" })}
              >
                <PlusIcon data-icon="inline-start" />
                Add Image
              </Button>
            </FieldSet>

            <FieldSet>
              <FieldLegend variant="label">Specifications</FieldLegend>
              {specs.fields.length === 0 && (
                <FieldDescription>No specs yet — add rows like “Processor” → “Core Ultra 7”.</FieldDescription>
              )}
              <div className="space-y-2">
                {specs.fields.map((row, i) => (
                  <div key={row.id} className="flex items-start gap-2">
                    <Controller
                      name={`specs.${i}.label`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="w-36 shrink-0 gap-1 sm:w-44">
                          <Input placeholder="e.g. Processor…" aria-label={`Spec ${i + 1} label`} aria-invalid={fieldState.invalid} {...field} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <Controller
                      name={`specs.${i}.value`}
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid} className="flex-1 gap-1">
                          <Input placeholder="e.g. Intel Core i7-10510U…" aria-label={`Spec ${i + 1} value`} aria-invalid={fieldState.invalid} {...field} />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    <div className="flex">
                      <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => specs.move(i, i - 1)}>
                        <ArrowUpIcon />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={i === specs.fields.length - 1} onClick={() => specs.move(i, i + 1)}>
                        <ArrowDownIcon />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove spec ${i + 1}`} onClick={() => specs.remove(i)}>
                        <XIcon />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                disabled={specs.fields.length >= 30}
                onClick={() => specs.append({ label: "", value: "" })}
              >
                <PlusIcon data-icon="inline-start" />
                Add Spec
              </Button>
            </FieldSet>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={pending}>
            {pending && <Loader2Icon data-icon="inline-start" className="animate-spin" />}
            {pending ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
