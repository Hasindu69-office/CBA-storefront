"use client"

import { requestPasswordReset, type AuthActionState } from "@lib/data/customer"
import { notify } from "@lib/notifications"
import { normalizeEmail, validateEmail } from "@lib/util/storefront-form-validation"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import RecaptchaDisclosure from "@modules/common/components/recaptcha-disclosure"
import type React from "react"
import { useActionState, useEffect, useState } from "react"
import { useRecaptchaSubmit } from "@lib/hooks/use-recaptcha-submit"

const INITIAL_STATE: AuthActionState = { status: "idle", message: null }

export default function ForgotPasswordForm({ countryCode, embedded = false, onBack }: { countryCode: string; embedded?: boolean; onBack?: () => void }) {
  void countryCode
  const [result, formAction, isPending] = useActionState(requestPasswordReset, INITIAL_STATE)
  const [clientError, setClientError] = useState<string | null>(null)
  const captcha = useRecaptchaSubmit("password_reset_request")

  useEffect(() => {
    if (result.status === "success" && result.message) {
      notify.success(result.message, { id: "forgot-password" })
    }
  }, [result])

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const email = normalizeEmail(new FormData(event.currentTarget).get("email"))
    const error = validateEmail(email)
    if (error) {
      event.preventDefault()
      setClientError(error)
      return
    }
    setClientError(null)
  }

  const content = (
      <section className="w-full">
        {!embedded && <h1 className="text-2xl font-bold text-gray-950">Forgot password</h1>}
        <p className={`${embedded ? "mt-0" : "mt-3"} text-sm leading-6 text-gray-600`}>
          Enter your account email and we will send a password reset link if the account exists.
        </p>
        <form className="mt-6" action={formAction} onSubmit={(event) => { validate(event); if (!event.defaultPrevented) void captcha.onRecaptchaSubmit(event) }} noValidate>
          <label className="text-sm font-semibold text-gray-900" htmlFor="email">Email address</label>
          <input id="email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(clientError)} aria-describedby={clientError ? "forgot-password-email-error" : undefined} onChange={(event) => setClientError(validateEmail(normalizeEmail(event.currentTarget.value)))} className={`mt-2 h-12 w-full rounded border px-3 text-sm outline-none focus:border-brand ${clientError ? "border-rose-300 bg-rose-50/40" : "border-gray-300"}`} />
          {(captcha.verificationError || clientError || result.message) && (
            <p id={clientError ? "forgot-password-email-error" : undefined} role={result.status === "error" ? "alert" : "status"} className={captcha.verificationError || clientError || result.status === "error" ? "mt-3 text-sm text-red-600" : "mt-3 text-sm text-green-700"}>{captcha.verificationError ?? clientError ?? result.message}</p>
          )}
          <button className="mt-5 h-12 w-full rounded bg-brand text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isPending || captcha.verifying} aria-busy={isPending || captcha.verifying}>
            {isPending ? "Sending reset link..." : "Send reset link"}
          </button>
          <RecaptchaDisclosure className="mt-3 text-center" />
        </form>
        {onBack ? <button type="button" onClick={onBack} className="mt-5 text-sm font-semibold text-brand">Back to sign in</button> : <LocalizedClientLink href="/account" className="mt-5 block text-sm font-semibold text-brand">Back to sign in</LocalizedClientLink>}
      </section>
  )
  return embedded ? content : <main className="flex min-h-[70vh] items-center justify-center bg-white px-6 py-16"><div className="w-full max-w-[440px] rounded border border-gray-200 p-8">{content}</div></main>
}
