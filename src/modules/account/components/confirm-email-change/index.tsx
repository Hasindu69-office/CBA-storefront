"use client"

import { useActionState, useEffect } from "react"

import { confirmCustomerEmailChange, type EmailChangeConfirmState } from "@lib/data/customer"

const initialState: EmailChangeConfirmState = { error: null }

export default function ConfirmEmailChange({ token, countryCode }: { token: string; countryCode: string }) {
  const action = confirmCustomerEmailChange.bind(null, countryCode)
  const [state, formAction, pending] = useActionState(action, initialState)
  const tokenIsValid = /^[A-Za-z0-9_-]{20,2048}$/.test(token)

  useEffect(() => {
    const cleanUrl = `${window.location.pathname}${window.location.hash}`
    window.history.replaceState(window.history.state, "", cleanUrl)
  }, [])

  return (
    <section className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm" aria-labelledby="email-change-title">
      <h1 id="email-change-title" className="text-2xl font-semibold text-gray-900">Confirm your new email</h1>
      <p className="mt-3 text-sm leading-6 text-gray-600">
        Confirming will update your sign-in email and sign out every active session. You will then sign in again with the new address and your existing password.
      </p>
      {!tokenIsValid ? (
        <p className="mt-5 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">This email verification link is invalid. Request a new link from your profile.</p>
      ) : (
        <form action={formAction} className="mt-6">
          <input type="hidden" name="token" value={token} />
          {state.error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700" role="alert">{state.error}</p>}
          <button type="submit" disabled={pending} aria-busy={pending} className="min-h-11 rounded-md bg-[#ff5c0e] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? "Confirming…" : "Confirm email change"}
          </button>
        </form>
      )}
    </section>
  )
}
