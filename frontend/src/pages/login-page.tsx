import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, LogInIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { Navigate, useLocation, useNavigate } from "react-router"
import { z } from "zod"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth"
import { errorMessage } from "@/lib/errors"

const schema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/admin"
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  })

  if (auth.isAuthenticated) return <Navigate to={from} replace />

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      await auth.login(values.email, values.password)
      navigate(from, { replace: true })
    } catch (error) {
      setServerError(errorMessage(error, "Login failed"))
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/40 px-4">
      <Logo />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin Sign In</CardTitle>
          <CardDescription>Manage the products in your store.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input id="email" type="email" autoComplete="username" spellCheck={false} placeholder="admin@example.com…" aria-invalid={fieldState.invalid} {...field} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input id="password" type="password" autoComplete="current-password" aria-invalid={fieldState.invalid} {...field} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              {serverError && <FieldError>{serverError}</FieldError>}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <Loader2Icon data-icon="inline-start" className="animate-spin" />
                ) : (
                  <LogInIcon data-icon="inline-start" />
                )}
                {form.formState.isSubmitting ? "Signing In…" : "Sign In"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
