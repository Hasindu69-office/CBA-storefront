"use client"

import React, { useEffect, useState, useActionState } from "react"
import { PencilSquare as Edit, Trash } from "@medusajs/icons"
import { Badge, Button, Heading, Text, clx } from "@medusajs/ui"
import { useRouter } from "next/navigation"

import useToggleState from "@lib/hooks/use-toggle-state"
import CountrySelect from "@modules/checkout/components/country-select"
import Input from "@modules/common/components/input"
import SriLankanPhoneInput from "@modules/common/components/sri-lankan-phone-input"
import Modal from "@modules/common/components/modal"
import Spinner from "@modules/common/icons/spinner"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { HttpTypes } from "@medusajs/types"
import {
  deleteCustomerAddress,
  setCustomerAddressDefault,
  updateCustomerAddress,
} from "@lib/data/customer"
import { notify } from "@lib/notifications"

type EditAddressProps = {
  region: HttpTypes.StoreRegion
  address: HttpTypes.StoreCustomerAddress
  isActive?: boolean
}

const EditAddress: React.FC<EditAddressProps> = ({
  region,
  address,
  isActive = false,
}) => {
  const [removing, setRemoving] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<"shipping" | "billing" | null>(null)
  const [successState, setSuccessState] = useState(false)
  const router = useRouter()
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(updateCustomerAddress, {
    success: false,
    error: null,
    addressId: address.id,
  })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
      router.refresh()
      notify.success("Address updated.", { id: `edit-address:${address.id}` })
    } else if (formState.error) {
      notify.error(formState.error, "Could not update address.", {
        id: `edit-address:${address.id}`,
      })
    }
  }, [formState, router])

  const updateDefault = async (role: "shipping" | "billing", value: boolean) => {
    setUpdatingRole(role)
    const result = await setCustomerAddressDefault(address.id, role, value)
    if (result.success) {
      notify.success(`Default ${role} address updated.`, { id: `address-role:${address.id}:${role}` })
      router.refresh()
    } else {
      notify.error(result.error, "Could not update address default.", { id: `address-role:${address.id}:${role}` })
    }
    setUpdatingRole(null)
  }

  const removeAddress = async () => {
    setRemoving(true)
    const toastId = `delete-address:${address.id}`
    notify.loading("Removing address...", { id: toastId })
    try {
      const result = await deleteCustomerAddress(address.id)
      if (result.success) {
        notify.success("Address removed.", { id: toastId })
      } else {
        notify.error(result.error, "Could not remove address.", { id: toastId })
      }
    } catch (error) {
      notify.error(error, "Could not remove address.", { id: toastId })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <div
        className={clx(
          "border rounded-rounded p-5 min-h-[220px] h-full w-full flex flex-col justify-between transition-colors",
          {
            "border-gray-900": isActive,
          }
        )}
        data-testid="address-container"
      >
        <div className="flex flex-col">
          <Heading
            className="text-left text-base-semi"
            data-testid="address-name"
          >
            {address.first_name} {address.last_name}
          </Heading>
          {address.company && (
            <Text
              className="txt-compact-small text-ui-fg-base"
              data-testid="address-company"
            >
              {address.company}
            </Text>
          )}
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Address roles">
            {address.is_default_shipping && <Badge color="blue">Default shipping</Badge>}
            {address.is_default_billing && <Badge color="green">Default billing</Badge>}
          </div>
          <Text className="flex flex-col text-left text-base-regular mt-2">
            <span data-testid="address-address">
              {address.address_1}
              {address.address_2 && <span>, {address.address_2}</span>}
            </span>
            <span data-testid="address-postal-city">
              {address.postal_code}, {address.city}
            </span>
            <span data-testid="address-province-country">
              {address.province && `${address.province}, `}
              {address.country_code?.toUpperCase()}
            </span>
            {address.phone && <span data-testid="address-phone">{address.phone}</span>}
          </Text>
        </div>
        <div className="flex items-center gap-x-4">
          <button
            className="text-small-regular text-ui-fg-base flex items-center gap-x-2"
            onClick={open}
            data-testid="address-edit-button"
          >
            <Edit />
            Edit
          </button>
          <button
            className="text-small-regular text-ui-fg-base flex items-center gap-x-2"
            onClick={removeAddress}
            data-testid="address-delete-button"
          >
            {removing ? <Spinner /> : <Trash />}
            Remove
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
          <Button
            type="button"
            size="small"
            variant={address.is_default_shipping ? "secondary" : "primary"}
            isLoading={updatingRole === "shipping"}
            onClick={() => updateDefault("shipping", !address.is_default_shipping)}
          >
            {address.is_default_shipping ? "Clear shipping default" : "Set as default shipping"}
          </Button>
          <Button
            type="button"
            size="small"
            variant={address.is_default_billing ? "secondary" : "primary"}
            isLoading={updatingRole === "billing"}
            onClick={() => updateDefault("billing", !address.is_default_billing)}
          >
            {address.is_default_billing ? "Clear billing default" : "Set as default billing"}
          </Button>
        </div>
      </div>

      <Modal isOpen={state} close={close} data-testid="edit-address-modal">
        <Modal.Title>
          <Heading className="mb-2">Edit address</Heading>
        </Modal.Title>
        <form action={formAction}>
          <input type="hidden" name="addressId" value={address.id} />
          <Modal.Body>
            <div className="grid grid-cols-1 gap-y-2">
              <div className="grid grid-cols-2 gap-x-2">
                <Input
                  label="First name"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  defaultValue={address.first_name || undefined}
                  errors={formState.fieldErrors}
                  data-testid="first-name-input"
                />
                <Input
                  label="Last name"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  defaultValue={address.last_name || undefined}
                  errors={formState.fieldErrors}
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label="Company"
                name="company"
                autoComplete="organization"
                defaultValue={address.company || undefined}
                data-testid="company-input"
              />
              <Input
                label="Address"
                name="address_1"
                required
                autoComplete="address-line1"
                defaultValue={address.address_1 || undefined}
                errors={formState.fieldErrors}
                data-testid="address-1-input"
              />
              <Input
                label="Apartment, suite, etc."
                name="address_2"
                autoComplete="address-line2"
                defaultValue={address.address_2 || undefined}
                data-testid="address-2-input"
              />
              <div className="grid grid-cols-[144px_1fr] gap-x-2">
                <Input
                  label="Postal code"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  defaultValue={address.postal_code || undefined}
                  inputMode="numeric"
                  maxLength={5}
                  errors={formState.fieldErrors}
                  data-testid="postal-code-input"
                />
                <Input
                  label="City"
                  name="city"
                  required
                  autoComplete="locality"
                  defaultValue={address.city || undefined}
                  errors={formState.fieldErrors}
                  data-testid="city-input"
                />
              </div>
              <Input
                label="Province / State"
                name="province"
                autoComplete="address-level1"
                defaultValue={address.province || undefined}
                errors={formState.fieldErrors}
                data-testid="state-input"
              />
              <CountrySelect
                name="country_code"
                region={region}
                required
                autoComplete="country"
                defaultValue={address.country_code || undefined}
                data-testid="country-select"
              />
              <SriLankanPhoneInput
                label="Phone"
                name="phone"
                required
                defaultValue={address.phone || undefined}
                error={formState.fieldErrors?.phone}
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div className="text-rose-500 text-small-regular py-2">
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="flex gap-3 mt-6">
              <Button
                type="reset"
                variant="secondary"
                onClick={close}
                className="h-10"
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <SubmitButton data-testid="save-button">Save</SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default EditAddress
