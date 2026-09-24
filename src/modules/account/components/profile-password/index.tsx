"use client"

import React, { useActionState, useEffect, useRef, useState } from "react"

import {
  type PasswordChangeActionState,
  updateCustomerPassword,
} from "@lib/data/customer"
import { notify } from "@lib/notifications"
import {
  type AccountSecurity,
  type PasswordChangeFieldErrors,
  socialProviderNames,
  validatePasswordChange,
} from "@lib/util/account-password"
import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"

const initialState: PasswordChangeActionState = {
  success: false,
  error: null,
  fieldErrors: {},
}

export default function ProfilePassword({
  security,
}: {
  security: AccountSecurity | null
}) {
  if (!security) {
    return (
      <PasswordGuidance>
        Password settings are temporarily unavailable. Please try again later.
      </PasswordGuidance>
    )
  }

  if (!security.password_enabled) {
    const providers = socialProviderNames(security.linked_providers)
    const providerText = providers.length
      ? formatList(providers)
      : "your social sign-in provider"
    return (
      <PasswordGuidance>
        You sign in with {providerText}. Manage your password with that provider.
      </PasswordGuidance>
    )
  }

  return <PasswordChangeForm />
}

function PasswordChangeForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState(updateCustomerPassword, initialState)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<PasswordChangeFieldErrors>({})

  useEffect(() => {
    setSuccess(state.success)
    setFieldErrors(state.fieldErrors)
    if (state.success) {
      formRef.current?.reset()
      notify.success("Password updated successfully.", { id: "profile-password" })
    } else if (state.error) {
      notify.error("", state.error, { id: "profile-password" })
    }
  }, [state])

  function clearState() {
    setSuccess(false)
    setFieldErrors({})
  }

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget)
    const errors = validatePasswordChange({
      current_password: String(data.get("current_password") ?? ""),
      new_password: String(data.get("new_password") ?? ""),
      confirm_password: String(data.get("confirm_password") ?? ""),
    })
    setFieldErrors(errors)
    if (Object.keys(errors).length) {
      event.preventDefault()
    }
  }

  function clearField(name: keyof PasswordChangeFieldErrors) {
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={validate}
      onReset={clearState}
      className="w-full"
      noValidate
    >
      <AccountInfo
        label="Password"
        currentInfo={
          <span className="font-semibold tracking-[0.2em]">••••••••</span>
        }
        isSuccess={success}
        isError={Boolean(state.error) && !success}
        errorMessage={state.error ?? undefined}
        clearState={clearState}
        editLabel="Change"
        submitLabel="Update password"
        successMessage="Password updated successfully"
        data-testid="account-password-editor"
      >
        <div className="grid grid-cols-1 gap-4 small:grid-cols-2">
          <div className="small:col-span-2">
            <Input
              id="current_password"
              label="Current password"
              name="current_password"
              required
              type="password"
              autoComplete="current-password"
              errors={fieldErrors}
              onChange={() => clearField("current_password")}
              data-testid="current-password-input"
            />
          </div>
          <Input
            id="new_password"
            label="New password"
            name="new_password"
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            errors={fieldErrors}
            onChange={() => clearField("new_password")}
            data-testid="new-password-input"
          />
          <Input
            id="confirm_password"
            label="Confirm new password"
            name="confirm_password"
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            errors={fieldErrors}
            onChange={() => clearField("confirm_password")}
            data-testid="confirm-password-input"
          />
        </div>
        <div className="mt-3 text-sm text-ui-fg-subtle">
          <p>Use 8–128 characters with at least one letter and one number.</p>
        </div>
      </AccountInfo>
    </form>
  )
}

function PasswordGuidance({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="w-full text-small-regular"
      data-testid="account-password-guidance"
    >
      <span className="uppercase text-ui-fg-base">Password</span>
      <p className="mt-2 max-w-2xl leading-6 text-ui-fg-subtle">{children}</p>
    </section>
  )
}

function formatList(values: string[]) {
  if (values.length < 2) return values[0] ?? ""
  if (values.length === 2) return `${values[0]} or ${values[1]}`
  return `${values.slice(0, -1).join(", ")}, or ${values.at(-1)}`
}
