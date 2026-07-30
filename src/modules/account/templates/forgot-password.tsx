"use client"

import { requestPasswordReset } from "@lib/data/customer"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type React from "react"
import { useActionState, useState } from "react"

export default function ForgotPasswordForm({ countryCode }: { countryCode: string }) {
  void countryCode
  const [message, formAction] = useActionState(requestPasswordReset, null)
  const [clientError, setClientError] = useState<string | null>(null)

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      event.preventDefault()
      setClientError("Enter a valid email address.")
      return
    }
    setClientError(null)
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-16">
      <section className="w-full max-w-[440px] rounded border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-950">Forgot password</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Enter your account email and we will send a password reset link if the account exists.
        </p>
        <form className="mt-6" action={formAction} onSubmit={validate} noValidate>
          <label className="text-sm font-semibold text-gray-900" htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" className="mt-2 h-12 w-full rounded border border-gray-300 px-3 text-sm outline-none focus:border-brand" />
          {(clientError || message) && (
            <p className={clientError ? "mt-3 text-sm text-red-600" : "mt-3 text-sm text-green-700"}>{clientError ?? message}</p>
          )}
          <button className="mt-5 h-12 w-full rounded bg-brand text-sm font-bold text-white" type="submit">Send reset link</button>
        </form>
        <LocalizedClientLink href="/account" className="mt-5 block text-sm font-semibold text-brand">
          Back to sign in
        </LocalizedClientLink>
      </section>
    </main>
  )
}
