import { sdk } from "@lib/config"

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
    variant: "background_1" | "background_2"
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
      cache: "no-store",
    })
    .then((payload) => {
      if (!payload.success) {
        throw new Error(payload.error?.message ?? "Category slider request failed.")
      }

      return payload.data.categories
    })
}
