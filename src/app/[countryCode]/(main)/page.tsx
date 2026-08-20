import { Metadata } from "next"

import FeaturedProductSlider from "@modules/home/components/featured-product-slider"
import BrandAutoSlider from "@modules/home/components/brand-auto-slider"
import BestSellingProductsSection from "@modules/home/components/best-selling-products"
import TopSellingProductsSection from "@modules/home/components/top-selling-products"
import InformationColumnsSection from "@modules/home/components/information-columns"
import HomepagePromoTileGrid from "@modules/home/components/promo-tile-grid"
import CategoryShowcase from "@modules/home/components/category-showcase"
import CategorySlider from "@modules/home/components/category-slider"
import HomePromoBanner from "@modules/home/components/home-promo-banner"
import Hero from "@modules/home/components/hero"
import TabbedSaleProductsSection from "@modules/home/components/tabbed-sale-products"
import { listCategorySliderItems } from "@lib/data/category-slider"
import { listCollections } from "@lib/data/collections"
import { listFeaturedProductCards } from "@lib/data/featured-products"
import { listHomepageContent } from "@lib/data/homepage"
import { getRegion } from "@lib/data/regions"
import { retrieveWishlistedProductIds } from "@lib/data/wishlist"
import { WishlistProductProvider } from "@modules/wishlist/components/wishlist-product-button"

export const metadata: Metadata = {
  title: "CBA Ebiz",
  description:
    "CBA Ebiz website",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const [
    region,
    collectionResult,
    categorySliderItems,
    homepageContent,
    featuredProducts,
    wishlistedProductIds,
  ] =
    await Promise.all([
      getRegion(countryCode),
      listCollections({
        fields: "id, handle, title",
      }),
      listCategorySliderItems().catch(() => []),
      listHomepageContent().catch(() => ({ page: null, sections: [] })),
      listFeaturedProductCards().catch(() => []),
      retrieveWishlistedProductIds({
        country_code: countryCode,
        currency_code: "lkr",
      }),
    ])

  const { collections } = collectionResult

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero sections={homepageContent.sections} />
      <WishlistProductProvider initialProductIds={wishlistedProductIds}>
        <TabbedSaleProductsSection sections={homepageContent.sections} />
        <CategorySlider categories={categorySliderItems} />
        <HomePromoBanner sections={homepageContent.sections} />
        <FeaturedProductSlider products={featuredProducts} />
        <BestSellingProductsSection sections={homepageContent.sections} />
        <TopSellingProductsSection sections={homepageContent.sections} />
      </WishlistProductProvider>
      <InformationColumnsSection sections={homepageContent.sections} />
      <BrandAutoSlider sections={homepageContent.sections} />
      <HomepagePromoTileGrid sections={homepageContent.sections} />
      <CategoryShowcase sections={homepageContent.sections} />
    </>
  )
}
