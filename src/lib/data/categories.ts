import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import { PUBLIC_CACHE_TAGS, publicContentFetchOptions } from "./public-cache"

/** Fields needed for nav/footer category trees — never expand *products here. */
const NAV_CATEGORY_FIELDS =
  "id,name,handle,parent_category_id,parent_category.id,parent_category.name,parent_category.handle,*category_children"

export const listCategories = cache(async (query?: Record<string, any>) => {
  const limit = query?.limit || 100
  const fetchPage = (offset: number) =>
    sdk.client.fetch<{
      product_categories: HttpTypes.StoreProductCategory[]
      count: number
    }>("/store/product-categories", {
      query: {
        fields: NAV_CATEGORY_FIELDS,
        limit,
        offset,
        ...query,
      },
      ...publicContentFetchOptions([PUBLIC_CACHE_TAGS.productCategories]),
    })

  const firstPage = await fetchPage(query?.offset ?? 0)
  if (query) {
    return firstPage.product_categories
  }

  const categories = [...firstPage.product_categories]
  for (let offset = limit; offset < firstPage.count; offset += limit) {
    const page = await fetchPage(offset)
    categories.push(...page.product_categories)
  }

  return categories
})

export const getCategoryByHandle = async (categoryHandle: string[]) => {
  const handle = `${categoryHandle.join("/")}`

  return sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      `/store/product-categories`,
      {
        query: {
          fields: "*category_children, *products",
          handle,
        },
        cache: "no-store",
      }
    )
    .then(({ product_categories }) => product_categories[0])
}
