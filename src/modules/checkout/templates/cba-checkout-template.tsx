"use client"

import {
  initiatePaymentSession,
  applyPromotionsSafe,
  calculateCartTaxes,
  placeOrder,
  saveCheckoutDetails,
  setShippingMethod,
} from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { isManual, isStripeLike, isWebxpay, paymentInfoMap } from "@lib/constants"
import type { WebxpayCheckoutBranding } from "@lib/data/webxpay-branding"
import { notify } from "@lib/notifications"
import { convertToLocale } from "@lib/util/money"
import { mapAuthoritativeTotals } from "@lib/util/cart-totals"
import { focusCheckoutValidationField } from "@lib/util/checkout-validation-focus"
import { getStoreCountryCode, localizedPath } from "@lib/util/routes"
import { HttpTypes } from "@medusajs/types"
import {
  ArrowRight,
  Bolt,
  BuildingTax,
  Cash,
  Clock,
  CreditCard,
  Envelope,
  LockClosedSolid,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from "@medusajs/icons"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import Radio from "@modules/common/components/radio"
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type RefObject,
  type ReactNode,
} from "react"
import CartProgress from "@modules/cart/templates/cart-progress"
import CartCouponForm from "@modules/cart/templates/cart-coupon-form"
import {
  hasAutomaticPromotions,
  manualCodesWithNewCoupon,
} from "@lib/util/coupon-promotions"

type CbaCheckoutTemplateProps = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  shippingMethods: HttpTypes.StoreCartShippingOption[]
  paymentMethods: HttpTypes.StorePaymentProvider[]
  webxpayBranding?: WebxpayCheckoutBranding | null
}

type CbaCheckoutCart = HttpTypes.StoreCart & {
  discount_subtotal?: number | null
  metadata?: Record<string, unknown> | null
  promotions?: HttpTypes.StorePromotion[]
}

function money(amount: number | null | undefined, currencyCode: string) {
  return convertToLocale({
    amount: amount ?? 0,
    currency_code: currencyCode,
  })
}

function lineTotal(item: HttpTypes.StoreCartLineItem, currencyCode: string) {
  return money(item.total ?? item.subtotal ?? 0, currencyCode)
}

function paymentTitle(
  providerId: string,
  webxpayBranding?: WebxpayCheckoutBranding | null
) {
  if (isWebxpay(providerId) && webxpayBranding?.label) {
    return webxpayBranding.label
  }
  const mapped = paymentInfoMap[providerId]?.title
  if (mapped) {
    return mapped
  }
  if (/cash|cod/i.test(providerId)) return "Cash on Delivery"
  if (/payhere/i.test(providerId)) return "PayHere"
  if (/bank|manual/i.test(providerId)) return "Bank Transfer"
  return providerId.replace(/^pp_/, "").replace(/[_-]+/g, " ")
}

function paymentIcon(
  providerId: string,
  webxpayBranding?: WebxpayCheckoutBranding | null
) {
  if (isWebxpay(providerId) && webxpayBranding?.image_url) {
    return (
      <img
        src={webxpayBranding.image_url}
        alt={webxpayBranding.image_alt_text || "WEBXPAY"}
        className="h-6 w-10 object-contain"
      />
    )
  }
  if (/cash|cod/i.test(providerId)) return <Cash />
  if (/bank|manual/i.test(providerId)) return <BuildingTax />
  return paymentInfoMap[providerId]?.icon ?? <CreditCard />
}

function selectedPaymentSession(cart: HttpTypes.StoreCart) {
  return cart.payment_collection?.payment_sessions?.find(
    (session) => session.status === "pending"
  )
}

function hasAddress(cart: HttpTypes.StoreCart) {
  return Boolean(
    cart.email &&
      cart.shipping_address?.first_name &&
      cart.shipping_address?.last_name &&
      cart.shipping_address?.address_1 &&
      cart.shipping_address?.city &&
      cart.shipping_address?.postal_code &&
      cart.shipping_address?.phone
  )
}

export default function CbaCheckoutTemplate({
  cart,
  customer,
  shippingMethods,
  paymentMethods,
  webxpayBranding = null,
}: CbaCheckoutTemplateProps) {
  const activeSession = selectedPaymentSession(cart)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? paymentMethods[0]?.id ?? ""
  )
  const [cardComplete, setCardComplete] = useState(false)
  const addressFormRef = useRef<HTMLFormElement>(null)
  const [isSavingCheckoutDetails, setIsSavingCheckoutDetails] = useState(false)

  const saveCurrentCheckoutDetails = useCallback(async () => {
    const form = addressFormRef.current
    if (!form) {
      const message = "Delivery details are not ready."
      notify.error(message, message, { id: "checkout-details" })
      return message
    }

    setIsSavingCheckoutDetails(true)

    let result: string | null = null
    try {
      result = await saveCheckoutDetails(null, new FormData(form))
    } catch (err) {
      result =
        err instanceof Error ? err.message : "Could not save delivery details."
    } finally {
      setIsSavingCheckoutDetails(false)
    }

    if (result) {
      notify.error(result, "Could not save delivery details.", {
        id: "checkout-details",
      })
      focusCheckoutValidationField(form, result)
      return result
    }

    notify.dismiss("checkout-details")
    return null
  }, [])

  useEffect(() => {
    if (activeSession?.provider_id) {
      setSelectedPaymentMethod(activeSession.provider_id)
    }
  }, [activeSession?.provider_id])

  return (
    <div className="content-container py-10 small:py-12">
      <h1 className="text-center text-[32px] small:text-[36px] font-bold leading-tight text-[#111111]">
        Checkout
      </h1>
      <CartProgress currentStep={2} />

      <div className="mt-10 grid grid-cols-1 gap-6 small:grid-cols-[minmax(0,1fr)_360px] medium:grid-cols-[minmax(0,1fr)_400px]">
        <section className="rounded-md border border-gray-100 bg-white p-5 shadow-sm small:p-7">
          <ShippingInformationForm
            cart={cart}
            customer={customer}
            formRef={addressFormRef}
            isSaving={isSavingCheckoutDetails}
            saveCurrentCheckoutDetails={saveCurrentCheckoutDetails}
          />
          <DeliveryMethodSelector
            cart={cart}
            shippingMethods={shippingMethods}
            isSavingCheckoutDetails={isSavingCheckoutDetails}
            saveCurrentCheckoutDetails={saveCurrentCheckoutDetails}
          />
          <PaymentMethodSelector
            cart={cart}
            paymentMethods={paymentMethods}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            setCardComplete={setCardComplete}
            isSavingCheckoutDetails={isSavingCheckoutDetails}
            saveCurrentCheckoutDetails={saveCurrentCheckoutDetails}
            webxpayBranding={webxpayBranding}
          />
        </section>

        <aside className="flex flex-col gap-4">
          <CheckoutOrderSummary
            cart={cart as CbaCheckoutCart}
            cardComplete={cardComplete}
            selectedPaymentMethod={selectedPaymentMethod}
            isSavingCheckoutDetails={isSavingCheckoutDetails}
            saveCurrentCheckoutDetails={saveCurrentCheckoutDetails}
            webxpayBranding={webxpayBranding}
          />
        </aside>
      </div>
    </div>
  )
}

function ShippingInformationForm({
  cart,
  customer,
  formRef,
  isSaving,
  saveCurrentCheckoutDetails,
}: {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
  formRef: RefObject<HTMLFormElement | null>
  isSaving: boolean
  saveCurrentCheckoutDetails: () => Promise<string | null>
}) {
  const initialFullName = [
    cart.shipping_address?.first_name,
    cart.shipping_address?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    startTransition(async () => {
      await saveCurrentCheckoutDetails()
    })
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="border-b border-gray-100 pb-6"
    >
      <SectionTitle
        icon={<MapPin className="text-brand" />}
        title="Shipping Information"
        subtitle="Enter your delivery details"
      />
      <input type="hidden" name="shipping_address.country_code" value="lk" />
      <div className="mt-4 grid grid-cols-1 gap-4 medium:grid-cols-2">
        <Field
          label="Full Name"
          name="full_name"
          placeholder="Enter your full name"
          defaultValue={initialFullName || customer?.first_name || ""}
          required
        />
        <Field
          label="Phone Number"
          name="shipping_address.phone"
          placeholder="Enter your phone number"
          defaultValue={cart.shipping_address?.phone ?? ""}
          required
        />
        <Field
          label="Email Address"
          name="email"
          type="email"
          placeholder="Enter your email address"
          defaultValue={cart.email ?? customer?.email ?? ""}
          required
          className="medium:col-span-2"
          icon={<Envelope />}
        />
        <Field
          label="Street Address"
          name="shipping_address.address_1"
          placeholder="Enter your street address"
          defaultValue={cart.shipping_address?.address_1 ?? ""}
          required
          className="medium:col-span-2"
        />
        <Field
          label="Apartment, suite, unit, etc. (optional)"
          name="shipping_address.address_2"
          placeholder="Enter apartment, suite, unit, etc."
          defaultValue={cart.shipping_address?.address_2 ?? ""}
          className="medium:col-span-2"
        />
        <Field
          label="City"
          name="shipping_address.city"
          placeholder="Select city"
          defaultValue={cart.shipping_address?.city ?? ""}
          required
        />
        <Field
          label="District"
          name="shipping_address.province"
          placeholder="Select district"
          defaultValue={cart.shipping_address?.province ?? ""}
          required
        />
        <Field
          label="Postal Code"
          name="shipping_address.postal_code"
          placeholder="Enter postal code"
          defaultValue={cart.shipping_address?.postal_code ?? ""}
          required
        />
        <label className="flex flex-col gap-1.5 medium:col-span-2">
          <span className="text-[12px] font-semibold text-[#252a33]">
            Delivery Instructions (optional)
          </span>
          <textarea
            name="delivery_instructions"
            defaultValue={String(
              (cart as CbaCheckoutCart).metadata?.cba_delivery_instructions ??
                ""
            )}
            rows={3}
            maxLength={500}
            placeholder="Add delivery notes (e.g. gate code, landmark, preferred time)"
            className="min-h-[64px] rounded-md border border-gray-200 px-4 py-3 text-[13px] outline-none transition placeholder:text-[#9aa1af] focus:border-brand"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
        <label className="flex items-center gap-2 text-[13px] font-medium text-[#4b5260]">
          <input
            type="checkbox"
            name="save_address"
            className="h-4 w-4 rounded border-gray-300 accent-brand"
          />
          Save this address for future orders
        </label>
        {(isSaving || isPending) && (
          <span className="text-[13px] font-semibold text-[#6b7280]">
            Saving delivery details...
          </span>
        )}
      </div>
    </form>
  )
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
  type = "text",
  required,
  className = "",
  icon,
}: {
  label: string
  name: string
  placeholder: string
  defaultValue?: string
  type?: string
  required?: boolean
  className?: string
  icon?: ReactNode
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-[12px] font-semibold text-[#252a33]">
        {label} {required && <span className="text-brand">*</span>}
      </span>
      <span className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center text-[#8b93a3]">
            {icon}
          </span>
        )}
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          required={required}
          placeholder={placeholder}
          className={`h-10 w-full rounded-md border border-gray-200 px-4 text-[13px] outline-none transition placeholder:text-[#9aa1af] focus:border-brand ${
            icon ? "pl-10" : ""
          }`}
        />
      </span>
    </label>
  )
}

function DeliveryMethodSelector({
  cart,
  shippingMethods,
  isSavingCheckoutDetails,
  saveCurrentCheckoutDetails,
}: {
  cart: HttpTypes.StoreCart
  shippingMethods: HttpTypes.StoreCartShippingOption[]
  isSavingCheckoutDetails: boolean
  saveCurrentCheckoutDetails: () => Promise<string | null>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState(
    cart.shipping_methods?.at(-1)?.shipping_option_id ?? ""
  )
  const [calculatedPrices, setCalculatedPrices] = useState<Record<string, number>>(
    {}
  )
  const deliveryMethods = shippingMethods.filter(
    (method) => (method as any).service_zone?.fulfillment_set?.type !== "pickup"
  )

  useEffect(() => {
    deliveryMethods
      .filter((method) => method.price_type === "calculated")
      .forEach((method) => {
        calculatePriceForShippingOption(method.id, cart.id).then((option) => {
          if (option?.amount !== undefined) {
            setCalculatedPrices((current) => ({
              ...current,
              [method.id]: option.amount!,
            }))
          }
        })
      })
  }, [cart.id, deliveryMethods])

  const selectMethod = (methodId: string) => {
    setSelected(methodId)
    startTransition(async () => {
      try {
        const checkoutDetailsError = await saveCurrentCheckoutDetails()
        if (checkoutDetailsError) {
          setSelected(cart.shipping_methods?.at(-1)?.shipping_option_id ?? "")
          return
        }

        await setShippingMethod({ cartId: cart.id, shippingMethodId: methodId })
        router.refresh()
      } catch (err) {
        setSelected(cart.shipping_methods?.at(-1)?.shipping_option_id ?? "")
        notify.error(
          err,
          "Could not set delivery method.",
          { id: "checkout-shipping" }
        )
      }
    })
  }

  return (
    <div className="border-b border-gray-100 py-6">
      <SectionTitle
        icon={<ShoppingBag className="text-brand" />}
        title="Delivery Method"
        subtitle="Select your preferred delivery option"
      />
      <div
        role="radiogroup"
        aria-label="Delivery method"
        className="mt-4 grid grid-cols-1 gap-3 medium:grid-cols-2"
      >
        {deliveryMethods.map((method, index) => {
          const checked = selected === method.id
          const price =
            method.price_type === "flat"
              ? method.amount ?? 0
              : calculatedPrices[method.id]
          const isFree = Number(price ?? 0) <= 0

          return (
            <button
              key={method.id}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => selectMethod(method.id)}
              disabled={
                isPending || isSavingCheckoutDetails || method.insufficient_inventory
              }
              className={`flex min-h-[66px] items-center gap-4 rounded-md border px-4 text-left transition ${
                checked
                  ? "border-brand bg-brand/5"
                  : "border-gray-200 hover:border-brand/60"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Radio checked={checked} />
              <span className="flex h-9 w-9 items-center justify-center text-[#7b8493]">
                {index === 0 ? <ShoppingBag /> : <Bolt />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-bold text-[#252a33]">
                  {method.name}
                </span>
                <span className="block text-[12px] text-[#6b7280]">
                  {index === 0 ? "2 - 4 business days" : "1 - 2 business days"}
                </span>
              </span>
              <span
                className={`text-[12px] font-bold ${
                  isFree ? "text-[#25a244]" : "text-[#252a33]"
                }`}
              >
                {price === undefined
                  ? "..."
                  : isFree
                  ? "FREE"
                  : money(price, cart.currency_code)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PaymentMethodSelector({
  cart,
  paymentMethods,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  setCardComplete,
  isSavingCheckoutDetails,
  saveCurrentCheckoutDetails,
  webxpayBranding,
}: {
  cart: HttpTypes.StoreCart
  paymentMethods: HttpTypes.StorePaymentProvider[]
  selectedPaymentMethod: string
  setSelectedPaymentMethod: (method: string) => void
  setCardComplete: (complete: boolean) => void
  isSavingCheckoutDetails: boolean
  saveCurrentCheckoutDetails: () => Promise<string | null>
  webxpayBranding?: WebxpayCheckoutBranding | null
}) {
  const router = useRouter()
  const activeSession = selectedPaymentSession(cart)
  const [isPending, startTransition] = useTransition()

  const selectPayment = (providerId: string) => {
    const previousPaymentMethod = selectedPaymentMethod
    setSelectedPaymentMethod(providerId)
    setCardComplete(false)
    startTransition(async () => {
      try {
        const checkoutDetailsError = await saveCurrentCheckoutDetails()
        if (checkoutDetailsError) {
          setSelectedPaymentMethod(previousPaymentMethod)
          return
        }

        await initiatePaymentSession(cart, { provider_id: providerId })
        router.refresh()
      } catch (err) {
        setSelectedPaymentMethod(previousPaymentMethod)
        notify.error(err, "Could not set payment method.", {
          id: "checkout-payment",
        })
      }
    })
  }

  return (
    <div className="pt-6">
      <SectionTitle
        icon={<CreditCard className="text-brand" />}
        title="Payment Method"
        subtitle="Choose a secure payment option"
      />
      <div
        role="radiogroup"
        aria-label="Payment method"
        className="mt-4 overflow-hidden rounded-md border border-gray-200"
      >
        {paymentMethods.map((method) => {
          const checked = selectedPaymentMethod === method.id
          const isActiveSession = activeSession?.provider_id === method.id
          return (
            <div key={method.id}>
              <button
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => selectPayment(method.id)}
                disabled={isPending || isSavingCheckoutDetails}
                className={`flex min-h-[42px] w-full items-center gap-4 border-b border-gray-100 px-4 text-left last:border-b-0 ${
                  checked ? "bg-brand/5 ring-1 ring-inset ring-brand" : ""
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Radio checked={checked} />
                <span className="text-[#6f7b8e]">
                  {paymentIcon(method.id, webxpayBranding)}
                </span>
                <span className="flex-1 text-[13px] font-bold text-[#252a33]">
                  {paymentTitle(method.id, webxpayBranding)}
                  {checked && isWebxpay(method.id) ? (
                    <span className="mt-1 block text-[11px] font-medium text-[#6b7280]">
                      You will be redirected to WEBXPAY to complete payment securely.
                    </span>
                  ) : null}
                </span>
                <span className="text-[#1f4f8a]">
                  {isWebxpay(method.id) && webxpayBranding?.image_url
                    ? null
                    : paymentInfoMap[method.id]?.icon}
                </span>
              </button>
              {checked && isStripeLike(method.id) && isActiveSession && (
                <div className="border-b border-gray-100 px-4 py-4">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontFamily: "Inter, sans-serif",
                          color: "#252a33",
                          "::placeholder": { color: "#9aa1af" },
                        },
                      },
                      classes: {
                        base: "rounded-md border border-gray-200 px-4 py-3",
                      },
                    }}
                    onChange={(event) => {
                      setCardComplete(event.complete)
                      if (event.error?.message) {
                        notify.error(event.error.message, "Card details are invalid.", {
                          id: "checkout-payment",
                        })
                      } else {
                        notify.dismiss("checkout-payment")
                      }
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CheckoutOrderSummary({
  cart,
  selectedPaymentMethod,
  cardComplete,
  isSavingCheckoutDetails,
  saveCurrentCheckoutDetails,
  webxpayBranding,
}: {
  cart: CbaCheckoutCart
  selectedPaymentMethod: string
  cardComplete: boolean
  isSavingCheckoutDetails: boolean
  saveCurrentCheckoutDetails: () => Promise<string | null>
  webxpayBranding?: WebxpayCheckoutBranding | null
}) {
  const router = useRouter()
  const [isRefreshingTotals, setIsRefreshingTotals] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const itemCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const automaticPromotions = hasAutomaticPromotions(cart.promotions)
  const mapped = mapAuthoritativeTotals(cart, {
    itemCount,
    automaticPromotionApplied: automaticPromotions,
  })
  const subtotalRow = mapped.rows.find((row) => row.key === "subtotal")
  const discountRow = mapped.rows.find((row) => row.key === "discount")
  const taxRows = mapped.rows.filter((row) =>
    ["item-tax", "shipping-tax", "tax"].includes(row.key)
  )

  const applyCheckoutCoupon = async (code: string) => {
    const result = await applyPromotionsSafe(
      manualCodesWithNewCoupon(cart.promotions, code)
    )
    if (!result.success) {
      return result.error
    }
    router.refresh()
    return null
  }

  const refreshTotals = async () => {
    setIsRefreshingTotals(true)
    try {
      await calculateCartTaxes(cart.id)
      notify.dismiss("checkout-totals")
      router.refresh()
    } catch (error) {
      notify.error(error, "Could not refresh totals.", { id: "checkout-totals" })
    } finally {
      setIsRefreshingTotals(false)
    }
  }

  return (
    <>
      <section className="rounded-md border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-3 text-[20px] font-bold text-[#111111]">
            <ShoppingBag />
            Order Summary
          </h2>
          <span className="text-[13px] font-semibold text-[#7b8493]">
            {itemCount} items
          </span>
        </div>

        <div className="mt-5 flex max-h-[360px] flex-col overflow-y-auto">
          {(cart.items ?? []).map((item) => (
            <SummaryItem
              key={item.id}
              item={item}
              currencyCode={cart.currency_code}
            />
          ))}
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4">
          <CartCouponForm
            promotions={cart.promotions ?? []}
            onApply={applyCheckoutCoupon}
            disabled={isSavingCheckoutDetails}
            variant="checkout"
          />
        </div>

        <div className="mt-4 border-t border-gray-100 pt-5 text-[14px]">
          <SummaryLine
            label="Subtotal"
            value={subtotalRow?.display ?? money(cart.item_subtotal ?? cart.subtotal, cart.currency_code)}
          />
          {discountRow && (
            <SummaryLine
              label={discountRow.label}
              value={`- ${discountRow.display}`}
              accent="green"
            />
          )}
          {mapped.shippingVisible && (
            <SummaryLine
              label="Delivery Fee"
              value={
                mapped.shippingBeforeDiscountDisplay ? (
                  <span className="text-right">
                    <span className="block text-[12px] font-semibold text-[#8b90a0] line-through">
                      {mapped.shippingBeforeDiscountDisplay}
                    </span>
                    <span>{mapped.shippingDisplay}</span>
                  </span>
                ) : (
                  mapped.shippingDisplay
                )
              }
              accent={
                mapped.shippingIsFree || mapped.shippingBeforeDiscountDisplay
                  ? "green"
                  : undefined
              }
            />
          )}
          {taxRows.map((row) => (
            <SummaryLine key={row.key} label={row.label} value={row.display} />
          ))}
        </div>

        <div className="mt-5 border-t border-gray-100 pt-5">
          <div className="flex items-start justify-between gap-4">
            <span className="text-[20px] font-bold text-[#111111]">Total</span>
            <span className="text-right">
              <span className="block text-[24px] font-bold text-brand">
                {mapped.total.display}
              </span>
          {mapped.taxNote && (
            <span className="text-[12px] font-semibold text-[#7b8493]" aria-live="polite">
              {mapped.taxNote}
            </span>
          )}
            </span>
          </div>
          {(mapped.states.includes("tax_pending") ||
            mapped.states.includes("configuration_unavailable") ||
            mapped.states.includes("calculation_failed")) && (
            <div className="mt-4 rounded-md border border-brand/20 bg-brand/5 px-3 py-3">
              <p className="text-[12px] font-semibold text-[#626978]" aria-live="polite">
                {mapped.taxNote}
              </p>
              <button
                type="button"
                onClick={refreshTotals}
                disabled={isRefreshingTotals}
                className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-brand px-4 text-[13px] font-bold text-brand transition hover:bg-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefreshingTotals ? "Refreshing..." : "Retry totals"}
              </button>
            </div>
          )}
          <PlaceOrderControl
            cart={cart}
            selectedPaymentMethod={selectedPaymentMethod}
            cardComplete={cardComplete}
            isSavingCheckoutDetails={isSavingCheckoutDetails}
            saveCurrentCheckoutDetails={saveCurrentCheckoutDetails}
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
            webxpayBranding={webxpayBranding}
          />
        </div>
      </section>
      <SecureCheckoutPanel />
    </>
  )
}

function SummaryItem({
  item,
  currencyCode,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
}) {
  const image = item.thumbnail || item.variant?.product?.images?.[0]?.url
  return (
    <div className="grid grid-cols-[74px_minmax(0,1fr)] gap-4 border-b border-gray-100 py-4 last:border-b-0">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={item.product_title ?? "Product image"}
            fill
            sizes="74px"
            className="object-contain"
          />
        ) : (
          <PlaceholderImage size={24} />
        )}
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-[13px] font-bold leading-5 text-[#252a33]">
          {item.product_title}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[13px] font-bold text-[#252a33]">
            Qty: {item.quantity}
          </span>
          <span className="text-[14px] font-bold text-[#111111]">
            {lineTotal(item, currencyCode)}
          </span>
        </div>
      </div>
    </div>
  )
}

function SummaryLine({
  label,
  value,
  accent,
}: {
  label: string
  value: ReactNode
  accent?: "green"
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 last:mb-0">
      <span className="font-semibold text-[#252a33]">{label}</span>
      <span
        className={`font-bold ${
          accent === "green" ? "text-[#25a244]" : "text-[#111111]"
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function PlaceOrderControl({
  cart,
  selectedPaymentMethod,
  cardComplete,
  isSavingCheckoutDetails,
  saveCurrentCheckoutDetails,
  termsAccepted,
  setTermsAccepted,
  webxpayBranding,
}: {
  cart: HttpTypes.StoreCart
  selectedPaymentMethod: string
  cardComplete: boolean
  isSavingCheckoutDetails: boolean
  saveCurrentCheckoutDetails: () => Promise<string | null>
  termsAccepted: boolean
  setTermsAccepted: (accepted: boolean) => void
  webxpayBranding?: WebxpayCheckoutBranding | null
}) {
  const activeSession = selectedPaymentSession(cart)
  const totals = mapAuthoritativeTotals(cart)
  const totalsReady = !totals.states.some((state) =>
    ["tax_pending", "configuration_unavailable", "calculation_failed", "review_required"].includes(state)
  )
  const baseReady =
    hasAddress(cart) &&
    Boolean(cart.billing_address) &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    Boolean(activeSession) &&
    totalsReady &&
    termsAccepted

  const termsControl = (
    <label className="mt-5 flex items-start gap-3 rounded-md border border-gray-100 p-3 text-[12px] font-semibold text-[#4b5260]">
      <input
        type="checkbox"
        checked={termsAccepted}
        onChange={(event) => setTermsAccepted(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-brand"
      />
      <span>
        I agree to the terms and conditions and confirm the checkout details are correct.
      </span>
    </label>
  )

  if (isStripeLike(activeSession?.provider_id)) {
    return (
      <>
        {termsControl}
        <StripePlaceOrderButton
          cart={cart}
          providerId={activeSession?.provider_id}
          disabled={!baseReady || !cardComplete || isSavingCheckoutDetails}
          saveCurrentCheckoutDetails={saveCurrentCheckoutDetails}
          termsAccepted={termsAccepted}
        />
      </>
    )
  }

  if (isWebxpay(activeSession?.provider_id)) {
    return (
      <>
        {termsControl}
        <WebxPayPlaceOrderButton
          cart={cart}
          disabled={!baseReady || isSavingCheckoutDetails}
          saveCurrentCheckoutDetails={saveCurrentCheckoutDetails}
          label={webxpayBranding?.label || "Pay with WEBXPAY"}
        />
      </>
    )
  }

  if (isManual(activeSession?.provider_id) || activeSession?.provider_id) {
    return (
      <>
        {termsControl}
        <ManualPlaceOrderButton
          providerId={activeSession?.provider_id}
          disabled={!baseReady || isSavingCheckoutDetails}
          saveCurrentCheckoutDetails={saveCurrentCheckoutDetails}
          termsAccepted={termsAccepted}
        />
      </>
    )
  }

  return (
    <button
      type="button"
      disabled
      className="mt-6 inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-3 rounded-md bg-brand px-5 text-[16px] font-bold text-white opacity-60"
      title={
        selectedPaymentMethod
          ? totalsReady
            ? "Save checkout details and payment method first"
            : "Refresh checkout totals before placing the order"
          : "Select a payment method"
      }
    >
      Place Order
      <ArrowRight />
    </button>
  )
}

function StripePlaceOrderButton({
  cart,
  providerId,
  disabled,
  saveCurrentCheckoutDetails,
  termsAccepted,
}: {
  cart: HttpTypes.StoreCart
  providerId?: string
  disabled: boolean
  saveCurrentCheckoutDetails: () => Promise<string | null>
  termsAccepted: boolean
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isPending, setIsPending] = useState(false)
  const submittingRef = useRef(false)
  const session = cart.payment_collection?.payment_sessions?.find(
    (item) => item.status === "pending"
  )

  const submit = async () => {
    if (submittingRef.current) {
      return
    }
    submittingRef.current = true
    setIsPending(true)
    notify.loading("Placing order...", { id: "place-order" })

    const checkoutDetailsError = await saveCurrentCheckoutDetails()
    if (checkoutDetailsError) {
      notify.dismiss("place-order")
      setIsPending(false)
      submittingRef.current = false
      return
    }

    const card = elements?.getElement("card")
    if (!stripe || !elements || !card || !session?.data.client_secret) {
      notify.error("Payment details are not ready.", "Payment details are not ready.", {
        id: "place-order",
      })
      setIsPending(false)
      submittingRef.current = false
      return
    }

    const result = await stripe.confirmCardPayment(
      session.data.client_secret as string,
      {
        payment_method: {
          card,
          billing_details: {
            name: `${cart.billing_address?.first_name ?? ""} ${
              cart.billing_address?.last_name ?? ""
            }`.trim(),
            email: cart.email,
            phone: cart.billing_address?.phone ?? undefined,
            address: {
              city: cart.billing_address?.city ?? undefined,
              country: cart.billing_address?.country_code ?? undefined,
              line1: cart.billing_address?.address_1 ?? undefined,
              line2: cart.billing_address?.address_2 ?? undefined,
              postal_code: cart.billing_address?.postal_code ?? undefined,
              state: cart.billing_address?.province ?? undefined,
            },
          },
        },
      }
    )

    if (result.error) {
      notify.error(
        result.error.message ?? "Payment could not be confirmed.",
        "Payment could not be confirmed.",
        { id: "place-order" }
      )
      setIsPending(false)
      submittingRef.current = false
      return
    }

    await placeOrder({ providerId, termsAccepted }).catch((err) => {
      notify.error(err, "Could not place order.", { id: "place-order" })
      setIsPending(false)
      submittingRef.current = false
    })
  }

  return (
    <button
      type="button"
      onClick={submit}
      disabled={disabled || isPending}
      aria-busy={isPending}
      className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-brand px-5 text-[16px] font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Placing Order..." : "Place Order"}
      <ArrowRight />
    </button>
  )
}

function WebxPayPlaceOrderButton({
  cart,
  disabled,
  saveCurrentCheckoutDetails,
  label,
}: {
  cart: HttpTypes.StoreCart
  disabled: boolean
  saveCurrentCheckoutDetails: () => Promise<string | null>
  label: string
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const submittingRef = useRef(false)

  const submit = async () => {
    if (submittingRef.current) {
      return
    }
    submittingRef.current = true
    setIsPending(true)
    notify.loading("Continuing to WEBXPAY...", { id: "place-order" })

    const checkoutDetailsError = await saveCurrentCheckoutDetails()
    if (checkoutDetailsError) {
      notify.dismiss("place-order")
      setIsPending(false)
      submittingRef.current = false
      return
    }

    const countryCode = getStoreCountryCode(
      cart.shipping_address?.country_code ?? cart.region?.countries?.[0]?.iso_2
    )
    // Public URLs omit /{countryCode}; middleware restores [countryCode] routes.
    // Absolute /checkout/webxpay-redirect — never relative "webxpay-redirect"
    // which incorrectly resolves to /webxpay-redirect and 404s.
    const target = localizedPath(`/${countryCode}/checkout/webxpay-redirect`)
    if (process.env.NODE_ENV !== "production") {
      console.info("[webxpay] navigating to redirect page", {
        target,
        cart_id: cart.id,
        provider_id: selectedPaymentSession(cart)?.provider_id ?? null,
      })
    }
    notify.dismiss("place-order")
    router.push(target)
  }

  return (
    <button
      type="button"
      onClick={() => void submit()}
      disabled={disabled || isPending}
      aria-busy={isPending}
      className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-brand px-5 text-[16px] font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Continuing to WEBXPAY..." : label}
      <ArrowRight />
    </button>
  )
}

function ManualPlaceOrderButton({
  providerId,
  disabled,
  saveCurrentCheckoutDetails,
  termsAccepted,
}: {
  providerId?: string
  disabled: boolean
  saveCurrentCheckoutDetails: () => Promise<string | null>
  termsAccepted: boolean
}) {
  const [isPending, setIsPending] = useState(false)
  const submittingRef = useRef(false)

  const submit = async () => {
    if (submittingRef.current) {
      return
    }
    submittingRef.current = true
    setIsPending(true)
    notify.loading("Placing order...", { id: "place-order" })

    const checkoutDetailsError = await saveCurrentCheckoutDetails()
    if (checkoutDetailsError) {
      notify.dismiss("place-order")
      setIsPending(false)
      submittingRef.current = false
      return
    }

    await placeOrder({ providerId, termsAccepted }).catch((err) => {
      notify.error(err, "Could not place order.", { id: "place-order" })
      setIsPending(false)
      submittingRef.current = false
    })
  }

  return (
    <button
      type="button"
      onClick={submit}
      disabled={disabled || isPending}
      className="mt-6 inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-brand px-5 text-[16px] font-bold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
      aria-busy={isPending}
    >
      {isPending ? "Placing Order..." : "Place Order"}
      <ArrowRight />
    </button>
  )
}

function SecureCheckoutPanel() {
  const items = [
    { label: "100% Secure Payments", icon: <LockClosedSolid /> },
    { label: "Easy Returns & Refunds", icon: <Clock /> },
    { label: "Genuine Products", icon: <ShieldCheck /> },
    { label: "Dedicated Support", icon: <MapPin /> },
  ]

  return (
    <section className="rounded-md border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex gap-4 rounded-md border border-gray-100 p-4">
        <div className="text-[#20a63a]">
          <ShieldCheck />
        </div>
        <div>
          <h3 className="text-[14px] font-bold text-[#111111]">
            Secure Checkout
          </h3>
          <p className="mt-1 text-[12px] leading-5 text-[#626978]">
            Your personal information is encrypted and safe with us.
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 medium:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-md border border-gray-100 p-2 text-center"
          >
            <span className="text-[#252a33]">{item.icon}</span>
            <span className="text-[11px] font-bold leading-4 text-[#252a33]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center text-brand">
        {icon}
      </span>
      <div>
        <h2 className="text-[20px] font-bold leading-6 text-[#111111]">
          {title}
        </h2>
        <p className="mt-1 text-[13px] text-[#626978]">{subtitle}</p>
      </div>
    </div>
  )
}
