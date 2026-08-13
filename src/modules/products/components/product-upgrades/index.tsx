import type { FeaturedProductCard } from "@lib/data/featured-products"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"

type ProductUpgradesProps = {
  products: FeaturedProductCard[]
}

export default function ProductUpgrades({ products }: ProductUpgradesProps) {
  if (!products.length) {
    return null
  }

  return (
    <section className="rounded-rounded border border-gray-200 p-7">
      <h2 className="text-lg font-black uppercase">Upgrade Options</h2>
      <p className="mt-2 text-sm text-gray-500">
        Explore premium alternatives to this product.
      </p>

      <div className="mt-6 grid gap-4 small:grid-cols-2 medium:grid-cols-3">
        {products.map((item) => (
          <UpgradeCard key={item.id} product={item} />
        ))}
      </div>
    </section>
  )
}

function UpgradeCard({ product }: { product: FeaturedProductCard }) {
  const price =
    product.price.calculated_amount !== null
      ? convertToLocale({
          amount: product.price.calculated_amount,
          currency_code: product.price.currency_code,
        })
      : null

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group flex gap-4 rounded-base border border-gray-100 p-4 transition-colors hover:border-brand/40 hover:bg-[#fafbfd]"
    >
      <div className="relative h-20 w-20 shrink-0 rounded-base bg-gray-50">
        {product.thumbnail?.url ? (
          <Image
            src={product.thumbnail.url}
            alt={product.thumbnail.alt || product.title}
            fill
            sizes="80px"
            className="object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-bold text-gray-900 group-hover:text-brand">
          {product.title}
        </p>
        {price && <p className="mt-2 text-sm font-black text-brand">{price}</p>}
        <p className="mt-2 text-xs font-semibold uppercase text-gray-500 group-hover:text-brand">
          View product
        </p>
      </div>
    </LocalizedClientLink>
  )
}
