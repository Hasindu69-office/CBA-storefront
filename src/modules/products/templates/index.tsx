import { getProductDetail, getProductReviews } from "@lib/data/product-detail"
import { listProductCardsByIds } from "@lib/data/tabbed-sale-products"
import CbaProductDetail from "@modules/products/templates/cba-product-detail"
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
  countryCode,
  images,
  selectedVariantId,
}: ProductTemplateProps) {
  if (!product || !product.id) {
    return notFound()
  }

  const detail = await getProductDetail(product.id, selectedVariantId)
  const reviews = await getProductReviews(product.id, { limit: 5 })
  const bundleIds = uniqueRelatedIds(detail)
  const bundleProducts = await listProductCardsByIds(bundleIds).catch(() => [])

  return (
    <CbaProductDetail
      product={product}
      countryCode={countryCode}
      images={images}
      detail={detail}
      reviews={reviews}
      bundleProducts={bundleProducts.slice(0, 2)}
    />
  )
}

function uniqueRelatedIds(detail: Awaited<ReturnType<typeof getProductDetail>>) {
  if (!detail) {
    return []
  }

  const ordered = [
    ...detail.relationships.cross_sell,
    ...detail.relationships.accessory,
    ...detail.relationships.related,
  ]

  return Array.from(new Set(ordered.map((product) => product.id))).slice(0, 4)
}
