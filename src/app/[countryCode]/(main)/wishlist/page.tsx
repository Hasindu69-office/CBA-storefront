import { retrieveWishlist } from "@lib/data/wishlist"
import WishlistTemplate from "@modules/wishlist/templates"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Wishlist",
  description: "View your saved products",
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params
  const result = await retrieveWishlist({
    country_code: countryCode,
    currency_code: "lkr",
  })

  return (
    <WishlistTemplate
      wishlist={result.wishlist}
      countryCode={countryCode}
      errorMessage={result.success ? undefined : result.message}
    />
  )
}
