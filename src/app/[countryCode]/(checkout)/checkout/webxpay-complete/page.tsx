import { getStoreCountryCode, localizedPath } from "@lib/util/routes"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Confirming payment",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

type Props = {
  searchParams: Promise<{ order_id?: string; token?: string }>
}

export default async function WebxpayCompletePage({ searchParams }: Props) {
  const query = await searchParams
  const countryCode = await getStoreCountryCode()
  const params = new URLSearchParams()
  if (query.order_id) params.set("order_id", String(query.order_id))
  if (query.token) params.set("token", String(query.token))
  redirect(localizedPath(`/${countryCode}/checkout/webxpay-complete/confirm?${params.toString()}`))
}
