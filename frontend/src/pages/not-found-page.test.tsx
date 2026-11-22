import { screen } from "@testing-library/react"
import { NotFoundPage } from "@/pages/not-found-page"
import { renderWithProviders } from "@/test/utils"

it("NotFoundPage explains the problem and links back to the store", () => {
  renderWithProviders(<NotFoundPage />)
  expect(screen.getByRole("heading", { name: "Page Not Found" })).toBeInTheDocument()
  expect(screen.getByRole("link", { name: "Back to the Store" })).toHaveAttribute("href", "/")
})
