import type { FeaturedProductCard } from "@lib/data/featured-products"
import FeaturedProductSlider from "@modules/home/components/featured-product-slider"

type RelatedProductsSectionProps = {
  products: FeaturedProductCard[]
}

export default function RelatedProductsSection({
  products,
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
    />
  )
}
