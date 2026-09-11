"use client"

import { useActionState, useEffect, useRef, useState } from "react"

import {
  submitContactInquiry,
  type ContactInquiryFormState,
} from "@lib/data/inquiries"
import {
  CONTACT_INQUIRY_CATEGORIES,
  PREFERRED_CONTACT_METHODS,
} from "@modules/contact/lib/constants"
import {
  normalizeEmail,
  sanitizePersonNameInput,
  validateEmail,
  validatePersonName,
  validateSafeMessageText,
  validateSriLankanPhone,
} from "@lib/util/storefront-form-validation"
import SriLankanPhoneInput from "@modules/common/components/sri-lankan-phone-input"

type Props = {
  title: string
  helper: string
  successText: string
}

const initialState: ContactInquiryFormState = { status: "idle" }

const CATEGORY_LABELS: Record<(typeof CONTACT_INQUIRY_CATEGORIES)[number], string> = {
  general: "General inquiry",
  sales: "Sales",
  service: "Service",
  warranty: "Warranty",
  delivery: "Delivery",
  billing: "Billing",
  corporate: "Corporate",
  other: "Other",
}

const METHOD_LABELS: Record<(typeof PREFERRED_CONTACT_METHODS)[number], string> = {
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  none: "No preference",
}

export default function ContactForm({ title, helper, successText }: Props) {
  const [state, formAction, isPending] = useActionState(
    submitContactInquiry,
    initialState
  )
  const formRef = useRef<HTMLFormElement>(null)
  const successRef = useRef<HTMLDivElement>(null)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
      setClientErrors({})
      successRef.current?.focus()
    }
  }, [state.status])

  function setFieldError(name: string, error: string | null) {
    setClientErrors((current) => {
      const next = { ...current }
      if (error) next[name] = error
      else delete next[name]
      return next
    })
  }

  function validateClient(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget)
    const next: Record<string, string> = {}
    const nameError = validatePersonName(String(form.get("name") ?? ""), "Name", { max: 80 })
    const emailError = validateEmail(normalizeEmail(form.get("email")))
    const phoneError = validateSriLankanPhone(String(form.get("phone") ?? "").trim(), { required: false })
    const subjectError = validateSafeMessageText(String(form.get("subject") ?? ""), "Subject", { min: 5, max: 120 })
    const messageError = validateSafeMessageText(String(form.get("message") ?? ""), "Message", { min: 10, max: 2000 })
    if (nameError) next.name = nameError
    if (emailError) next.email = emailError
    if (phoneError) next.phone = phoneError
    if (subjectError) next.subject = subjectError
    if (messageError) next.message = messageError
    setClientErrors(next)
    if (Object.keys(next).length) {
      event.preventDefault()
    }
  }

  return (
    <section
      className="rounded-[8px] border border-[#eeeeee] bg-white p-6 shadow-[0_2px_12px_rgba(20,26,34,0.04)] small:p-8"
      aria-labelledby="contact-form-heading"
    >
      <h2
        id="contact-form-heading"
        className="text-[22px] font-bold text-[#151922]"
      >
        {title}
      </h2>
      <p className="mt-2 text-[14px] leading-6 text-[#5d6470]">{helper}</p>

      {state.status === "success" && (
        <div
          ref={successRef}
          tabIndex={-1}
          role="status"
          className="mt-5 rounded-md border border-[#c8e6c9] bg-[#f1f8f2] px-4 py-3 text-[14px] text-[#1b5e20]"
        >
          {state.message ?? successText}
        </div>
      )}

      {state.status === "error" && state.error && (
        <div
          role="alert"
          className="mt-5 rounded-md border border-[#ffcdd2] bg-[#fff5f5] px-4 py-3 text-[14px] text-[#b71c1c]"
        >
          {state.error}
        </div>
      )}

      <form
        ref={formRef}
        action={formAction}
        onSubmit={validateClient}
        className="mt-6 grid gap-4"
        noValidate
      >
        <div className="absolute left-[-9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="company_website">Company website</label>
          <input
            id="company_website"
            name="company_website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="grid gap-4 small:grid-cols-2">
          <Field
            id="contact-name"
            name="name"
            label="Full name"
            required
            disabled={isPending}
            error={clientErrors.name ?? state.fieldErrors?.name}
            autoComplete="name"
            onChange={(event) => {
              const sanitized = sanitizePersonNameInput(event.currentTarget.value)
              if (sanitized !== event.currentTarget.value) event.currentTarget.value = sanitized
              setFieldError("name", validatePersonName(sanitized, "Name", { max: 80 }))
            }}
          />
          <Field
            id="contact-email"
            name="email"
            label="Email"
            type="email"
            required
            disabled={isPending}
            error={clientErrors.email ?? state.fieldErrors?.email}
            autoComplete="email"
            onChange={(event) =>
              setFieldError("email", validateEmail(normalizeEmail(event.currentTarget.value)))
            }
          />
        </div>

        <div className="grid gap-4 small:grid-cols-2">
          <SriLankanPhoneInput
            key={state.status}
            id="contact-phone"
            name="phone"
            label="Phone (optional)"
            disabled={isPending}
            error={clientErrors.phone ?? state.fieldErrors?.phone}
            onValueChange={(internationalValue) =>
              setFieldError("phone", validateSriLankanPhone(internationalValue, { required: false }))
            }
          />
          <div>
            <label
              htmlFor="contact-category"
              className="mb-1.5 block text-[13px] font-semibold text-[#151922]"
            >
              Category
            </label>
            <select
              id="contact-category"
              name="category"
              required
              disabled={isPending}
              defaultValue="general"
              aria-invalid={Boolean(state.fieldErrors?.category)}
              aria-describedby={
                state.fieldErrors?.category ? "contact-category-error" : undefined
              }
              className={selectClass(Boolean(state.fieldErrors?.category))}
            >
              {CONTACT_INQUIRY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            {state.fieldErrors?.category && (
              <p id="contact-category-error" className="mt-1 text-[12px] text-[#b71c1c]">
                {state.fieldErrors.category}
              </p>
            )}
          </div>
        </div>

        <Field
          id="contact-subject"
          name="subject"
          label="Subject"
          required
          disabled={isPending}
          error={clientErrors.subject ?? state.fieldErrors?.subject}
          onChange={(event) =>
            setFieldError("subject", validateSafeMessageText(event.currentTarget.value, "Subject", { min: 5, max: 120 }))
          }
        />

        <div>
          <label
            htmlFor="contact-message"
            className="mb-1.5 block text-[13px] font-semibold text-[#151922]"
          >
            Message
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            disabled={isPending}
            aria-invalid={Boolean(clientErrors.message ?? state.fieldErrors?.message)}
            aria-describedby={
              clientErrors.message || state.fieldErrors?.message ? "contact-message-error" : undefined
            }
            onChange={(event) =>
              setFieldError("message", validateSafeMessageText(event.currentTarget.value, "Message", { min: 10, max: 2000 }))
            }
            className={`${inputClass(Boolean(clientErrors.message ?? state.fieldErrors?.message))} min-h-[140px] resize-y`}
          />
          {(clientErrors.message ?? state.fieldErrors?.message) && (
            <p id="contact-message-error" className="mt-1 text-[12px] text-[#b71c1c]">
              {clientErrors.message ?? state.fieldErrors?.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="contact-preferred"
            className="mb-1.5 block text-[13px] font-semibold text-[#151922]"
          >
            Preferred contact method
          </label>
          <select
            id="contact-preferred"
            name="preferred_contact_method"
            disabled={isPending}
            defaultValue="email"
            aria-invalid={Boolean(state.fieldErrors?.preferred_contact_method)}
            className={selectClass(
              Boolean(state.fieldErrors?.preferred_contact_method)
            )}
          >
            {PREFERRED_CONTACT_METHODS.map((method) => (
              <option key={method} value={method}>
                {METHOD_LABELS[method]}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-start gap-3 text-[13px] leading-5 text-[#5d6470]">
          <input
            type="checkbox"
            name="marketing_opt_in"
            disabled={isPending}
            className="mt-1 h-4 w-4 rounded border-[#d7dbe3] text-[#ff5c0e] focus:ring-[#ff5c0e]"
          />
          <span>
            I would like to receive product updates and offers by email (optional).
          </span>
        </label>

        <p className="text-[12px] leading-5 text-[#8a919c]">
          By submitting this form you consent to CBA contacting you about this inquiry.
        </p>

        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="inline-flex h-11 items-center justify-center rounded-md bg-[#ff5c0e] px-6 text-[14px] font-semibold text-white transition hover:bg-[#e6520c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Sending..." : "Send message"}
        </button>
      </form>
    </section>
  )
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  disabled,
  error,
  autoComplete,
  placeholder,
  onChange,
  inputMode,
  maxLength,
}: {
  id: string
  name: string
  label: string
  type?: string
  required?: boolean
  disabled?: boolean
  error?: string
  autoComplete?: string
  placeholder?: string
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  maxLength?: number
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[13px] font-semibold text-[#151922]"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass(Boolean(error))}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-[12px] text-[#b71c1c]">
          {error}
        </p>
      )}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return [
    "w-full rounded-md border bg-white px-3.5 py-2.5 text-[14px] text-[#151922] outline-none transition",
    "placeholder:text-[#9aa1ab] focus:ring-2 focus:ring-[#ff5c0e]/40 disabled:opacity-60",
    hasError ? "border-[#ef9a9a]" : "border-[#eeeeee]",
  ].join(" ")
}

function selectClass(hasError: boolean) {
  return `${inputClass(hasError)} appearance-none`
}
