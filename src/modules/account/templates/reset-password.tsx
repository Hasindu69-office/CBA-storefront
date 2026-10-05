"use client"

import { resetPassword, type AuthActionState } from "@lib/data/customer"
import { notify } from "@lib/notifications"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type React from "react"
import { useActionState, useEffect, useState } from "react"

export default function ResetPasswordForm({
  countryCode,
  token,
  email,
  embedded = false,
  onComplete,
  onBack,
}: {
  countryCode: string
  token: string
  email: string
  embedded?: boolean
  onComplete?: (message: string) => void
  onBack?: () => void
}) {
  void countryCode
  const [result, formAction, isPending] = useActionState(resetPassword, { status: "idle", message: null } as AuthActionState)
  const [clientError, setClientError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string
    confirmPassword?: string
  }>({})

  useEffect(() => {
    if (!result.message) {
      return
    }
    if (result.status === "success") {
      notify.success(result.message, { id: "reset-password" })
      onComplete?.(result.message)
    } else {
      notify.error(result.message, "We could not update your password.", {
        id: "reset-password",
      })
    }
  }, [onComplete, result])

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirm_password") ?? "")
    const errors: typeof fieldErrors = {}

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      errors.password = "Password must be at least 8 characters and include letters and numbers."
    }
    if (password !== confirm) {
      errors.confirmPassword = "Passwords do not match."
    }

    if (Object.keys(errors).length > 0) {
      event.preventDefault()
      setFieldErrors(errors)
      const error = errors.password ?? errors.confirmPassword ?? "Please correct the highlighted fields."
      setClientError(error)
      notify.error(error, error, { id: "reset-password-validation" })
      return
    }
    setFieldErrors({})
    setClientError(null)
  }

  const content = (
      <section className="w-full">
        {!embedded && <h1 className="text-2xl font-bold text-gray-950">Reset password</h1>}
        <p className={`${embedded ? "mt-0" : "mt-3"} text-sm leading-6 text-gray-600`}>
          Choose a new password for your account.
        </p>
        <form className="mt-5" action={formAction} onSubmit={validate} noValidate>
          <input type="hidden" name="token" value={token} />
          <span className="text-sm font-semibold text-gray-900">Email address</span>
          <p className="mt-2 min-h-12 break-all rounded border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700" aria-label="Email address">
            {email || "Email associated with this reset link"}
          </p>
          <label className="mt-4 block text-sm font-semibold text-gray-900" htmlFor="password">New password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "reset-password-password-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, password: undefined }))} className={`mt-2 h-12 w-full rounded border px-3 text-sm outline-none focus:border-brand ${fieldErrors.password ? "border-rose-300 bg-rose-50/40" : "border-gray-300"}`} />
          {fieldErrors.password && <p id="reset-password-password-error" className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>}
          <label className="mt-4 block text-sm font-semibold text-gray-900" htmlFor="confirm_password">Confirm password</label>
          <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" required aria-invalid={Boolean(fieldErrors.confirmPassword)} aria-describedby={fieldErrors.confirmPassword ? "reset-password-confirm-error" : undefined} onChange={() => setFieldErrors((current) => ({ ...current, confirmPassword: undefined }))} className={`mt-2 h-12 w-full rounded border px-3 text-sm outline-none focus:border-brand ${fieldErrors.confirmPassword ? "border-rose-300 bg-rose-50/40" : "border-gray-300"}`} />
          {fieldErrors.confirmPassword && <p id="reset-password-confirm-error" className="mt-2 text-sm text-red-600">{fieldErrors.confirmPassword}</p>}
          {(clientError || result.message) && (
            <p role={result.status === "success" ? "status" : "alert"} className={result.status === "success" && !clientError ? "mt-3 text-sm text-green-700" : "mt-3 text-sm text-red-600"}>{clientError ?? result.message}</p>
          )}
          <button className="mt-5 h-12 w-full rounded bg-brand text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isPending} aria-disabled={isPending}>
            {isPending ? "Updating password..." : "Update password"}
          </button>
        </form>
        {onBack ? <button type="button" onClick={onBack} className="mt-5 text-sm font-semibold text-brand">Back to sign in</button> : <LocalizedClientLink href="/account" className="mt-5 block text-sm font-semibold text-brand">Back to sign in</LocalizedClientLink>}
      </section>
  )
  return embedded ? content : <main className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-16"><div className="w-full max-w-[440px] rounded border border-gray-200 p-8">{content}</div></main>
}
