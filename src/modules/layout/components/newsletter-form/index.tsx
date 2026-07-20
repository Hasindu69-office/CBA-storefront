"use client"

import { subscribeToNewsletter } from "@lib/data/newsletter"
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

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
    }
  }, [state.status])

  return (
    <div className="w-full max-w-[444px] mx-auto">
      <form ref={formRef} action={formAction} className="relative flex items-center">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="Email address"
          disabled={isPending}
          className="w-full px-7 py-3.5 rounded-[10px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-36 sm:pr-44 disabled:opacity-50 text-gray-900"
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute right-0 top-0 bottom-0 min-w-32 sm:min-w-40 px-6 bg-[#ff5c0e] hover:bg-[#e6530c] text-white font-medium rounded-[10px] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isPending ? "Subscribing..." : "Subscribe"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="mt-2 text-sm text-red-500 font-medium" role="alert">
          {state.error}
        </p>
      )}

      {state.status === "success" && (
        <p className="mt-2 text-sm text-green-500 font-medium" role="alert">
          {state.message}
        </p>
      )}
    </div>
  )
}
