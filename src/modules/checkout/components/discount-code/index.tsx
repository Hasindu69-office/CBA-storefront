"use client"

import { Badge, Heading, Input, Label, Text } from "@medusajs/ui"
import React from "react"

import { applyPromotionsSafe } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"
import {
  PROMOTION_CODE_MAX_LENGTH,
  validatePromotionCode,
} from "@lib/util/promotions"
import { useRouter } from "next/navigation"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart
  const manualPromotions = promotions.filter(
    (promotion) => !promotion.is_automatic
  )
  const hasAutomaticPromotions = promotions.some(
    (promotion) => promotion.is_automatic
  )
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => !promotion.is_automatic && promotion.code !== code
    )

    const result = await applyPromotionsSafe(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
    if (!result.success) {
      setErrorMessage(result.error)
      return
    }
    router.refresh()
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const rawCode = String(formData.get("code") ?? "")
    const codes = promotions
      .filter((p) => !p.is_automatic)
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    const appliedCodes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    const validation = validatePromotionCode(rawCode, appliedCodes)
    if (validation.error) {
      setErrorMessage(validation.error)
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    codes.push(validation.code)

    const result = await applyPromotionsSafe(codes)
    if (!result.success) {
      setErrorMessage(result.error)
      return
    }

    if (input) {
      input.value = ""
    }
    router.refresh()
  }

  return (
    <div className="w-full bg-white flex flex-col">
      <div className="txt-medium">
        <form action={(a) => addPromotionCode(a)} className="w-full mb-5">
          <Label className="flex gap-x-1 my-2 items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="txt-medium text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="add-discount-button"
            >
              Add Promotion Code(s)
            </button>

            {/* <Tooltip content="You can add multiple promotion codes">
              <InformationCircleSolid color="var(--fg-muted)" />
            </Tooltip> */}
          </Label>

          {isOpen && (
            <>
              <div className="flex w-full gap-x-2">
                <Input
                  className="size-full"
                  id="promotion-input"
                  name="code"
                  type="text"
                  maxLength={PROMOTION_CODE_MAX_LENGTH}
                  onChange={(event) => {
                    event.currentTarget.value = event.currentTarget.value.toUpperCase()
                  }}
                  autoFocus={false}
                  data-testid="discount-input"
                />
                <SubmitButton
                  variant="secondary"
                  data-testid="discount-apply-button"
                >
                  Apply
                </SubmitButton>
              </div>

              <ErrorMessage
                error={errorMessage}
                data-testid="discount-error-message"
              />
            </>
          )}
        </form>

        {(manualPromotions.length > 0 || hasAutomaticPromotions) && (
          <div className="w-full flex items-center">
            <div className="flex flex-col w-full">
              <Heading className="txt-medium mb-2">
                Promotion(s) applied:
              </Heading>

              {manualPromotions.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between w-full max-w-full mb-2"
                    data-testid="discount-row"
                  >
                    <Text className="flex gap-x-1 items-baseline txt-small-plus w-4/5 pr-1">
                      <span className="truncate" data-testid="discount-code">
                        <Badge color="grey" size="small">
                          {promotion.code}
                        </Badge>{" "}
                        (
                        {promotion.application_method?.value !== undefined &&
                          promotion.application_method.currency_code !==
                            undefined && (
                            <>
                              {promotion.application_method.type ===
                              "percentage"
                                ? `${promotion.application_method.value}%`
                                : convertToLocale({
                                    amount: +promotion.application_method.value,
                                    currency_code:
                                      promotion.application_method
                                        .currency_code,
                                  })}
                            </>
                          )}
                        )
                      </span>
                    </Text>
                    <button
                      className="flex items-center"
                      onClick={() => {
                        if (!promotion.code) {
                          return
                        }

                        removePromotionCode(promotion.code)
                      }}
                      data-testid="remove-discount-button"
                    >
                      <Trash size={14} />
                      <span className="sr-only">
                        Remove discount code from order
                      </span>
                    </button>
                  </div>
                )
              })}
              {hasAutomaticPromotions && (
                <div
                  className="flex items-center justify-between w-full max-w-full mb-2"
                  data-testid="discount-row"
                >
                  <Text className="flex gap-x-2 items-center txt-small-plus w-4/5 pr-1 text-emerald-700">
                    <Badge color="green" size="small">
                      Auto
                    </Badge>
                    <span data-testid="discount-code">Store discount applied</span>
                  </Text>
                  <span className="text-xs text-ui-fg-muted">
                    Store offer
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode
