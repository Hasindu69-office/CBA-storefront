import { listProductsWithSort } from "@lib/data/products"
import {
  retrieveKokoCheckoutBranding,
  retrieveKokoPaymentAvailability,
} from "@lib/data/koko-branding"
import { getRegion } from "@lib/data/regions"
import {
  searchStoreProducts,
  StoreSearchFilters,
  StoreSearchResult,
  StoreSearchSort,
} from "@lib/data/store-search"
import BestSellingProductCard from "@modules/home/components/best-selling-products/best-selling-product-card"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions as LegacySortOptions } from "@modules/store/components/refinement-list/sort-products"

const STORE_PRODUCT_LIMIT = 20
const LEGACY_PRODUCT_LIMIT = 12

type LegacyPaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  query,
  category,
  brand,
  minPrice,
  maxPrice,
  filters,
  onSale,
  searchResult,
  searchError,
  countryCode,
}: {
  sortBy?: StoreSearchSort | LegacySortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  query?: string
  category?: string | string[]
  brand?: string | string[]
  minPrice?: number
  maxPrice?: number
  filters?: StoreSearchFilters
  onSale?: boolean
  searchResult?: StoreSearchResult
  searchError?: string
  countryCode: string
}) {
  if (collectionId || categoryId || productsIds) {
    return (
      <LegacyPaginatedProducts
        sortBy={(sortBy as LegacySortOptions) ?? "created_at"}
        page={page}
        collectionId={collectionId}
        categoryId={categoryId}
        productsIds={productsIds}
        countryCode={countryCode}
      />
    )
  }

  try {
    if (searchError) {
      throw new Error(searchError)
    }
    const { products, count } =
      searchResult ??
      (await searchStoreProducts({
        q: query,
        page,
        limit: STORE_PRODUCT_LIMIT,
        sort: (sortBy as StoreSearchSort) ?? "relevance",
        category,
        brand,
        minPrice,
        maxPrice,
        filters: filters ?? {},
        onSale,
        countryCode,
      }))
    const totalPages = Math.ceil(count / STORE_PRODUCT_LIMIT)
    const region = await getRegion(countryCode)
    const [kokoBranding, kokoAvailable] = region
      ? await Promise.all([
          retrieveKokoCheckoutBranding(),
          retrieveKokoPaymentAvailability(region.id),
        ])
      : [null, false] as const

    if (!products.length) {
      return (
        <div className="flex min-h-[260px] items-center justify-center rounded-[8px] border border-[#eeeeee] bg-white px-6 text-center">
          <div>
            <h2 className="text-[20px] font-bold leading-7 text-black">
              No products found
            </h2>
            <p className="mt-2 text-[14px] leading-6 text-[#6f6f76]">
              Try removing a filter or searching for a different product.
            </p>
          </div>
        </div>
      )
    }

    return (
      <>
        <ul
          className="grid w-full grid-cols-2 items-stretch gap-3 small:grid-cols-3 small:gap-4 medium:grid-cols-5"
          data-testid="products-list"
        >
          {products.map((product, index) => (
            <li key={product.id} className="flex h-full w-full min-w-0">
              <BestSellingProductCard
                product={product}
                priority={index < 5}
                variant="flat"
                kokoBranding={kokoBranding}
                kokoAvailable={kokoAvailable}
              />
            </li>
          ))}
        </ul>
        {totalPages > 1 && (
          <Pagination
            data-testid="product-pagination"
            page={page}
            totalPages={totalPages}
          />
        )}
      </>
    )
  } catch (error) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-[8px] border border-[#ffd8d1] bg-[#fff7f5] px-6 text-center">
        <div>
          <h2 className="text-[20px] font-bold leading-7 text-black">
            Products could not be loaded
          </h2>
          <p className="mt-2 text-[14px] leading-6 text-[#6f6f76]">
            {error instanceof Error
              ? error.message
              : "Please refresh the page or try again shortly."}
          </p>
        </div>
      </div>
    )
  }
}

async function LegacyPaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
}: {
  sortBy?: LegacySortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
}) {
  const queryParams: LegacyPaginatedProductsParams = {
    limit: LEGACY_PRODUCT_LIMIT,
  }

  if (collectionId) {
    queryParams.collection_id = [collectionId]
  }

  if (categoryId) {
    queryParams.category_id = [categoryId]
  }

  if (productsIds) {
    queryParams.id = productsIds
  }

  if (sortBy === "created_at") {
    queryParams.order = "created_at"
  }

  const region = await getRegion(countryCode)
  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / LEGACY_PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8"
        data-testid="products-list"
      >
        {products.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
