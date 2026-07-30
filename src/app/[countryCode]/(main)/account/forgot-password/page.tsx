import { Metadata } from "next"

import ForgotPasswordForm from "@modules/account/templates/forgot-password"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link.",
}

export default async function ForgotPassword({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  return <ForgotPasswordForm countryCode={countryCode} />
}
