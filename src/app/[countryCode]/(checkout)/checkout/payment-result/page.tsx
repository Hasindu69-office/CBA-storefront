import { Metadata } from "next"
import Link from "next/link"
import { localizedPath } from "@lib/util/routes"

export const metadata: Metadata = {
  title: "Payment result",
  robots: {
    index: false,
    follow: false,
  },
}

export const dynamic = "force-dynamic"

const SAFE_MESSAGES: Record<string, string> = {
  declined:
    "Your payment was declined. Your cart is still saved — you can try another method or card.",
  failed:
    "We could not verify this payment response. Your cart is still saved. Contact support if you were charged.",
  expired:
    "This payment session expired. Please return to checkout and try again.",
  unknown:
    "We could not confirm your payment yet. Your cart is still saved. Contact support if you were charged.",
  cancelled: "Payment was cancelled. Your cart is still saved.",
}

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ status?: string; code?: string; message?: string }>
}

export default async function PaymentResultPage({ params, searchParams }: Props) {
  const { countryCode } = await params
  const query = await searchParams
  const status = String(query.status ?? "failed").toLowerCase()
  const message =
    SAFE_MESSAGES[status] ||
    (typeof query.message === "string" && query.message.length < 200
      ? query.message
      : SAFE_MESSAGES.failed)

  return (
    <div className="content-container flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-md border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-[24px] font-bold text-[#111111]">Payment not completed</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#626978]">{message}</p>
        {query.code ? (
          <p className="mt-4 text-[12px] font-semibold text-[#9aa1af]">
            Support code: {String(query.code).slice(0, 64)}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 small:flex-row">
          <Link
            href={localizedPath(`/${countryCode}/checkout`)}
            className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-5 text-[14px] font-bold text-white hover:bg-brand-hover"
          >
            Return to checkout
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
