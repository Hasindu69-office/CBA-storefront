"use client"

import React, { useEffect, useMemo, useActionState } from "react"

import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"

import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { addCustomerAddress, updateCustomerAddress } from "@lib/data/customer"
import { notify } from "@lib/notifications"
import { useRouter } from "next/navigation"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
  regions: HttpTypes.StoreRegion[]
}

const ProfileBillingAddress: React.FC<MyInformationProps> = ({
  customer,
  regions,
}) => {
  const regionOptions = useMemo(() => {
    return (
      regions
        ?.map((region) => {
          return region.countries?.map((country) => ({
            value: country.iso_2,
            label: country.display_name,
          }))
        })
        .flat() || []
    )
  }, [regions])

  const [successState, setSuccessState] = React.useState(false)
  const router = useRouter()

  // Addresses saved before default-billing support may not carry the role.
  // Show the first saved address rather than hiding it; saving promotes it to
  // the customer's default billing address through the CBA API.
  const billingAddress =
    customer.addresses?.find((addr) => addr.is_default_billing) ??
    customer.addresses?.[0]

  const initialState: Record<string, any> = {
    isDefaultBilling: true,
    isDefaultShipping: false,
    error: false,
    success: false,
  }

  if (billingAddress) {
    initialState.addressId = billingAddress.id
  }

  const [state, formAction] = useActionState(
    billingAddress ? updateCustomerAddress : addCustomerAddress,
    initialState
  )

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
    if (state.success) {
      notify.success("Billing address saved.", { id: "profile-billing-address" })
      router.refresh()
    } else if (state.error) {
      notify.error(state.error, "Could not save billing address.", {
        id: "profile-billing-address",
      })
    }
  }, [state, router])

  const profileIdentityMissing = !(
    billingAddress?.first_name ?? customer.first_name
  ) || !(
    billingAddress?.last_name ?? customer.last_name
  ) || !(
    billingAddress?.phone ?? customer.phone
  )

  const currentInfo = useMemo(() => {
    if (!billingAddress) {
      return "No billing address"
    }

    const country =
      regionOptions?.find(
        (country) => country?.value === billingAddress.country_code
      )?.label || billingAddress.country_code?.toUpperCase()

    return (
      <div className="flex flex-col font-semibold" data-testid="current-info">
        <span>
          {billingAddress.address_1}
          {billingAddress.address_2 ? `, ${billingAddress.address_2}` : ""}
        </span>
        <span>
          {billingAddress.postal_code}, {billingAddress.city}
        </span>
        <span>{country}</span>
      </div>
    )
  }, [billingAddress, regionOptions])

  return (
    <form action={formAction} onReset={() => clearState()} className="w-full">
      <input type="hidden" name="addressId" value={billingAddress?.id} />
      <AccountInfo
        label="Billing address"
        currentInfo={currentInfo}
        isSuccess={successState}
        isError={!!state.error}
        clearState={clearState}
        data-testid="account-billing-address-editor"
      >
        <div className="grid grid-cols-1 gap-y-2">
          {/* Identity and contact details are managed in their dedicated Profile
              sections. Preserve them on the address record without duplicating
              editable fields in the billing-address editor. */}
          <input
            type="hidden"
            name="first_name"
            value={billingAddress?.first_name ?? customer.first_name ?? ""}
          />
          <input
            type="hidden"
            name="last_name"
            value={billingAddress?.last_name ?? customer.last_name ?? ""}
          />
          <input type="hidden" name="company" value={billingAddress?.company ?? ""} />
          <input
            type="hidden"
            name="phone"
            value={billingAddress?.phone ?? customer.phone ?? ""}
          />
          {profileIdentityMissing && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-small-regular text-amber-800" role="alert">
              Add your name and phone number in Account Details before saving an address.
            </p>
          )}
          <Input
            label="Address"
            name="address_1"
            defaultValue={billingAddress?.address_1 || undefined}
            required
            errors={state.fieldErrors}
            data-testid="billing-address-1-input"
          />
          <Input
            label="Apartment, suite, etc."
            name="address_2"
            defaultValue={billingAddress?.address_2 || undefined}
            data-testid="billing-address-2-input"
          />
          <div className="grid grid-cols-[144px_1fr] gap-x-2">
            <Input
              label="Postal code"
              name="postal_code"
              defaultValue={billingAddress?.postal_code || undefined}
              required
              inputMode="numeric"
              maxLength={5}
              errors={state.fieldErrors}
              data-testid="billing-postcal-code-input"
            />
            <Input
              label="City"
              name="city"
              defaultValue={billingAddress?.city || undefined}
              required
              errors={state.fieldErrors}
              data-testid="billing-city-input"
            />
          </div>
          <Input
            label="Province"
            name="province"
            defaultValue={billingAddress?.province || undefined}
            errors={state.fieldErrors}
            data-testid="billing-province-input"
          />
          <NativeSelect
            name="country_code"
            defaultValue={billingAddress?.country_code || undefined}
            required
            data-testid="billing-country-code-select"
          >
            <option value="">-</option>
            {regionOptions.map((option, i) => {
              return (
                <option key={i} value={option?.value}>
                  {option?.label}
                </option>
              )
            })}
          </NativeSelect>
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileBillingAddress
