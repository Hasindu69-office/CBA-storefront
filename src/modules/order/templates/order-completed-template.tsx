import { paymentInfoMap } from "@lib/constants"
import { getAuthHeaders } from "@lib/data/cookies"
import { mapAuthoritativeTotals } from "@lib/util/cart-totals"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import DownloadReceiptButton from "@modules/order/components/download-receipt-button"
import Thumbnail from "@modules/products/components/thumbnail"
import { cookies as nextCookies } from "next/headers"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

type IconProps = {
  className?: string
}

const fallbackText = "Not available"

type InstallmentPaymentSummary = {
  bankName: string
  tenorMonths: number
  feePercentage: number
  baseAmount: number
  chargeAmount: number
  feeAmount: number
  monthlyAmount: number
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value)
  }
  if (value && typeof value === "object") {
    const candidate = value as {
      value?: unknown
      numeric?: unknown
      toNumber?: () => number
      toString?: () => string
    }
    if ("value" in candidate) return numberValue(candidate.value)
    if ("numeric" in candidate) return numberValue(candidate.numeric)
    if (typeof candidate.toNumber === "function") {
      const parsed = candidate.toNumber()
      if (Number.isFinite(parsed)) return parsed
    }
    if (typeof candidate.toString === "function") {
      const parsed = Number(candidate.toString())
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function formatAmount(order: HttpTypes.StoreOrder, amount?: number | null) {
  return convertToLocale({
    amount: amount ?? 0,
    currency_code: order.currency_code,
  })
}

function formatStatus(value?: string | null) {
  if (!value) {
    return fallbackText
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ")
}

function formatOrderDate(value?: string | Date | null) {
  if (!value) {
    return fallbackText
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallbackText
  }

  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}  •  ${date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`
}

function formatOrderNumber(order: HttpTypes.StoreOrder) {
  return order.display_id ? `CBA-${order.display_id}` : order.id
}

function formatAddress(order: HttpTypes.StoreOrder) {
  const address = order.shipping_address

  if (!address) {
    return [fallbackText]
  }

  const name = [address.first_name, address.last_name].filter(Boolean).join(" ")
  const street = [address.address_1, address.address_2].filter(Boolean).join(", ")
  const cityLine = [address.city, address.province, address.postal_code]
    .filter(Boolean)
    .join(", ")
  const country = address.country_code?.toUpperCase()

  return [name, street, cityLine, country].filter(Boolean)
}

function getInstallmentPaymentSummary(order: HttpTypes.StoreOrder) {
  const payments =
    order.payment_collections?.flatMap((collection) => collection.payments ?? []) ??
    []

  for (const payment of payments) {
    const data = (payment.data ?? {}) as Record<string, unknown>
    const plan =
      data?.selected_installment_plan &&
      typeof data.selected_installment_plan === "object"
        ? (data.selected_installment_plan as Record<string, unknown>)
        : null
    if (!plan) continue

    const bankName =
      stringValue(plan.bank_name) ??
      stringValue(plan.bankName) ??
      "Selected bank"
    const tenorMonths = numberValue(plan.tenor_months ?? plan.tenorMonths)
    const feePercentage = numberValue(
      plan.fee_percentage ?? plan.feePercentage
    )
    const baseAmount = numberValue(data.base_amount ?? plan.base_amount ?? order.total)
    const chargeAmount = numberValue(
      data.installment_charge_amount ??
        plan.installment_charge_amount ??
        payment.amount
    )

    if (
      !tenorMonths ||
      tenorMonths <= 0 ||
      feePercentage === null ||
      baseAmount === null ||
      chargeAmount === null
    ) {
      continue
    }

    const feeAmount = Math.max(0, chargeAmount - baseAmount)
    return {
      bankName,
      tenorMonths,
      feePercentage,
      baseAmount,
      chargeAmount,
      feeAmount,
      monthlyAmount: chargeAmount / tenorMonths,
    }
  }

  return null
}

function getPaymentMethod(order: HttpTypes.StoreOrder) {
  const installment = getInstallmentPaymentSummary(order)
  if (installment) {
    return "Installment Plans"
  }

  const payment = order.payment_collections?.[0]?.payments?.[0]

  if (!payment?.provider_id) {
    return fallbackText
  }

  return paymentInfoMap[payment.provider_id]?.title ?? formatStatus(payment.provider_id)
}

function getShippingInfo(order: HttpTypes.StoreOrder) {
  const method = order.shipping_methods?.[0]
  const methodName = method?.name
  const status = formatStatus(order.fulfillment_status)

  if (methodName && status !== fallbackText) {
    return `${methodName} • ${status}`
  }

  return methodName ?? status
}

function getItemSku(item: HttpTypes.StoreOrderLineItem) {
  const itemWithSku = item as HttpTypes.StoreOrderLineItem & {
    variant_sku?: string | null
  }

  return item.variant?.sku ?? itemWithSku.variant_sku ?? fallbackText
}

function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={`order-success-icon ${className ?? ""}`}
      fill="none"
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="order-success-icon__core" cx="48" cy="48" r="30" fill="#35A825" />
      <circle className="order-success-icon__halo" cx="48" cy="48" r="41" stroke="#35A825" strokeOpacity=".12" strokeWidth="14" />
      <path
        className="order-success-icon__check"
        d="m33 49 10 10 21-24"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="7"
      />
      <path d="M16 35h2M78 36h2M25 19l1 2M72 20l-1 2M20 73l2-1M75 73l-2-1" stroke="#20A126" strokeLinecap="round" strokeWidth="3" />
      <path d="M32 12v2M84 25l-1 2" stroke="#FF5C0E" strokeLinecap="round" strokeWidth="3" />
    </svg>
  )
}

function ClipboardIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M9 4h6l1 2h2v14H6V6h2l1-2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 10h6M9 14h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v13H4V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function CardIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18M7 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function TruckIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M10 17h4V6H3v11h2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M14 9h4l3 4v4h-2" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function MapPinIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M12 21s7-5.2 7-12A7 7 0 0 0 5 9c0 6.8 7 12 7 12Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function PackageIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m4.5 8 7.5 4 7.5-4M12 12v8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function BagIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function MailIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m5 7 7 6 7-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function DetailCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[28px_1fr] gap-4 border-b border-[#eeeeee] pb-5 last:border-b-0 small:border-b-0 small:border-r small:pb-0 small:pr-8 small:last:border-r-0">
      <div className="pt-0.5 text-[#2f343d]">{icon}</div>
      <div>
        <p className="text-[13px] font-semibold text-[#5d6470]">{label}</p>
        <div className="mt-2 text-[14px] font-semibold leading-6 text-[#151922]">
          {children}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: string
  tone?: "default" | "discount"
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-[15px] leading-6">
      <span className="text-[#3b414c]">{label}</span>
      <span
        className={
          tone === "discount"
            ? "font-semibold text-[#24a148]"
            : "font-medium text-[#1c222c]"
        }
      >
        {value}
      </span>
    </div>
  )
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()
  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"
  const auth = await getAuthHeaders()
  const isSignedIn = "authorization" in auth
  const trackOrderHref = isSignedIn
    ? `/account/orders/details/${order.id}`
    : "/track-order"
  const items = order.items ?? []
  const addressLines = formatAddress(order)
  const itemCount = items.reduce((total, item) => total + (item.quantity ?? 0), 0)
  const mappedTotals = mapAuthoritativeTotals(
    {
      ...order,
      discount_total: (order.discount_total ?? 0) + (order.gift_card_total ?? 0),
      items: order.items as never,
      shipping_methods: order.shipping_methods as never,
    },
    { itemCount }
  )
  const installmentPayment = getInstallmentPaymentSummary(order)
  const displayTotal = installmentPayment
    ? formatAmount(order, installmentPayment.chargeAmount)
    : mappedTotals.total.display
  const totalLabel = installmentPayment ? "Payment Total" : "Total"

  return (
    <main className="bg-white py-10 small:py-14">
      <div className="content-container">
        {isOnboarding && (
          <div className="mb-8">
            <OnboardingCta orderId={order.id} />
          </div>
        )}

        <section
          className="rounded-[8px] border border-[#eeeeee] bg-white px-5 py-8 shadow-[0_2px_18px_rgba(20,26,34,0.06)] small:px-8 medium:px-12 medium:py-10"
          data-testid="order-complete-container"
        >
          <div className="flex flex-col gap-5 small:flex-row small:items-center">
            <CheckCircleIcon className="h-20 w-20 shrink-0 small:h-24 small:w-24" />
            <div>
              <h1 className="text-[32px] font-bold leading-tight text-[#151922] small:text-[42px]">
                Order Confirmed
              </h1>
              <p className="mt-3 text-[16px] leading-6 text-[#59616e]">
                Thank you! Your order has been placed successfully.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 large:grid-cols-[1fr_360px]">
            <div className="rounded-[8px] border border-[#e6e8eb] bg-white p-5 small:p-7">
              <div className="grid gap-5 small:grid-cols-2 large:grid-cols-[1fr_1fr_1.45fr]">
                <div className="grid gap-5">
                  <DetailCard
                    icon={<ClipboardIcon className="h-6 w-6" />}
                    label="Order Number"
                  >
                    <span className="text-brand" data-testid="order-id">
                      {formatOrderNumber(order)}
                    </span>
                  </DetailCard>
                  <DetailCard
                    icon={<CalendarIcon className="h-6 w-6" />}
                    label="Order Date"
                  >
                    <span data-testid="order-date">
                      {formatOrderDate(order.created_at)}
                    </span>
                  </DetailCard>
                </div>

                <div className="grid gap-5">
                  <DetailCard
                    icon={<CardIcon className="h-6 w-6" />}
                    label="Payment Method"
                  >
                    <span className="block" data-testid="payment-method">
                      {getPaymentMethod(order)}
                    </span>
                    {installmentPayment && (
                      <span className="mt-1 block text-[13px] font-medium leading-5 text-[#6b7280]">
                        {installmentPayment.bankName} •{" "}
                        {installmentPayment.tenorMonths} months •{" "}
                        {installmentPayment.feePercentage}%
                      </span>
                    )}
                  </DetailCard>
                  <DetailCard
                    icon={<TruckIcon className="h-6 w-6" />}
                    label="Shipping Status"
                  >
                    {getShippingInfo(order)}
                  </DetailCard>
                </div>

                <DetailCard
                  icon={<MapPinIcon className="h-7 w-7" />}
                  label="Shipping Address"
                >
                  <address
                    className="not-italic"
                    data-testid="shipping-address-summary"
                  >
                    {addressLines.map((line) => (
                      <span className="block" key={line}>
                        {line}
                      </span>
                    ))}
                  </address>
                </DetailCard>
              </div>

              <div className="mt-8 border-t border-[#e4e6e8] pt-7">
                <div className="hidden grid-cols-[1fr_110px_170px] gap-5 pb-4 text-[14px] font-bold text-[#222833] small:grid">
                  <span>Item</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-right">Price</span>
                </div>

                <div className="divide-y divide-[#eceef0]" data-testid="products-table">
                  {items.length ? (
                    items.map((item) => {
                      const quantity = item.quantity ?? 0
                      const lineTotal = item.total ?? 0

                      return (
                        <div
                          className="grid gap-4 py-5 small:grid-cols-[1fr_110px_170px] small:items-center"
                          data-testid="product-row"
                          key={item.id}
                        >
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="h-16 w-20 shrink-0">
                              <Thumbnail
                                thumbnail={item.thumbnail}
                                size="square"
                                className="!h-16 !w-20 !rounded-[6px] !bg-white !p-2 shadow-none ring-1 ring-[#edf0f2]"
                              />
                            </div>
                            <div className="min-w-0">
                              <p
                                className="text-[15px] font-bold leading-6 text-[#1c222c]"
                                data-testid="product-name"
                              >
                                {item.product_title ?? "Product"}
                              </p>
                              <p className="mt-1 text-[13px] text-[#6b7280]">
                                SKU: {getItemSku(item)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between small:block small:text-center">
                            <span className="text-[13px] font-semibold text-[#69717d] small:hidden">
                              Quantity
                            </span>
                            <span
                              className="text-[15px] font-medium text-[#161b24]"
                              data-testid="product-quantity"
                            >
                              {quantity}
                            </span>
                          </div>

                          <div className="flex items-start justify-between small:block small:text-right">
                            <span className="text-[13px] font-semibold text-[#69717d] small:hidden">
                              Price
                            </span>
                            <div>
                              <p
                                className="text-[15px] font-semibold text-[#161b24]"
                                data-testid="product-price"
                              >
                                {formatAmount(order, lineTotal)}
                              </p>
                              {quantity > 1 && (
                                <p className="mt-1 text-[13px] text-[#6b7280]">
                                  {formatAmount(order, lineTotal / quantity)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-[8px] border border-[#ffd8d1] bg-[#fff7f5] px-5 py-8 text-center text-[14px] font-medium text-[#7b341f]">
                      No order items are available for this confirmation.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-5 rounded-[8px] bg-[#fff7f1] px-5 py-5 small:flex-row small:items-center small:justify-between small:px-7">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1b2028]">
                      Need help with your order?
                    </h2>
                    <p className="mt-1 text-[14px] text-[#5d6470]">
                      Our support team is here to help you.
                    </p>
                  </div>
                </div>
                <LocalizedClientLink
                  href="/contact"
                  className="inline-flex h-12 items-center justify-center gap-3 rounded-[8px] border border-brand px-6 text-[15px] font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                >
                  Contact Support
                  <ArrowRightIcon className="h-5 w-5" />
                </LocalizedClientLink>
              </div>
            </div>

            <aside className="rounded-[8px] border border-[#e2e5e8] bg-white p-6 shadow-sm">
              <h2 className="text-[22px] font-bold text-[#151922]">
                Order Summary
              </h2>

              <div className="mt-7 space-y-5">
                {mappedTotals.rows
                  .filter((row) => row.key !== "tax" || row.amount > 0)
                  .map((row) => (
                    row.key === "discount" ? (
                  <SummaryRow
                    key={row.key}
                    label="Discount"
                    value={`- ${row.display}`}
                    tone="discount"
                  />
                    ) : (
                  <SummaryRow
                    key={row.key}
                    label={row.label}
                    value={row.display}
                  />
                    )
                  ))}
                {installmentPayment?.feeAmount ? (
                  <SummaryRow
                    label={`Installment fee (${installmentPayment.feePercentage}%)`}
                    value={formatAmount(order, installmentPayment.feeAmount)}
                  />
                ) : null}
              </div>

              <div className="my-7 h-px bg-[#dfe3e6]" />

              <div className="flex items-end justify-between gap-4">
                <span className="text-[22px] font-bold text-[#151922]">
                  {totalLabel}
                </span>
                <span className="text-right text-[25px] font-bold text-brand">
                  {displayTotal}
                </span>
              </div>
              {installmentPayment && (
                <div className="mt-4 rounded-[8px] border border-[#ffd8d1] bg-[#fff7f5] px-4 py-3 text-[13px] leading-5 text-[#6b4d44]">
                  <p className="font-semibold text-[#1f2933]">
                    {installmentPayment.tenorMonths} x{" "}
                    {formatAmount(order, installmentPayment.monthlyAmount)} with{" "}
                    {installmentPayment.bankName}
                  </p>
                  <p className="mt-1">
                    Base order total is{" "}
                    {formatAmount(order, installmentPayment.baseAmount)}.
                    WebXPay charged{" "}
                    {formatAmount(order, installmentPayment.chargeAmount)} after
                    the bank installment fee.
                  </p>
                </div>
              )}
              {mappedTotals.taxNote && (
                <p className="mt-5 text-center text-[13px] text-[#6b7280]">
                  {mappedTotals.taxNote}
                </p>
              )}

              <div className="mt-8 grid gap-4">
                <DownloadReceiptButton orderId={order.id} />
                <LocalizedClientLink
                  href={trackOrderHref}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-[8px] border border-brand text-[15px] font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                >
                  <PackageIcon className="h-6 w-6" />
                  Track Order
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/store"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-[8px] border border-[#cfd5dc] text-[15px] font-semibold text-[#59616e] transition-colors hover:border-brand hover:text-brand"
                >
                  <BagIcon className="h-6 w-6" />
                  Continue Shopping
                </LocalizedClientLink>
              </div>

              <div className="mt-9 flex items-start gap-4 rounded-[8px] bg-[#eef8ef] px-5 py-6 text-[#2f963e]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#31a640]">
                  <MailIcon className="h-6 w-6" />
                </div>
                <p className="min-w-0 flex-1 text-[14px] font-semibold leading-6">
                  A confirmation email has been sent to{" "}
                  <span className="break-all" data-testid="order-email">
                    {order.email ?? fallbackText}
                  </span>
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}
