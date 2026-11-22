import { ApiError } from "@/lib/api"
import { errorMessage } from "@/lib/errors"

describe("errorMessage", () => {
  it("uses the error's own message", () => {
    expect(errorMessage(new ApiError(400, "Name is required"), "fallback")).toBe("Name is required")
    expect(errorMessage(new TypeError("boom"), "fallback")).toBe("boom")
  })

  it.each([
    ["a thrown string", "oops"],
    ["undefined", undefined],
    ["an object", { message: "not an Error" }],
    ["an Error with no message", new Error("")],
  ])("falls back for %s", (_label, value) => {
    expect(errorMessage(value, "Something went wrong")).toBe("Something went wrong")
  })
})
