"use client"

import React, { useEffect, useActionState } from "react";

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomer } from "@lib/data/customer"
import { notify } from "@lib/notifications"
import {
  sanitizePersonNameInput,
  validatePersonName,
} from "@lib/util/storefront-form-validation"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileName: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  const updateCustomerName = async (
    _currentState: Record<string, unknown>,
    formData: FormData
  ) => {
    const customer = {
      first_name: formData.get("first_name") as string,
      last_name: formData.get("last_name") as string,
    }

    try {
      await updateCustomer(customer)
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.toString() }
    }
  }

  const [state, formAction] = useActionState(updateCustomerName, {
    error: false,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
    if (state.success) {
      notify.success("Profile name updated.", { id: "profile-name" })
    } else if (state.error) {
      notify.error(state.error, "Could not update profile name.", {
        id: "profile-name",
      })
    }
  }, [state])

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(event.currentTarget)
    const next: Record<string, string> = {}
    const firstNameError = validatePersonName(String(form.get("first_name") ?? ""), "First name")
    const lastNameError = validatePersonName(String(form.get("last_name") ?? ""), "Last name")
    if (firstNameError) next.first_name = firstNameError
    if (lastNameError) next.last_name = lastNameError
    setFieldErrors(next)
    if (Object.keys(next).length) {
      event.preventDefault()
    }
  }

  function validateField(name: "first_name" | "last_name", value: string) {
    const sanitized = sanitizePersonNameInput(value)
    const error = validatePersonName(
      sanitized,
      name === "first_name" ? "First name" : "Last name"
    )
    setFieldErrors((current) => {
      const next = { ...current }
      if (error) next[name] = error
      else delete next[name]
      return next
    })
    return sanitized
  }

  return (
    <form action={formAction} onSubmit={validate} className="w-full overflow-visible" noValidate>
      <AccountInfo
        label="Name"
        currentInfo={`${customer.first_name} ${customer.last_name}`}
        isSuccess={successState}
        isError={!!state?.error}
        clearState={clearState}
        data-testid="account-name-editor"
      >
        <div className="grid grid-cols-2 gap-x-4">
          <Input
            label="First name"
            name="first_name"
            required
            errors={fieldErrors}
            defaultValue={customer.first_name ?? ""}
            onChange={(event) => {
              const sanitized = validateField("first_name", event.currentTarget.value)
              if (sanitized !== event.currentTarget.value) {
                event.currentTarget.value = sanitized
              }
            }}
            data-testid="first-name-input"
          />
          <Input
            label="Last name"
            name="last_name"
            required
            errors={fieldErrors}
            defaultValue={customer.last_name ?? ""}
            onChange={(event) => {
              const sanitized = validateField("last_name", event.currentTarget.value)
              if (sanitized !== event.currentTarget.value) {
                event.currentTarget.value = sanitized
              }
            }}
            data-testid="last-name-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileName
