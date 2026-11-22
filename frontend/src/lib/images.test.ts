import { hasPhotos, prepareImage, productPhotos, resolveImageUrl } from "@/lib/images"

describe("image helpers", () => {
  it("points uploaded /images/ paths at the API and leaves everything else alone", () => {
    expect(resolveImageUrl("/images/abc-123")).toBe("http://api.test/images/abc-123")
    expect(resolveImageUrl("/products/t470.webp")).toBe("/products/t470.webp")
    expect(resolveImageUrl("https://cdn.example/x.jpg")).toBe("https://cdn.example/x.jpg")
    expect(resolveImageUrl(null)).toBeNull()
    expect(resolveImageUrl("")).toBeNull()
  })

  it("lists photos cover-first and knows when there are none", () => {
    expect(productPhotos({ image_url: "/a.webp", gallery: ["/b.webp", "/c.webp"] })).toEqual(["/a.webp", "/b.webp", "/c.webp"])
    expect(productPhotos({ image_url: null, gallery: ["/b.webp"] })).toEqual(["/b.webp"])
    expect(hasPhotos({ image_url: null, gallery: [] })).toBe(false)
    expect(hasPhotos({ image_url: null, gallery: ["/b.webp"] })).toBe(true)
  })

  it("uploads small web-format images untouched", async () => {
    const file = new File(["x"], "small.webp", { type: "image/webp" })
    await expect(prepareImage(file)).resolves.toBe(file)
  })

  describe("prepareImage resizing", () => {
    const big = (type = "image/jpeg") => new File([new Uint8Array(2 * 1024 * 1024)], "camera.jpg", { type })
    let drawn: { width: number; height: number } | null
    let toBlobType: string | undefined
    let outputSize: number
    const close = jest.fn()

    beforeEach(() => {
      drawn = null
      outputSize = 200 * 1024
      close.mockClear()
      // jsdom can't decode images or draw on a canvas, so fake both.
      globalThis.createImageBitmap = jest.fn(() =>
        Promise.resolve({ width: 4000, height: 3000, close } as unknown as ImageBitmap),
      ) as unknown as typeof createImageBitmap
      jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
        return { drawImage: () => (drawn = { width: this.width, height: this.height }) } as unknown as CanvasRenderingContext2D
      } as never)
      jest.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((cb, type) => {
        toBlobType = type
        cb(new Blob([new Uint8Array(outputSize)], { type }))
      })
    })
    afterEach(() => jest.restoreAllMocks())

    it("scales large photos to 1600px on the long edge and converts them to WebP", async () => {
      const out = await prepareImage(big())
      expect(drawn).toEqual({ width: 1600, height: 1200 })
      expect(toBlobType).toBe("image/webp")
      expect(out.size).toBe(200 * 1024)
      expect(close).toHaveBeenCalled()
    })

    it("re-encodes small files that aren't in a web format (e.g. HEIC from a phone)", async () => {
      const heic = new File([new Uint8Array(300 * 1024)], "phone.heic", { type: "image/heic" })
      outputSize = 100 * 1024
      const out = await prepareImage(heic)
      expect(out.type).toBe("image/webp")
      expect(out.size).toBe(100 * 1024)
    })

    it("keeps the original when re-encoding would make it bigger", async () => {
      outputSize = 3 * 1024 * 1024
      const file = big()
      await expect(prepareImage(file)).resolves.toBe(file)
    })

    it("sends the original when the browser can't decode it, so the API can explain", async () => {
      globalThis.createImageBitmap = jest.fn(() => Promise.reject(new Error("decode failed"))) as unknown as typeof createImageBitmap
      const file = big()
      await expect(prepareImage(file)).resolves.toBe(file)
    })
  })
})
