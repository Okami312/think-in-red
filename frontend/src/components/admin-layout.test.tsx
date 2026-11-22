import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useLocation } from "react-router"
import { AdminLayout } from "@/components/admin-layout"
import { renderRoutes, signInAsAdmin } from "@/test/utils"

function LoginProbe() {
  const location = useLocation()
  return <p>Login page (from {(location.state as { from?: string } | null)?.from})</p>
}

const routes = [
  { path: "/admin/login", element: <LoginProbe /> },
  { path: "/admin", element: <AdminLayout />, children: [{ index: true, element: <p>Admin content</p> }] },
  { path: "/", element: <p>Store home</p> },
]

describe("AdminLayout", () => {
  it("sends signed-out visitors to the login page, remembering where they were going", () => {
    renderRoutes(routes, { initialPath: "/admin" })
    expect(screen.getByText("Login page (from /admin)")).toBeInTheDocument()
    expect(screen.queryByText("Admin content")).not.toBeInTheDocument()
  })

  it("shows the admin page and account details to a signed-in admin", async () => {
    const user = userEvent.setup()
    signInAsAdmin()
    renderRoutes(routes, { initialPath: "/admin" })
    expect(screen.getByText("Admin content")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /View store/ })).toHaveAttribute("href", "/")

    await user.click(screen.getByRole("button", { name: "Account" }))
    expect(screen.getByText("Admin User")).toBeInTheDocument()
    expect(screen.getByText("admin@example.com")).toBeInTheDocument()
  })

  it("signs out from the account menu", async () => {
    const user = userEvent.setup()
    signInAsAdmin()
    renderRoutes(routes, { initialPath: "/admin" })
    await user.click(screen.getByRole("button", { name: "Account" }))
    await user.click(screen.getByRole("menuitem", { name: "Sign out" }))
    expect(await screen.findByText(/Login page/)).toBeInTheDocument()
    expect(localStorage.getItem("ecommerce.token")).toBeNull()
  })
})
