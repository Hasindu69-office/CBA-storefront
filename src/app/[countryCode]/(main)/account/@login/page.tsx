import { retrieveAccountAuthSettings } from "@lib/data/account-auth"
import LoginTemplate from "@modules/account/templates/login-template"

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
