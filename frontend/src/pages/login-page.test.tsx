import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginPage } from "@/pages/login-page"
import { jsonResponse, mockFetch, renderRoutes } from "@/test/utils"

const routes = [
  { path: "/admin/login", element: <LoginPage /> },
  { path: "/admin", element: <p>Admin home</p> },
]
const renderLogin = () => renderRoutes(routes, { initialPath: "/admin/login" })

describe("LoginPage", () => {
  it("validates the form before calling the API", async () => {
    const fetchMock = mockFetch()
    renderLogin()
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }))
    expect(await screen.findByText("Enter a valid email")).toBeInTheDocument()
    expect(screen.getByText("Enter your password")).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("shows the server error for wrong credentials", async () => {
    mockFetch().mockReturnValue(jsonResponse({ message: "Invalid credentials" }, 401))
    renderLogin()
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com")
    await userEvent.type(screen.getByLabelText("Password"), "wrong")
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }))
    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument()
  })

  it("signs in and goes to the admin panel", async () => {
    const fetchMock = mockFetch().mockReturnValue(
      jsonResponse({ access_token: "a.eyJleHAiOjk5OTk5OTk5OTl9.b", admin: { id: 1, email: "admin@example.com", name: "Admin" } }),
    )
    renderLogin()
    await userEvent.type(screen.getByLabelText("Email"), "admin@example.com")
    await userEvent.type(screen.getByLabelText("Password"), "admin123")
    await userEvent.click(screen.getByRole("button", { name: "Sign In" }))
    expect(await screen.findByText("Admin home")).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({
      email: "admin@example.com",
      password: "admin123",
    })
  })
})
