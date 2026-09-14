"use client"

import React, { useEffect, useActionState } from "react";

import SriLankanPhoneInput from "@modules/common/components/sri-lankan-phone-input"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomer } from "@lib/data/customer"
import { notify } from "@lib/notifications"
import {
  validateSriLankanPhone,
} from "@lib/util/storefront-form-validation"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileEmail: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  const updateCustomerPhone = async (
    _currentState: Record<string, unknown>,
    formData: FormData
  ) => {
    const customer = {
      phone: formData.get("phone") as string,
    }

    try {
      await updateCustomer(customer)
      return { success: true, error: null }
    } catch (error: any) {
      return { success: false, error: error.toString() }
    }
  }

  const [state, formAction] = useActionState(updateCustomerPhone, {
    error: false,
    success: false,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
    if (state.success) {
      notify.success("Phone number updated.", { id: "profile-phone" })
    } else if (state.error) {
      notify.error(state.error, "Could not update phone number.", {
        id: "profile-phone",
      })
    }
  }, [state])

  function validate(event: React.FormEvent<HTMLFormElement>) {
    const phone = String(new FormData(event.currentTarget).get("phone") ?? "")
    const error = validateSriLankanPhone(phone)
    setFieldErrors(error ? { phone: error } : {})
    if (error) {
      event.preventDefault()
    }
  }

  return (
    <form action={formAction} onSubmit={validate} className="w-full" noValidate>
      <AccountInfo
        label="Phone"
        currentInfo={`${customer.phone}`}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error}
        clearState={clearState}
        data-testid="account-phone-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          <SriLankanPhoneInput
            label="Phone"
            name="phone"
            required
            error={fieldErrors.phone}
            defaultValue={customer.phone ?? ""}
            onValueChange={(internationalValue) => {
              const error = validateSriLankanPhone(internationalValue)
              setFieldErrors(error ? { phone: error } : {})
            }}
            data-testid="phone-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileEmail
