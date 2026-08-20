import { completeOAuthLogin } from "@lib/data/customer"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ countryCode: string; provider: string }>
  }
) {
  const { countryCode, provider } = await params
  const query = Object.fromEntries(request.nextUrl.searchParams.entries())

  await completeOAuthLogin({
    provider,
    query,
    countryCode,
  })
}
