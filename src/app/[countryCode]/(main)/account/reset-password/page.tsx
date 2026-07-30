import { Metadata } from "next"

import ResetPasswordForm from "@modules/account/templates/reset-password"

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new account password.",
}

export default async function ResetPassword({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const [{ countryCode }, query] = await Promise.all([params, searchParams])
  return <ResetPasswordForm countryCode={countryCode} token={query.token ?? ""} email={query.email ?? ""} />
}
