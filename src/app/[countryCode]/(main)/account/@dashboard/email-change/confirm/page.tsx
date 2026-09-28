import type { Metadata } from "next"

import ConfirmEmailChange from "@modules/account/components/confirm-email-change"

export const metadata: Metadata = {
  title: "Confirm email change",
  description: "Confirm your new account email address.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

export default async function ConfirmEmailChangePage({ params, searchParams }: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const [{ countryCode }, query] = await Promise.all([params, searchParams])
  return <ConfirmEmailChange token={query.token ?? ""} countryCode={countryCode} />
}
