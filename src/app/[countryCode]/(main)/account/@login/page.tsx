import { Metadata } from "next"

import { retrieveAccountAuthSettings } from "@lib/data/account-auth"
import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Ebiz account.",
}

export default async function Login({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const [{ countryCode }, settings] = await Promise.all([
    params,
    retrieveAccountAuthSettings(),
  ])

  return <LoginTemplate settings={settings} countryCode={countryCode} />
}
