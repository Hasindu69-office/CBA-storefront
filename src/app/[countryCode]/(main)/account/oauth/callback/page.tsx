import { completeOAuthLogin } from "@lib/data/customer"

export default async function AccountOAuthCallback({
  params,
  searchParams,
}: {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [{ countryCode }, rawSearchParams] = await Promise.all([params, searchParams])
  const provider = first(rawSearchParams.provider)
  const query = Object.fromEntries(
    Object.entries(rawSearchParams)
      .filter((entry): entry is [string, string | string[]] => entry[1] !== undefined)
      .map(([key, value]) => [key, first(value)])
  )

  await completeOAuthLogin({
    provider,
    query,
    countryCode,
  })

  return null
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
}
