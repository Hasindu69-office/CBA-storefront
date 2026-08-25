import { Metadata } from "next"
import Link from "next/link"
import { localizedPath } from "@lib/util/routes"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Payment result",
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = "force-dynamic"

const PAYMENT_RESULT_COPY: Record<
  string,
  {
    title: string
    message: string
    primaryAction: string
    showSupportCode: boolean
  }
> = {
  declined: {
    title: "Payment Cancelled",
    message:
      "No order was placed and your cart is still saved. You can return to checkout and try again whenever you are ready.",
    primaryAction: "Try Again",
    showSupportCode: false,
  },
  cancelled: {
    title: "Payment Cancelled",
    message:
      "No order was placed and your cart is still saved. You can return to checkout or choose another payment method.",
    primaryAction: "Return to Checkout",
    showSupportCode: false,
  },
  expired: {
    title: "Payment Session Expired",
    message:
      "Your cart is still saved. Please return to checkout and start the payment again.",
    primaryAction: "Restart Checkout",
    showSupportCode: false,
  },
  unknown: {
    title: "Payment Is Not Confirmed",
    message:
      "We could not confirm the payment yet. Your cart is still saved. Contact support if your bank shows a charge.",
    primaryAction: "Return to Checkout",
    showSupportCode: true,
  },
  failed: {
    title: "Payment Could Not Be Verified",
    message:
      "Your cart is still saved. Contact support if your bank shows a charge.",
    primaryAction: "Return to Checkout",
    showSupportCode: true,
  },
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ status?: string; code?: string; message?: string }>
}

type IconProps = {
  className?: string
}

export default async function PaymentResultPage({ params, searchParams }: Props) {
  const { countryCode } = await params
  const query = await searchParams
  const status = String(query.status ?? "failed").toLowerCase()
  const copy = PAYMENT_RESULT_COPY[status] ?? PAYMENT_RESULT_COPY.failed
  const message =
    copy.showSupportCode &&
    typeof query.message === "string" &&
    query.message.length < 200
      ? query.message
      : copy.message

  if (status === "declined" || status === "cancelled" || status === "expired") {
    return (
      <GatewayExitTemplate
        countryCode={countryCode}
        status={status}
        title={copy.title}
        message={message}
        primaryAction={copy.primaryAction}
      />
    )
  }

  return (
    <div className="content-container flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-md border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-[24px] font-bold text-[#111111]">{copy.title}</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#626978]">{message}</p>
        {copy.showSupportCode && query.code ? (
          <p className="mt-4 text-[12px] font-semibold text-[#9aa1af]">
            Support code: {String(query.code).slice(0, 64)}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 small:flex-row">
          <Link
            href={localizedPath(`/${countryCode}/checkout`)}
            className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-[14px] font-bold text-white hover:bg-brand-hover"
          >
            {copy.primaryAction}
          </Link>
          <Link
            href={localizedPath(`/${countryCode}/cart`)}
            className="inline-flex h-11 items-center justify-center rounded-md border border-gray-200 px-5 text-[14px] font-bold text-[#252a33]"
          >
            View cart
          </Link>
        </div>
      </div>
    </div>
  )
}

function GatewayExitTemplate({
  countryCode,
  status,
  title,
  message,
  primaryAction,
}: {
  countryCode: string
  status: string
  title: string
  message: string
  primaryAction: string
}) {
  const paymentStatus = status === "expired" ? "Expired" : "Cancelled"

  return (
    <main className="bg-white py-10 small:py-14">
      <div className="content-container">
        <section className="rounded-[8px] border border-[#eeeeee] bg-white px-5 py-8 shadow-[0_2px_18px_rgba(20,26,34,0.06)] small:px-8 medium:px-12 medium:py-10">
          <div className="flex flex-col gap-5 small:flex-row small:items-center">
            <CancelledIcon className="h-20 w-20 shrink-0 small:h-24 small:w-24" />
            <div>
              <h1 className="text-[32px] font-bold leading-tight text-[#151922] small:text-[42px]">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-6 text-[#59616e]">
                {message}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 large:grid-cols-[1fr_360px]">
            <div className="rounded-[8px] border border-[#e6e8eb] bg-white p-5 small:p-7">
              <div className="grid gap-5 small:grid-cols-3">
                <DetailCard
                  icon={<CardIcon className="h-6 w-6" />}
                  label="Payment Status"
                >
                  <span className="text-[#b54708]">{paymentStatus}</span>
                </DetailCard>
                <DetailCard
                  icon={<BagIcon className="h-6 w-6" />}
                  label="Cart Status"
                >
                  Saved
                </DetailCard>
                <DetailCard
                  icon={<ArrowRightIcon className="h-6 w-6" />}
                  label="Next Step"
                >
                  Choose a payment method
                </DetailCard>
              </div>

              <div className="mt-8 rounded-[8px] bg-[#fff7f1] px-5 py-5 small:px-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-brand shadow-sm">
                    <HeadsetIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-[#1b2028]">
                      Need help completing payment?
                    </h2>
                    <p className="mt-1 max-w-2xl text-[14px] leading-6 text-[#5d6470]">
                      If you were not charged, no action is needed. If your bank shows a charge,
                      contact support with your checkout details.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-[8px] border border-[#e2e5e8] bg-white p-6 shadow-sm">
              <h2 className="text-[22px] font-bold text-[#151922]">
                Continue Checkout
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-[#59616e]">
                Your cart items are still available. You can retry WebXPay, use another card,
                or choose another payment method.
              </p>

              <div className="mt-8 grid gap-4">
                <Link
                  href={localizedPath(`/${countryCode}/checkout`)}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-[8px] bg-brand px-6 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
                >
                  {primaryAction}
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
                <Link
                  href={localizedPath(`/${countryCode}/cart`)}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-[8px] border border-brand px-6 text-[15px] font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                >
                  <BagIcon className="h-6 w-6" />
                  View Cart
                </Link>
                <Link
                  href={localizedPath(`/${countryCode}/store`)}
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-[8px] border border-[#cfd5dc] px-6 text-[15px] font-semibold text-[#59616e] transition-colors hover:border-brand hover:text-brand"
                >
                  Continue Shopping
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  )
}

function DetailCard({
  icon,
  label,
  children,
}: {
  icon: ReactNode
  label: string
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-[28px_1fr] gap-4 border-b border-[#eeeeee] pb-5 last:border-b-0 small:border-b-0 small:border-r small:pb-0 small:pr-6 small:last:border-r-0">
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

function CancelledIcon({ className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 96 96"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="48" cy="48" r="30" fill="#FF5C0E" />
      <circle cx="48" cy="48" r="41" stroke="#FF5C0E" strokeOpacity=".14" strokeWidth="14" />
      <path d="M35 35 61 61M61 35 35 61" stroke="#fff" strokeLinecap="round" strokeWidth="7" />
      <path d="M16 35h2M78 36h2M25 19l1 2M72 20l-1 2M20 73l2-1M75 73l-2-1" stroke="#FF5C0E" strokeLinecap="round" strokeWidth="3" />
      <path d="M32 12v2M84 25l-1 2" stroke="#2f343d" strokeLinecap="round" strokeWidth="3" />
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

function BagIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M6 8h12l-1 12H7L6 8Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M9 8a3 3 0 0 1 6 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
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

function HeadsetIcon({ className }: IconProps) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}
