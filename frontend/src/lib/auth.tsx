import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { api, getToken, setToken, setUnauthorizedHandler } from "@/lib/api"
import type { Admin, LoginResponse } from "@/lib/types"

const ADMIN_KEY = "ecommerce.admin"

type AuthState = {
  admin: Admin | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

/** Reads the `exp` claim so an expired token is dropped on load. */
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function loadAdmin(): Admin | null {
  const token = getToken()
  if (!token || isTokenExpired(token)) {
    setToken(null)
    return null
  }
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    return raw ? (JSON.parse(raw) as Admin) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(loadAdmin)

  const logout = useCallback(() => {
    setToken(null)
    try {
      localStorage.removeItem(ADMIN_KEY)
    } catch {
      // ignore
    }
    setAdmin(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    })
    setToken(res.access_token)
    try {
      localStorage.setItem(ADMIN_KEY, JSON.stringify(res.admin))
    } catch {
      // ignore
    }
    setAdmin(res.admin)
  }, [])

  const value = useMemo(
    () => ({ admin, isAuthenticated: admin !== null, login, logout }),
    [admin, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
