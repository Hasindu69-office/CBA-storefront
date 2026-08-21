import { Metadata } from "next"

import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Store",
  description: "Explore all of our products.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: string
    page?: string
    query?: string
    category?: string | string[]
    brand?: string | string[]
    min_price?: string
    max_price?: string
    price_range?: string
    filters?: string
    on_sale?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const {
    sortBy,
    page,
    query,
    category,
    brand,
    min_price,
    max_price,
    price_range,
    filters,
    on_sale,
  } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      query={query}
      category={category}
      brand={brand}
      minPrice={min_price}
      maxPrice={max_price}
      priceRange={price_range}
      filters={filters}
      onSale={on_sale}
      countryCode={params.countryCode}
    />
  )
}
