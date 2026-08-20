import { Suspense } from "react"

import { listStoreBrands } from "@lib/data/brands"
import { listCategories } from "@lib/data/categories"
import { listShopPageContent } from "@lib/data/shop-banner"
import {
  listStoreSearchFacets,
  parseStoreMultiSelectParam,
  parseStoreFilters,
  parseStorePage,
  parseStorePriceBound,
  parseStoreSearchSort,
  searchStoreProducts,
  StoreSearchResult,
  StoreSearchSort,
} from "@lib/data/store-search"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import ShopFilterPanel, {
  ShopSortSelect,
  StoreMobileFilterDrawer,
} from "@modules/store/components/shop-filter-panel"

import PaginatedProducts from "./paginated-products"

const PRODUCT_LIMIT = 20

const StoreTemplate = async ({
  sortBy,
  page,
  query,
  category,
  brand,
  minPrice,
  maxPrice,
  priceRange,
  filters,
  countryCode,
}: {
  sortBy?: string
  page?: string
  query?: string
  category?: string | string[]
  brand?: string | string[]
  minPrice?: string
  maxPrice?: string
  priceRange?: string
  filters?: string
  countryCode: string
}) => {
  const pageNumber = parseStorePage(page)
  const sort = parseStoreSearchSort(sortBy)
  const selectedCategories = parseStoreMultiSelectParam(category)
  const selectedBrands = parseStoreMultiSelectParam(brand)
  const selectedFilters = parseStoreFilters(filters)
  const selectedMinPrice = parseStorePriceBound(minPrice)
  const selectedMaxPrice = parseStorePriceBound(maxPrice)

  const productSearchPromise = searchStoreProducts({
    q: query,
    page: pageNumber,
    limit: PRODUCT_LIMIT,
    sort,
    category: selectedCategories,
    brand: selectedBrands,
    minPrice: selectedMinPrice,
    maxPrice: selectedMaxPrice,
    filters: selectedFilters,
    countryCode,
  })
    .then((data) => ({ data, error: null }))
    .catch((error) => ({
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Products could not be loaded.",
    }))

  const [shopContent, categories, brands, facets, productSearch] = await Promise.all([
    listShopPageContent(),
    listCategories().catch(() => []),
    listStoreBrands().catch(() => []),
    listStoreSearchFacets({
      q: query,
      category: selectedCategories,
      brand: selectedBrands,
    }).catch(() => []),
    productSearchPromise,
  ])

  const searchResult = productSearch.data as StoreSearchResult | null
  const banner = shopContent.banner
  const resultCount = searchResult?.count ?? 0
  const selectedPriceRangeMax = parseStorePriceBound(priceRange)
  const priceRangeMax = Math.max(
    selectedPriceRangeMax ?? 0,
    roundPriceRangeMax(searchResult?.price_range?.max),
    selectedMaxPrice ?? 0
  )
  const start = resultCount ? (pageNumber - 1) * PRODUCT_LIMIT + 1 : 0
  const end = Math.min(pageNumber * PRODUCT_LIMIT, resultCount)

  return (
    <main className="bg-white pb-14">
      <div className="content-container pt-8">
        <section
          className="relative min-h-[184px] overflow-hidden rounded-[8px] bg-[#fbfbfb] bg-cover bg-[position:62%_center] px-5 py-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)] xsmall:min-h-[204px] xsmall:bg-[position:70%_center] xsmall:px-7 xsmall:py-6 small:min-h-[214px] small:bg-center small:px-11 small:py-9"
          style={{ backgroundImage: `url("${banner.backgroundImageUrl}")` }}
          aria-label={banner.backgroundAltText}
        >
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2.5 text-[12px] font-medium leading-5 text-[#1f1f22] xsmall:gap-3 xsmall:text-[13px]"
          >
            <LocalizedClientLink
              href="/"
              className="transition-colors hover:text-brand"
            >
              Home
            </LocalizedClientLink>
            <span className="text-[#a1a1aa]">/</span>
            <span className="font-bold">{banner.breadcrumbLabel}</span>
          </nav>

          <div className="mt-7 max-w-[230px] xsmall:mt-8 xsmall:max-w-[330px] small:max-w-[430px]">
            <h1
              data-testid="store-page-title"
              className="text-[28px] font-bold leading-[34px] tracking-normal text-black xsmall:text-[30px] xsmall:leading-[38px] small:text-[34px]"
            >
              {banner.title}
            </h1>
            <p className="mt-2 text-[14px] leading-[22px] text-[#18181b] xsmall:text-[15px] xsmall:leading-6">
              {banner.subtitle}
            </p>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-6 small:flex-row small:items-start">
          <div className="hidden small:block">
            <ShopFilterPanel
              categories={categories.filter((item) => !item.parent_category)}
              brands={brands}
              facets={facets}
              selectedCategory={selectedCategories}
              selectedBrand={selectedBrands}
              selectedMinPrice={selectedMinPrice}
              selectedMaxPrice={selectedMaxPrice}
              priceRangeMax={priceRangeMax}
              selectedFilters={selectedFilters}
              sidebarPromo={shopContent.sidebarPromo}
            />
          </div>

          <section className="min-w-0 flex-1">
            <StoreMobileFilterDrawer
              categories={categories.filter((item) => !item.parent_category)}
              brands={brands}
              facets={facets}
              selectedCategory={selectedCategories}
              selectedBrand={selectedBrands}
              selectedMinPrice={selectedMinPrice}
              selectedMaxPrice={selectedMaxPrice}
              priceRangeMax={priceRangeMax}
              selectedFilters={selectedFilters}
              resultCount={resultCount}
            />

            <div className="mb-6 flex flex-col gap-4 small:flex-row small:items-center small:justify-between">
              <p className="text-[15px] leading-6 text-[#6f6f76]">
                <span className="font-bold text-black">
                  {start} - {end}
                </span>{" "}
                of {resultCount} results
              </p>
              <ShopSortSelect sortBy={sort as StoreSearchSort} />
            </div>

            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                query={query}
                category={selectedCategories}
                brand={selectedBrands}
                minPrice={selectedMinPrice}
                maxPrice={selectedMaxPrice}
                filters={selectedFilters}
                searchResult={searchResult ?? undefined}
                searchError={productSearch.error ?? undefined}
                countryCode={countryCode}
              />
            </Suspense>
          </section>
        </div>
      </div>
    </main>
  )
}

export default StoreTemplate

function roundPriceRangeMax(value?: number | null) {
  if (!value || value <= 0) {
    return 1000000
  }
  const magnitude = Math.pow(10, Math.max(1, String(Math.floor(value)).length - 1))
  return Math.ceil(value / magnitude) * magnitude
}
