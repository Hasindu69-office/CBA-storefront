"use client"

import React, { useActionState, useEffect, useRef, useState } from "react"
import type { HttpTypes } from "@medusajs/types"

import { type EmailChangeActionState, requestCustomerEmailChange } from "@lib/data/customer"
import { notify } from "@lib/notifications"
import { type AccountSecurity, socialProviderNames } from "@lib/util/account-password"
import { type EmailChangeFieldErrors, validateEmailChange } from "@lib/util/account-email"
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"

const initialState: EmailChangeActionState = {
  success: false,
  error: null,
  fieldErrors: {},
  maskedEmail: null,
  expiresAt: null,
}

export default function ProfileEmail({ customer, security, countryCode }: {
  customer: HttpTypes.StoreCustomer
  security: AccountSecurity | null
  countryCode: string
}) {
  if (!security) {
    return <EmailGuidance email={customer.email}>Email settings are temporarily unavailable. Please try again later.</EmailGuidance>
  }
  if (!security.password_enabled) {
    const providers = socialProviderNames(security.linked_providers)
    return (
      <EmailGuidance email={customer.email}>
        You sign in with {providers.length ? formatList(providers) : "your social provider"}. Manage your email with that provider.
      </EmailGuidance>
    )
  }
  return <EmailChangeForm currentEmail={customer.email} countryCode={countryCode} />
}

function EmailChangeForm({ currentEmail, countryCode }: { currentEmail: string; countryCode: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const action = requestCustomerEmailChange.bind(null, currentEmail)
  const [state, formAction] = useActionState(action, initialState)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<EmailChangeFieldErrors>({})

  useEffect(() => {
    setSuccess(state.success)
    setFieldErrors(state.fieldErrors)
    if (state.success) {
      formRef.current?.reset()
      notify.success(`Verification link sent to ${state.maskedEmail ?? "your new email"}.`, { id: "profile-email" })
    } else if (state.error) {
      notify.error("", state.error, { id: "profile-email" })
    }
  }, [state])

  function clearState() {
    setSuccess(false)
    setFieldErrors({})
  }

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget)
    const errors = validateEmailChange({
      current_email: currentEmail,
      new_email: String(data.get("new_email") ?? ""),
      confirm_email: String(data.get("confirm_email") ?? ""),
      current_password: String(data.get("current_password") ?? ""),
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length) event.preventDefault()
  }

  function clearField(name: keyof EmailChangeFieldErrors) {
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={validate} onReset={clearState} className="w-full" noValidate>
      <input type="hidden" name="country_code" value={countryCode} />
      <AccountInfo
        label="Email"
        currentInfo={currentEmail}
        isSuccess={success}
        isError={Boolean(state.error) && !success}
        errorMessage={state.error ?? undefined}
        clearState={clearState}
        submitLabel="Send verification link"
        successMessage={`Verification link sent${state.maskedEmail ? ` to ${state.maskedEmail}` : ""}`}
        data-testid="account-email-editor"
      >
        <div className="grid grid-cols-1 gap-4 small:grid-cols-2">
          <Input id="new_email" label="New email" name="new_email" type="email" autoComplete="email" required maxLength={254} errors={fieldErrors} onChange={() => clearField("new_email")} data-testid="new-email-input" />
          <Input id="confirm_email" label="Confirm new email" name="confirm_email" type="email" autoComplete="email" required maxLength={254} errors={fieldErrors} onChange={() => clearField("confirm_email")} data-testid="confirm-email-input" />
          <div className="small:col-span-2">
            <Input id="current_password" label="Current password" name="current_password" type="password" autoComplete="current-password" required maxLength={1024} errors={fieldErrors} onChange={() => clearField("current_password")} data-testid="email-current-password-input" />
          </div>
        </div>
        <p className="mt-3 text-sm text-ui-fg-subtle">We will send a secure link to the new address. It expires in 15 minutes.</p>
      </AccountInfo>
    </form>
  )
}

function EmailGuidance({ email, children }: { email: string; children: React.ReactNode }) {
  return (
    <div className="text-small-regular" data-testid="account-email-editor">
      <span className="uppercase text-ui-fg-base">Email</span>
      <p className="font-semibold">{email}</p>
      <p className="mt-3 text-sm text-ui-fg-subtle">{children}</p>
    </div>
  )
}

function formatList(values: string[]) {
  if (values.length < 2) return values[0] ?? ""
  if (values.length === 2) return `${values[0]} and ${values[1]}`
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`
}
