import { sdk } from "@lib/config"
import { PUBLIC_CACHE_TAGS, publicContentFetchOptions } from "./public-cache"

export type CategorySliderItem = {
  id: string
  name: string
  handle: string
  description: string | null
  image: {
    url: string
    alt: string
  }
  background: {
    variant: "background_1" | "background_2" | "custom"
    url: string
  }
  sort_order: number
  rank: number | null
}

type CategorySliderResponse =
  | {
      success: true
      data: {
        categories: CategorySliderItem[]
        count: number
      }
    }
  | {
      success: false
      error: {
        message: string
      }
    }

export const listCategorySliderItems = async () => {
  return sdk.client
    .fetch<CategorySliderResponse>("/store/cba/v1/categories/slider", {
      ...publicContentFetchOptions([PUBLIC_CACHE_TAGS.categorySlider]),
    })
    .then((payload) => {
      if (!payload.success) {
        throw new Error(payload.error?.message ?? "Category slider request failed.")
      }

      return payload.data.categories
    })
}
