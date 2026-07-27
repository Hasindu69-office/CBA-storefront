import type { FeaturedProductCard } from "@lib/data/featured-products"
import type {
  ProductDetailRelatedProduct,
  ProductDetailResponse,
} from "@lib/data/product-detail"
import { listProducts } from "@lib/data/products"
import { listProductRelationships } from "@lib/data/product-relationships"
import { listProductCardsByIds } from "@lib/data/tabbed-sale-products"

export const MAX_CROSS_SELL_COMPANIONS = 2
export const MAX_ACCESSORY_COMPANIONS = 4
export const MAX_UPSELL_PRODUCTS = 3
export const MAX_RELATED_PRODUCTS = 8

type RelationshipType = keyof ProductDetailResponse["relationships"]

export async function listCrossSellCompanionCards(
  detail: ProductDetailResponse | null
): Promise<FeaturedProductCard[]> {
  return listRelationshipCompanionCards(detail, "cross_sell", MAX_CROSS_SELL_COMPANIONS)
}

export async function listAccessoryCompanionCards(
  detail: ProductDetailResponse | null
): Promise<FeaturedProductCard[]> {
  return listRelationshipCompanionCards(detail, "accessory", MAX_ACCESSORY_COMPANIONS)
}

export async function listUpSellCompanionCards(
  detail: ProductDetailResponse | null
): Promise<FeaturedProductCard[]> {
  return listRelationshipCompanionCards(detail, "up_sell", MAX_UPSELL_PRODUCTS)
}

export async function listRelatedProductCards(
  productId: string,
  detail: ProductDetailResponse | null,
  {
    countryCode,
    categoryIds = [],
    limit = MAX_RELATED_PRODUCTS,
  }: {
    countryCode: string
    categoryIds?: string[]
    limit?: number
  }
): Promise<FeaturedProductCard[]> {
  const relatedProducts = await resolveRelatedProductRefs(productId, detail, {
    countryCode,
    categoryIds,
    limit,
  })

  if (!relatedProducts.length) {
    return []
  }

  const productIds = relatedProducts.map((item) => item.id)
  const cards = await resolveOrderedProductCards(
    productIds,
    buildRelationshipMapFromList(relatedProducts),
    productId
  )

  const purchasable = cards.filter(isPurchasableRelatedCard)
  if (purchasable.length) {
    return purchasable.slice(0, limit)
  }

  return cards.slice(0, limit)
}

async function resolveRelatedProductRefs(
  productId: string,
  detail: ProductDetailResponse | null,
  {
    countryCode,
    categoryIds,
    limit,
  }: {
    countryCode: string
    categoryIds: string[]
    limit: number
  }
): Promise<ProductDetailRelatedProduct[]> {
  let relatedProducts: ProductDetailRelatedProduct[] = []

  try {
    const response = await listProductRelationships(productId, {
      type: "related",
      limit,
    })
    relatedProducts = response.products
  } catch (error) {
    console.warn("[cba-pdp] Related products API request failed.", {
      productId,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  if (!relatedProducts.length && detail?.relationships.related.length) {
    relatedProducts = detail.relationships.related
  }

  if (relatedProducts.length < limit) {
    const existingIds = new Set([
      productId,
      ...relatedProducts.map((product) => product.id),
    ])
    const categoryProducts = await listCategoryRelatedProductRefs({
      countryCode,
      categoryIds,
      limit: limit - relatedProducts.length,
      excludeProductIds: existingIds,
    })
    relatedProducts = [...relatedProducts, ...categoryProducts]
  }

  return dedupeRelatedProducts(relatedProducts).slice(0, limit)
}

async function listCategoryRelatedProductRefs({
  countryCode,
  categoryIds,
  limit,
  excludeProductIds,
}: {
  countryCode: string
  categoryIds: string[]
  limit: number
  excludeProductIds: Set<string>
}): Promise<ProductDetailRelatedProduct[]> {
  const selectedCategoryIds = categoryIds.filter(Boolean).slice(0, 4)
  if (!selectedCategoryIds.length || limit <= 0) {
    return []
  }

  try {
    const { response } = await listProducts({
      countryCode,
      queryParams: {
        category_id: selectedCategoryIds,
        limit: limit + excludeProductIds.size,
        fields: "id,handle,title,thumbnail",
      },
    })

    return response.products
      .filter((product) => product.id && !excludeProductIds.has(product.id))
      .slice(0, limit)
      .map((product) => ({
        id: product.id!,
        title: product.title ?? "Product",
        handle: product.handle ?? product.id!,
        thumbnail: product.thumbnail ?? null,
      }))
  } catch (error) {
    console.warn("[cba-pdp] Category related product fallback failed.", {
      categoryIds: selectedCategoryIds,
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return []
  }
}

function dedupeRelatedProducts(products: ProductDetailRelatedProduct[]) {
  const seen = new Set<string>()
  return products.filter((product) => {
    if (!product.id || seen.has(product.id)) {
      return false
    }
    seen.add(product.id)
    return true
  })
}

function isPurchasableRelatedCard(card: FeaturedProductCard) {
  return (
    Boolean(card.default_variant?.id) &&
    card.inventory.purchasable &&
    card.price.status === "available" &&
    card.price.calculated_amount !== null
  )
}

export async function listRelationshipCompanionCards(
  detail: ProductDetailResponse | null,
  type: RelationshipType,
  limit: number
): Promise<FeaturedProductCard[]> {
  const companionIds = uniqueRelationshipIds(detail, type, limit)
  if (!companionIds.length || !detail) {
    return []
  }

  const relationshipMap = buildRelationshipMap(detail, [type])
  return resolveOrderedProductCards(companionIds, relationshipMap, detail.product_id)
}

async function resolveOrderedProductCards(
  productIds: string[],
  relationshipMap: Map<string, ProductDetailRelatedProduct>,
  sourceProductId?: string
): Promise<FeaturedProductCard[]> {
  let cards: FeaturedProductCard[] = []

  try {
    cards = await listProductCardsByIds(productIds)
  } catch (error) {
    console.warn("[cba-pdp] Failed to load relationship product cards.", {
      sourceProductId,
      productIds,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  const cardMap = new Map(cards.map((card) => [card.product_id, card]))

  return productIds
    .map((productId) => {
      const card = cardMap.get(productId)
      if (card) {
        return card
      }

      const related = relationshipMap.get(productId)
      if (!related) {
        return null
      }

      return buildUnavailableCompanionCard(related)
    })
    .filter((card): card is FeaturedProductCard => Boolean(card))
}

function uniqueRelationshipIds(
  detail: ProductDetailResponse | null,
  type: RelationshipType,
  limit: number
) {
  if (!detail) {
    return []
  }

  return Array.from(new Set(detail.relationships[type].map((product) => product.id))).slice(
    0,
    limit
  )
}

function buildRelationshipMap(
  detail: ProductDetailResponse,
  types: RelationshipType[]
) {
  const map = new Map<string, ProductDetailRelatedProduct>()

  for (const type of types) {
    for (const product of detail.relationships[type]) {
      map.set(product.id, product)
    }
  }

  return map
}

function buildRelationshipMapFromList(products: ProductDetailRelatedProduct[]) {
  return new Map(products.map((product) => [product.id, product]))
}

function buildUnavailableCompanionCard(
  related: ProductDetailRelatedProduct
): FeaturedProductCard {
  return {
    id: related.id,
    product_id: related.id,
    handle: related.handle,
    title: related.title,
    subtitle: null,
    thumbnail: related.thumbnail
      ? { url: related.thumbnail, alt: related.title }
      : null,
    brand: null,
    category: null,
    default_variant: null,
    price: {
      currency_code: "lkr",
      calculated_amount: null,
      original_amount: null,
      has_discount: false,
      discount_percentage: null,
      tax_inclusive: null,
      status: "unavailable",
      reason: "Pricing unavailable for this product.",
    },
    inventory: {
      managed: true,
      available_quantity: null,
      allow_backorder: false,
      in_stock: false,
      purchasable: false,
      status: "unavailable",
      reason: "This product is currently unavailable.",
    },
    badges: [],
    rating: null,
    compare_group_keys: [],
    updated_at: new Date(0).toISOString(),
  }
}
