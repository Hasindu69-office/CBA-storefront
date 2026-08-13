"use client"

import { useActionState, useEffect, useRef } from "react"

import {
  submitContactInquiry,
  type ContactInquiryFormState,
} from "@lib/data/inquiries"
import {
  CONTACT_INQUIRY_CATEGORIES,
  PREFERRED_CONTACT_METHODS,
} from "@modules/contact/lib/constants"

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

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset()
      successRef.current?.focus()
    }
  }, [state.status])

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
            error={state.fieldErrors?.name}
            autoComplete="name"
          />
          <Field
            id="contact-email"
            name="email"
            label="Email"
            type="email"
            required
            disabled={isPending}
            error={state.fieldErrors?.email}
            autoComplete="email"
          />
        </div>

        <div className="grid gap-4 small:grid-cols-2">
          <Field
            id="contact-phone"
            name="phone"
            label="Phone (optional)"
            type="tel"
            disabled={isPending}
            error={state.fieldErrors?.phone}
            autoComplete="tel"
            placeholder="077 123 4567"
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
          error={state.fieldErrors?.subject}
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
            aria-invalid={Boolean(state.fieldErrors?.message)}
            aria-describedby={
              state.fieldErrors?.message ? "contact-message-error" : undefined
            }
            className={`${inputClass(Boolean(state.fieldErrors?.message))} min-h-[140px] resize-y`}
          />
          {state.fieldErrors?.message && (
            <p id="contact-message-error" className="mt-1 text-[12px] text-[#b71c1c]">
              {state.fieldErrors.message}
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
