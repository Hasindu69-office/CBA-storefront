import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import FeaturedProductSlider from "@modules/home/components/featured-product-slider"
import CategorySlider from "@modules/home/components/category-slider"
import HomePromoBanner from "@modules/home/components/home-promo-banner"
import Hero from "@modules/home/components/hero"
import { listCategorySliderItems } from "@lib/data/category-slider"
import { listCollections } from "@lib/data/collections"
import { listFeaturedProductCards } from "@lib/data/featured-products"
import { listHomepageContent } from "@lib/data/homepage"
import { getRegion } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Medusa Next.js Starter Template",
  description:
    "A performant frontend ecommerce starter template with Next.js 15 and Medusa.",
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
  ] =
    await Promise.all([
      getRegion(countryCode),
      listCollections({
        fields: "id, handle, title",
      }),
      listCategorySliderItems().catch(() => []),
      listHomepageContent().catch(() => ({ page: null, sections: [] })),
      listFeaturedProductCards().catch(() => []),
    ])

  const { collections } = collectionResult

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <CategorySlider categories={categorySliderItems} />
      <HomePromoBanner sections={homepageContent.sections} />
      <FeaturedProductSlider products={featuredProducts} />
      <div>
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
