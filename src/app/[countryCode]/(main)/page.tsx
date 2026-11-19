import { Metadata } from "next"
import { Suspense } from "react"

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
import HomeSectionSkeleton from "@modules/home/components/section-skeleton"
import TabbedSaleProductsSection from "@modules/home/components/tabbed-sale-products"
import { listCategorySliderItems } from "@lib/data/category-slider"
import { listFeaturedProductCards } from "@lib/data/featured-products"
import { listHomepageContent } from "@lib/data/homepage"
import {
  retrieveKokoCheckoutBranding,
  retrieveKokoPaymentAvailability,
} from "@lib/data/koko-branding"
import { getRegion } from "@lib/data/regions"
import { retrieveWishlistedProductIds } from "@lib/data/wishlist"
import { WishlistProductProvider } from "@modules/wishlist/components/wishlist-product-button"

export const metadata: Metadata = {
  title: "CBA Ebiz",
  description: "CBA Ebiz website",
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const regionPromise = getRegion(countryCode)

  const [
    region,
    categorySliderItems,
    homepageContent,
    featuredProducts,
    wishlistedProductIds,
    kokoBranding,
    kokoAvailable,
  ] = await Promise.all([
    regionPromise,
    listCategorySliderItems().catch(() => []),
    listHomepageContent().catch(() => ({ page: null, sections: [] })),
    listFeaturedProductCards().catch(() => []),
    retrieveWishlistedProductIds({
      country_code: countryCode,
      currency_code: "lkr",
    }),
    retrieveKokoCheckoutBranding(),
    regionPromise.then((resolvedRegion) =>
      resolvedRegion?.id
        ? retrieveKokoPaymentAvailability(resolvedRegion.id)
        : Promise.resolve(false)
    ),
  ])

  if (!region) {
    return null
  }

  return (
    <>
      <Hero sections={homepageContent.sections} />
      <WishlistProductProvider initialProductIds={wishlistedProductIds}>
        <Suspense
          fallback={<HomeSectionSkeleton label="Loading sale products" />}
        >
          <TabbedSaleProductsSection
            sections={homepageContent.sections}
            featuredProducts={featuredProducts}
            kokoBranding={kokoBranding}
            kokoAvailable={kokoAvailable}
          />
        </Suspense>
        <CategorySlider categories={categorySliderItems} />
        <HomePromoBanner sections={homepageContent.sections} />
        <FeaturedProductSlider
          products={featuredProducts}
          mobileCompactCards
          priorityImageCount={1}
          kokoBranding={kokoBranding}
          kokoAvailable={kokoAvailable}
        />
        <Suspense
          fallback={<HomeSectionSkeleton label="Loading best selling products" />}
        >
          <BestSellingProductsSection
            sections={homepageContent.sections}
            kokoBranding={kokoBranding}
            kokoAvailable={kokoAvailable}
          />
        </Suspense>
        <Suspense
          fallback={<HomeSectionSkeleton label="Loading top selling products" />}
        >
          <TopSellingProductsSection
            sections={homepageContent.sections}
            kokoBranding={kokoBranding}
            kokoAvailable={kokoAvailable}
          />
        </Suspense>
      </WishlistProductProvider>
      <InformationColumnsSection sections={homepageContent.sections} />
      <Suspense fallback={<HomeSectionSkeleton className="bg-white pb-6 pt-1.5 sm:pb-7 md:pb-8 small:pb-10 small:pt-2" label="Loading brands" />}>
        <BrandAutoSlider sections={homepageContent.sections} />
      </Suspense>
      <HomepagePromoTileGrid sections={homepageContent.sections} />
      <CategoryShowcase sections={homepageContent.sections} />
    </>
  )
}
