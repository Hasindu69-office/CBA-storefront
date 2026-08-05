"use client"

import { useRef, useState, useTransition, type FormEvent } from "react"
import {
  guestTrackingLookup,
  guestTrackingVerify,
  guestTrackingLogout,
} from "@lib/data/order-tracking"
import type { CbaCustomerOrderTracking } from "types/order-tracking"
import {
  validateGuestLookupClient,
  validateOtpClient,
} from "../utils/format-tracking"
import AccountOrderTrackingTemplate from "./account-order-tracking-template"

type GuestOrderTrackingTemplateProps = {
  initialTracking?: CbaCustomerOrderTracking | null
}

export default function GuestOrderTrackingTemplate({
  initialTracking = null,
}: GuestOrderTrackingTemplateProps) {
  const [tracking, setTracking] = useState<CbaCustomerOrderTracking | null>(
    initialTracking
  )
  const [step, setStep] = useState<"lookup" | "verify">(
    initialTracking ? "lookup" : "lookup"
  )
  const [challengeId, setChallengeId] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  const [orderReference, setOrderReference] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const flowGenerationRef = useRef(0)

  function resetToLookup(options?: { clearForm?: boolean }) {
    flowGenerationRef.current += 1
    setStep("lookup")
    setChallengeId("")
    setCode("")
    setError(null)
    setMessage(null)
    setFieldErrors({})
    if (options?.clearForm) {
      setOrderReference("")
      setEmail("")
      setPhone("")
    }
  }

  function onLookup(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    const validated = validateGuestLookupClient({
      order_reference: orderReference,
      email,
      phone,
    })
    setFieldErrors(validated.errors)
    if (!validated.ok) return

    const flowGeneration = flowGenerationRef.current
    startTransition(async () => {
      const result = await guestTrackingLookup({
        order_reference: validated.values.order_reference,
        email: validated.values.email || undefined,
        phone: validated.values.phone || undefined,
      })
      if (flowGeneration !== flowGenerationRef.current) {
        return
      }
      if (!result.ok) {
        setError(result.error)
        return
      }
      setChallengeId(result.challenge_id)
      setMessage(result.message)
      setStep("verify")
    })
  }

  function onVerify(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const validated = validateOtpClient(code)
    if (!validated.ok) {
      setError(validated.error)
      return
    }
    const flowGeneration = flowGenerationRef.current
    const activeChallengeId = challengeId
    startTransition(async () => {
      const result = await guestTrackingVerify({
        challenge_id: activeChallengeId,
        code: validated.code,
      })
      if (flowGeneration !== flowGenerationRef.current) {
        return
      }
      if (!result.ok) {
        setError(result.error)
        return
      }
      setTracking(result.tracking)
    })
  }

  function onTrackAnotherOrder() {
    startTransition(async () => {
      await guestTrackingLogout()
      setTracking(null)
      resetToLookup({ clearForm: true })
    })
  }

  if (tracking) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={onTrackAnotherOrder}
            disabled={pending}
            className="text-[13px] font-semibold text-[#5d6470] hover:text-[#ff5c0e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
          >
            Track another order
          </button>
        </div>
        <AccountOrderTrackingTemplate
          tracking={tracking}
          showBackLink={false}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-[8px] border border-[#eeeeee] bg-white px-5 py-8 shadow-[0_2px_18px_rgba(20,26,34,0.06)] small:px-8">
        <h1 className="text-[28px] font-bold text-[#151922]">Track your order</h1>
        <p className="mt-2 text-[14px] leading-6 text-[#5d6470]">
          Enter your order or tracking number and the email or phone used at
          checkout. For your privacy, we never confirm whether an order exists
          until verification succeeds.
        </p>

        {step === "lookup" ? (
          <form className="mt-6 flex flex-col gap-4" onSubmit={onLookup}>
            <Field
              label="Order or tracking number"
              htmlFor="order_reference"
              error={fieldErrors.order_reference}
            >
              <input
                id="order_reference"
                name="order_reference"
                value={orderReference}
                onChange={(e) => setOrderReference(e.target.value)}
                maxLength={64}
                autoComplete="off"
                placeholder="CBA-1001 or CBA-003"
                className={inputClass}
              />
            </Field>
            <Field label="Email" htmlFor="email" error={fieldErrors.email}>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                autoComplete="email"
                className={inputClass}
              />
            </Field>
            <Field
              label="Phone (optional if email provided)"
              htmlFor="phone"
              error={fieldErrors.phone}
            >
              <input
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={20}
                autoComplete="tel"
                placeholder="0771234567"
                className={inputClass}
              />
            </Field>
            {error && <p className="text-[13px] text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="mt-2 inline-flex items-center justify-center rounded-md bg-[#ff5c0e] px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-[#e6520c] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
            >
              {pending ? "Checking…" : "Send verification code"}
            </button>
          </form>
        ) : (
          <form className="mt-6 flex flex-col gap-4" onSubmit={onVerify}>
            {message && (
              <div className="rounded-md bg-[#fff4ee] px-3 py-2 text-[13px] text-[#9a3d0a]">
                <p>{message}</p>
                <p className="mt-2 text-[#5d6470]">
                  Check your inbox and spam folder. The code is sent only to the
                  email used at checkout for that order. If nothing arrives,
                  go back and confirm the order number and contact details.
                </p>
              </div>
            )}
            <Field label="Verification code" htmlFor="code">
              <input
                id="code"
                name="code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
                className={inputClass}
              />
            </Field>
            {error && <p className="text-[13px] text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="mt-2 inline-flex items-center justify-center rounded-md bg-[#ff5c0e] px-4 py-3 text-[14px] font-semibold text-white transition hover:bg-[#e6520c] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
            >
              {pending ? "Verifying…" : "Verify and track"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => resetToLookup()}
              className="text-[13px] font-semibold text-[#5d6470] hover:text-[#ff5c0e]"
            >
              Start over
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

const inputClass =
  "w-full rounded-md border border-[#e5e7eb] px-3 py-2.5 text-[14px] text-[#151922] outline-none transition focus:border-[#ff5c0e] focus:ring-2 focus:ring-[#ff5c0e]/20"

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5" htmlFor={htmlFor}>
      <span className="text-[13px] font-semibold text-[#3b414c]">{label}</span>
      {children}
      {error && <span className="text-[12px] text-rose-600">{error}</span>}
    </label>
  )
}
