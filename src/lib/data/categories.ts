import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

export const listCategories = async (query?: Record<string, any>) => {
  const limit = query?.limit || 100
  const fetchPage = (offset: number) =>
    sdk.client.fetch<{
      product_categories: HttpTypes.StoreProductCategory[]
      count: number
    }>("/store/product-categories", {
      query: {
        fields:
          "*category_children, *products, *parent_category, *parent_category.parent_category",
        limit,
        offset,
        ...query,
      },
      cache: "no-store",
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
}

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
