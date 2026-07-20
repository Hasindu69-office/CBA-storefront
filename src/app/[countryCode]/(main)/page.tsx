import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import CategorySlider from "@modules/home/components/category-slider"
import Hero from "@modules/home/components/hero"
import { listCategorySliderItems } from "@lib/data/category-slider"
import { listCollections } from "@lib/data/collections"
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

  const [region, collectionResult, categorySliderItems] = await Promise.all([
    getRegion(countryCode),
    listCollections({
      fields: "id, handle, title",
    }),
    listCategorySliderItems().catch(() => []),
  ])

  const { collections } = collectionResult

  if (!collections || !region) {
    return null
  }

  return (
    <>
      <Hero />
      <CategorySlider categories={categorySliderItems} />
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}
