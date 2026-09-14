"use client"

import { subscribeToNewsletter } from "@lib/data/newsletter"
import { notify } from "@lib/notifications"
import { normalizeEmail, validateEmail } from "@lib/util/storefront-form-validation"
import { useActionState, useEffect, useRef, useState } from "react"

const initialState = {
  status: "idle" as const,
}

export default function NewsletterForm() {
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)
  const lastNotifiedKeyRef = useRef<string | null>(null)
  const [clientError, setClientError] = useState<string | null>(null)

  useEffect(() => {
    if (state.status === "idle") {
      return
    }

    const key = `${state.status}:${state.message ?? ""}:${state.error ?? ""}`
    if (lastNotifiedKeyRef.current === key) {
      return
    }
    lastNotifiedKeyRef.current = key

    if (state.status === "success") {
      formRef.current?.reset()
      setClientError(null)
      notify.success(state.message ?? "Newsletter subscription submitted.", {
        id: "newsletter-subscribe",
      })
      return
    }

    if (state.status === "error") {
      const emailInput = formRef.current?.elements.namedItem("email")
      if (emailInput instanceof HTMLElement && "focus" in emailInput) {
        emailInput.focus()
      }
    }
  }, [state.status, state.message, state.error])

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const email = normalizeEmail(new FormData(event.currentTarget).get("email"))
    const error = validateEmail(email)
    setClientError(error)
    if (error) {
      event.preventDefault()
    }
  }

  return (
    <div className="w-full max-w-[444px] mx-auto">
      <form
        ref={formRef}
        action={formAction}
        onSubmit={validate}
        className="flex flex-col gap-4 medium:relative medium:flex-row medium:items-center medium:gap-0"
        noValidate
      >
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          maxLength={254}
          required
          placeholder="Email address"
          disabled={isPending}
          aria-invalid={Boolean(clientError || state.status === "error")}
          aria-describedby={
            clientError || state.status === "error"
              ? "newsletter-email-error"
              : undefined
          }
          onChange={(event) =>
            setClientError(validateEmail(normalizeEmail(event.currentTarget.value)))
          }
          className={`w-full rounded-[10px] border px-7 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 medium:px-6 medium:py-3 medium:pr-40 medium:text-[14px] ${
            clientError || state.status === "error"
              ? "border-rose-300 bg-rose-50/40"
              : "border-gray-200"
          }`}
        />
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="w-full rounded-[10px] bg-[#ff5c0e] px-6 py-3.5 font-medium text-white transition-colors hover:bg-[#e6530c] disabled:cursor-not-allowed disabled:opacity-70 medium:absolute medium:right-0 medium:top-0 medium:bottom-0 medium:w-auto medium:min-w-36 medium:px-5 medium:py-0 medium:text-[14px]"
        >
          {isPending ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
      {(clientError || state.status === "error") && (
        <p id="newsletter-email-error" className="mt-2 text-[12px] font-medium text-rose-600">
          {clientError ?? state.error}
        </p>
      )}
    </div>
  )
}
