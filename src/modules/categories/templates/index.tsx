import { notFound } from "next/navigation"
import { Suspense } from "react"

import { listStoreBrands } from "@lib/data/brands"
import { listCategories } from "@lib/data/categories"
import { listShopPageContent } from "@lib/data/shop-banner"
import {
  listStoreSearchFacets,
  parseStoreFilters,
  parseStorePage,
  parseStorePriceBound,
  parseStoreSearchSort,
  searchStoreProducts,
  StoreSearchResult,
  StoreSearchSort,
} from "@lib/data/store-search"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import ShopFilterPanel, {
  ShopSortSelect,
} from "@modules/store/components/shop-filter-panel"
import PaginatedProducts from "@modules/store/templates/paginated-products"

const PRODUCT_LIMIT = 20

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  query,
  selectedCategory,
  brand,
  minPrice,
  maxPrice,
  priceRange,
  filters,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: string
  page?: string
  query?: string
  selectedCategory?: string
  brand?: string
  minPrice?: string
  maxPrice?: string
  priceRange?: string
  filters?: string
  countryCode: string
}) {
  if (!category || !countryCode) notFound()

  const pageNumber = parseStorePage(page)
  const sort = parseStoreSearchSort(sortBy)
  const activeCategory = selectedCategory || category.id
  const selectedFilters = parseStoreFilters(filters)
  const selectedMinPrice = parseStorePriceBound(minPrice)
  const selectedMaxPrice = parseStorePriceBound(maxPrice)

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  const productSearchPromise = searchStoreProducts({
    q: query,
    page: pageNumber,
    limit: PRODUCT_LIMIT,
    sort,
    category: activeCategory,
    brand,
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

  const [shopContent, categories, brands, facets, productSearch] =
    await Promise.all([
      listShopPageContent(),
      listCategories().catch(() => []),
      listStoreBrands().catch(() => []),
      listStoreSearchFacets({
        q: query,
        category: activeCategory,
        brand,
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
  const breadcrumbs = parents.slice().reverse()

  return (
    <main className="bg-white pb-14" data-testid="category-container">
      <div className="content-container pt-8">
        <section
          className="relative min-h-[214px] overflow-hidden rounded-[8px] bg-[#fbfbfb] bg-cover bg-center px-8 py-7 shadow-[0_18px_50px_rgba(0,0,0,0.06)] small:px-11 small:py-9"
          style={{ backgroundImage: `url("${banner.backgroundImageUrl}")` }}
          aria-label={category.name}
        >
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-3 text-[13px] font-medium leading-5 text-[#1f1f22]"
          >
            <LocalizedClientLink
              href="/"
              className="transition-colors hover:text-brand"
            >
              Home
            </LocalizedClientLink>
            <span className="text-[#a1a1aa]">/</span>
            <LocalizedClientLink
              href="/store"
              className="transition-colors hover:text-brand"
            >
              {banner.breadcrumbLabel}
            </LocalizedClientLink>
            {breadcrumbs.map((parent) => (
              <span key={parent.id} className="contents">
                <span className="text-[#a1a1aa]">/</span>
                <LocalizedClientLink
                  href={`/categories/${parent.handle}`}
                  className="transition-colors hover:text-brand"
                >
                  {parent.name}
                </LocalizedClientLink>
              </span>
            ))}
            <span className="text-[#a1a1aa]">/</span>
            <span className="font-bold">{category.name}</span>
          </nav>

          <div className="mt-8 max-w-[430px]">
            <h1
              data-testid="category-page-title"
              className="text-[30px] font-bold leading-[38px] tracking-normal text-black small:text-[34px]"
            >
              {category.name}
            </h1>
            <p className="mt-2 text-[15px] leading-6 text-[#18181b]">
              {category.description || banner.subtitle}
            </p>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-6 small:flex-row small:items-start">
          <ShopFilterPanel
            categories={categories.filter((item) => !item.parent_category)}
            brands={brands}
            facets={facets}
            selectedCategory={activeCategory}
            selectedBrand={brand}
            selectedMinPrice={selectedMinPrice}
            selectedMaxPrice={selectedMaxPrice}
            priceRangeMax={priceRangeMax}
            selectedFilters={selectedFilters}
            sidebarPromo={shopContent.sidebarPromo}
          />

          <section className="min-w-0 flex-1">
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
                category={activeCategory}
                brand={brand}
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

function roundPriceRangeMax(value?: number | null) {
  if (!value || value <= 0) {
    return 1000000
  }
  const magnitude = Math.pow(10, Math.max(1, String(Math.floor(value)).length - 1))
  return Math.ceil(value / magnitude) * magnitude
}
