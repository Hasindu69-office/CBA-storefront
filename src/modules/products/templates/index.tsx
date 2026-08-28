import { getProductDetail, getProductReviews } from "@lib/data/product-detail"
import {
  listAccessoryCompanionCards,
  listCrossSellCompanionCards,
  listRelatedProductCards,
  listUpSellCompanionCards,
} from "@lib/data/product-relationship-cards"
import { listPdpBannerContent } from "@lib/data/pdp-banners"
import {
  retrieveKokoCheckoutBranding,
  retrieveKokoPaymentAvailability,
} from "@lib/data/koko-branding"
import { retrieveWishlistedProductIds } from "@lib/data/wishlist"
import CbaProductDetail from "@modules/products/templates/cba-product-detail"
import { WishlistProductProvider } from "@modules/wishlist/components/wishlist-product-button"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  selectedVariantId?: string
}

export default async function ProductTemplate({
  product,
  region,
  countryCode,
  images,
  selectedVariantId,
}: ProductTemplateProps) {
  if (!product || !product.id) {
    return notFound()
  }

  const [
    detail,
    reviews,
    pdpBanners,
    wishlistedProductIds,
    kokoBranding,
    kokoAvailable,
  ] = await Promise.all([
    getProductDetail(product.id, selectedVariantId),
    getProductReviews(product.id, { limit: 5 }),
    listPdpBannerContent(),
    retrieveWishlistedProductIds({
      country_code: countryCode,
      currency_code: "lkr",
    }),
    retrieveKokoCheckoutBranding(),
    retrieveKokoPaymentAvailability(region.id),
  ])

  const [crossSellProducts, accessoryProducts, upSellProducts, relatedProducts] =
    await Promise.all([
      listCrossSellCompanionCards(detail),
      listAccessoryCompanionCards(detail),
      listUpSellCompanionCards(detail),
      listRelatedProductCards(product.id, detail, {
        countryCode,
        categoryIds:
          product.categories?.map((category) => category.id).filter(Boolean) ?? [],
      }),
    ])

  return (
    <WishlistProductProvider initialProductIds={wishlistedProductIds}>
      <CbaProductDetail
        product={product}
        countryCode={countryCode}
        images={images}
        detail={detail}
        reviews={reviews}
        crossSellProducts={crossSellProducts}
        accessoryProducts={accessoryProducts}
        upSellProducts={upSellProducts}
        relatedProducts={relatedProducts}
        pdpBanners={pdpBanners}
        kokoBranding={kokoBranding}
        kokoAvailable={kokoAvailable}
      />
    </WishlistProductProvider>
  )
}
