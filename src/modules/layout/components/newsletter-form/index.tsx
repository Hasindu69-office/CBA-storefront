"use client"

import { subscribeToNewsletter } from "@lib/data/newsletter"
import { notify } from "@lib/notifications"
import { useActionState, useEffect, useRef } from "react"

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
      notify.success(state.message ?? "Newsletter subscription submitted.", {
        id: "newsletter-subscribe",
      })
      return
    }

    if (state.status === "error") {
      notify.error(state.error, "We could not submit your subscription.", {
        id: "newsletter-subscribe",
      })
      const emailInput = formRef.current?.elements.namedItem("email")
      if (emailInput instanceof HTMLElement && "focus" in emailInput) {
        emailInput.focus()
      }
    }
  }, [state.status, state.message, state.error])

  return (
    <div className="w-full max-w-[444px] mx-auto">
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col gap-4 medium:relative medium:flex-row medium:items-center medium:gap-0"
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
          aria-invalid={state.status === "error"}
          className="w-full rounded-[10px] border border-gray-200 px-7 py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 medium:px-6 medium:py-3 medium:pr-40 medium:text-[14px]"
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
    </div>
  )
}
