import { listStoreSearchSuggestions, searchStoreProducts } from "@lib/data/store-search"
import { getStoreCountryCode } from "@lib/util/routes"
import { NextResponse } from "next/server"

const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 120
const PRODUCT_LIMIT = 4
const SUGGESTION_LIMIT = 6

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = normalizeQuery(url.searchParams.get("q"))

  if (!query) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Search query must be between 2 and 120 characters." },
      },
      { status: 400 }
    )
  }

  const countryCode = getStoreCountryCode(url.searchParams.get("country_code"))

  const [suggestionsResult, productsResult] = await Promise.allSettled([
    listStoreSearchSuggestions({ q: query, limit: SUGGESTION_LIMIT }),
    searchStoreProducts({
      q: query,
      countryCode,
      limit: PRODUCT_LIMIT,
      page: 1,
      sort: "relevance",
    }),
  ])

  if (
    suggestionsResult.status === "rejected" &&
    productsResult.status === "rejected"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Search autocomplete is unavailable." },
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      suggestions:
        suggestionsResult.status === "fulfilled"
          ? uniqueSuggestions(suggestionsResult.value, query)
          : [],
      products:
        productsResult.status === "fulfilled"
          ? productsResult.value.products.slice(0, PRODUCT_LIMIT)
          : [],
    },
  })
}

function normalizeQuery(value: string | null) {
  const query = value?.trim()
  if (!query || query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return null
  }
  return query
}

function uniqueSuggestions(values: string[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  const seen = new Set<string>()

  return values
    .map((value) => value.trim())
    .filter((value) => {
      const key = value.toLowerCase()
      if (!value || key === normalizedQuery || seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
    .slice(0, SUGGESTION_LIMIT)
}
