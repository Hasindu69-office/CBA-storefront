"use client"

import { resetPassword } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type React from "react"
import { useActionState, useState } from "react"

export default function ResetPasswordForm({
  countryCode,
  token,
  email,
}: {
  countryCode: string
  token: string
  email: string
}) {
  void countryCode
  const [message, formAction] = useActionState(resetPassword, null)
  const [clientError, setClientError] = useState<string | null>(null)

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirm_password") ?? "")
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      event.preventDefault()
      setClientError("Password must be at least 8 characters and include letters and numbers.")
      return
    }
    if (password !== confirm) {
      event.preventDefault()
      setClientError("Passwords do not match.")
      return
    }
    setClientError(null)
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-16">
      <section className="w-full max-w-[440px] rounded border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-950">Reset password</h1>
        <form className="mt-6" action={formAction} onSubmit={validate} noValidate>
          <input type="hidden" name="token" value={token} />
          <label className="text-sm font-semibold text-gray-900" htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" defaultValue={email} autoComplete="email" className="mt-2 h-12 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-brand" />
          <label className="mt-4 block text-sm font-semibold text-gray-900" htmlFor="password">New password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" className="mt-2 h-12 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-brand" />
          <label className="mt-4 block text-sm font-semibold text-gray-900" htmlFor="confirm_password">Confirm password</label>
          <input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" className="mt-2 h-12 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-brand" />
          {(clientError || message) && (
            <p className={String(clientError ?? message).startsWith("Password updated") ? "mt-3 text-sm text-green-700" : "mt-3 text-sm text-red-600"}>{clientError ?? message}</p>
          )}
          <button className="mt-5 h-12 w-full rounded bg-brand text-sm font-bold text-white" type="submit">Update password</button>
        </form>
        <LocalizedClientLink href="/account" className="mt-5 block text-sm font-semibold text-brand">
          Back to sign in
        </LocalizedClientLink>
      </section>
    </main>
  )
}
