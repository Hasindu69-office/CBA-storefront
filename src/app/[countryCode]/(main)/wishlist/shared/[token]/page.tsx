import { retrieveSharedWishlist } from "@lib/data/wishlist"
import WishlistTemplate from "@modules/wishlist/templates"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shared Wishlist",
  description: "View a shared wishlist",
}

export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ countryCode: string; token: string }>
}) {
  const { countryCode, token } = await params
  const result = await retrieveSharedWishlist(token, {
    country_code: countryCode,
    currency_code: "lkr",
  })

  return (
    <WishlistTemplate
      wishlist={result.wishlist}
      countryCode={countryCode}
      errorMessage={result.success ? undefined : result.message}
      shared
      shareExpiresAt={result.expiresAt}
    />
  )
}
