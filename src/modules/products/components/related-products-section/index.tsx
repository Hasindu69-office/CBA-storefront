import type { FeaturedProductCard } from "@lib/data/featured-products"
import type { KokoCheckoutBranding } from "@lib/data/koko-branding"
import FeaturedProductSlider from "@modules/home/components/featured-product-slider"

type RelatedProductsSectionProps = {
  products: FeaturedProductCard[]
  kokoBranding?: KokoCheckoutBranding | null
  kokoAvailable?: boolean
}

export default function RelatedProductsSection({
  products,
  kokoBranding,
  kokoAvailable = false,
}: RelatedProductsSectionProps) {
  return (
    <FeaturedProductSlider
      products={products}
      title="Related Products"
      description="Customers also viewed these products."
      ctaLabel={null}
      ctaHref={null}
      titleId="related-products-title"
      embedded
      mobileCompactCards
      sectionClassName="mt-12 border-t border-gray-200 pt-10 pb-10 max-[399px]:pb-10 small:pb-0"
      kokoBranding={kokoBranding}
      kokoAvailable={kokoAvailable}
    />
  )
}
