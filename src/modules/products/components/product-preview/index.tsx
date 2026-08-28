import { Text } from "@medusajs/ui"
import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import type { VariantPrice } from "types/global"
import { kokoInstallmentCardLabelFromAmount } from "@lib/util/koko-installments"
import {
  retrieveKokoCheckoutBranding,
  retrieveKokoPaymentAvailability,
} from "@lib/data/koko-branding"
import KokoCardPaymentLine from "@modules/common/components/koko-card-payment-line"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })
  const [kokoBranding, kokoAvailable] = await Promise.all([
    retrieveKokoCheckoutBranding(),
    retrieveKokoPaymentAvailability(region.id),
  ])
  const kokoInstallment =
    kokoAvailable && isProductPurchasable(product)
      ? kokoInstallmentCardLabelFromAmount(
          cheapestPrice?.calculated_price_number,
          cheapestPrice?.currency_code
        )
      : null

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div data-testid="product-wrapper">
        <div className="relative">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
          <DiscountPercentageBadge price={cheapestPrice} compact={!isFeatured} />
        </div>
        <div className="txt-compact-medium mt-4">
          <div className="flex justify-between gap-3">
            <Text className="text-ui-fg-subtle" data-testid="product-title">
              {product.title}
            </Text>
            <div className="flex shrink-0 items-center gap-x-2">
              {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
            </div>
          </div>
          {kokoInstallment && (
            <KokoCardPaymentLine
              amount={kokoInstallment}
              branding={kokoBranding}
              className="mt-2 text-[12px] leading-5"
            />
          )}
        </div>
      </div>
    </LocalizedClientLink>
  )
}

function isProductPurchasable(product: HttpTypes.StoreProduct) {
  return Boolean(
    product.variants?.some((variant) =>
      !variant.manage_inventory ||
      variant.allow_backorder ||
      (variant.inventory_quantity ?? 0) > 0
    )
  )
}

function DiscountPercentageBadge({
  price,
  compact,
}: {
  price: VariantPrice | null
  compact: boolean
}) {
  const percentage = Number(price?.percentage_diff)

  if (price?.price_type !== "sale" || !Number.isFinite(percentage) || percentage <= 0) {
    return null
  }

  return (
    <div
      className={`absolute z-10 flex flex-col items-center justify-center rounded-full bg-[#ff2d55] text-center text-white shadow-[0_10px_24px_rgba(255,45,85,0.28)] ${
        compact
          ? "right-3 top-3 h-[42px] w-[42px]"
          : "right-4 top-4 h-[52px] w-[52px] small:right-5 small:top-5"
      }`}
    >
      <span
        className={`font-bold ${
          compact ? "text-[13px] leading-[14px]" : "text-[15px] leading-4"
        }`}
      >
        {price.percentage_diff}%
      </span>
      <span
        className={`font-bold uppercase ${
          compact ? "text-[8px] leading-[10px]" : "text-[9px] leading-[11px]"
        }`}
      >
        Off
      </span>
    </div>
  )
}
