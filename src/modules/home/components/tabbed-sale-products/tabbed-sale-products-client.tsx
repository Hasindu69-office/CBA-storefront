"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BestSellingProductCard from "@modules/home/components/best-selling-products/best-selling-product-card"
import {
  HeartIcon,
  ShoppingCartIcon,
} from "@modules/layout/components/cba-icons"
import type {
  TabbedSaleBanner,
  TabbedSaleProductsVisibility,
  TabbedSaleTab,
} from "."

type TabbedSaleProductsClientProps = {
  banner: TabbedSaleBanner
  tabs: TabbedSaleTab[]
  visibility: TabbedSaleProductsVisibility
}

const TabbedSaleProductsClient = ({
  banner,
  tabs,
  visibility,
}: TabbedSaleProductsClientProps) => {
  const [activeTabKey, setActiveTabKey] = useState(tabs[0]?.key ?? "")
  const activeTab = tabs.find((tab) => tab.key === activeTabKey) ?? tabs[0] ?? null

  if (!visibility.banner && (!visibility.tabs || !activeTab)) {
    return null
  }

  return (
    <section
      className="bg-white py-8 small:py-10"
      aria-labelledby="tabbed-sale-products-title"
    >
      <div className="content-container">
        {visibility.tabs && activeTab && (
        <div className="mb-5 flex flex-col gap-4 border-b border-[#ececf1] pb-0 medium:flex-row medium:items-center medium:justify-between">
          <div
            className="no-scrollbar flex min-w-0 gap-5 overflow-x-auto"
            role="tablist"
            aria-label="Sale product groups"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={tab.key === activeTab.key}
                onClick={() => setActiveTabKey(tab.key)}
                className={`flex h-12 flex-none items-center gap-2 border-b-2 px-1 text-[15px] font-semibold transition-colors ${
                  tab.key === activeTab.key
                    ? "border-brand text-brand"
                    : "border-transparent text-[#45454f] hover:text-brand"
                }`}
              >
                <TabIcon tabKey={tab.key} />
                <span>{tab.label}</span>
                {tab.key === "new_arrivals" && (
                  <span className="rounded-full border border-[#d7d7de] px-2 py-0.5 text-[9px] font-bold uppercase leading-4 text-[#52525b]">
                    New
                  </span>
                )}
              </button>
            ))}
          </div>

          <SaleCta
            href={banner.ctaUrl}
            className="mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-[8px] border border-[#e5e7eb] bg-white px-4 text-[12px] font-bold text-[#25252c] transition-colors hover:border-brand hover:text-brand medium:mb-0 medium:w-auto medium:min-w-[150px]"
          >
            <span>View All Products</span>
            <span aria-hidden="true">›</span>
          </SaleCta>
        </div>
        )}

        {visibility.banner && (
        <div
          className="overflow-hidden rounded-[8px] border border-[#eeeeee] bg-[#fff8f4]"
          style={{
            backgroundImage: `url("${banner.backgroundUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="grid min-h-[228px] gap-4 px-6 py-6 medium:grid-cols-[1fr_320px_300px] medium:items-center medium:px-8 large:grid-cols-[1fr_420px_340px]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd7c6] bg-white px-3 py-1.5 text-[11px] font-bold uppercase text-brand shadow-sm">
                <span aria-hidden="true">ϟ</span>
                {banner.eyebrow}
              </div>
              <h2
                id="tabbed-sale-products-title"
                className="mt-4 text-[28px] font-bold leading-[1.12] tracking-normal text-black small:text-[34px]"
              >
                {banner.headline}
              </h2>
              <p className="mt-2 max-w-[520px] text-[15px] leading-6 text-[#555560]">
                {banner.description}
              </p>
              {!!banner.points.length && (
                <div className="mt-5 grid gap-3 small:grid-cols-3 medium:max-w-[500px]">
                  {banner.points.map((point) => (
                    <div
                      key={`${point.icon}-${point.label}`}
                      className="flex min-h-[48px] items-center gap-3 rounded-[8px] bg-white/80 px-3 py-2 text-[#2f2f38] shadow-sm"
                    >
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#fff0e9] text-brand">
                        <PointIcon icon={point.icon} />
                      </span>
                      <span className="text-[12px] font-semibold leading-4">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative h-[190px] medium:h-[210px]">
              {banner.imageUrl ? (
                <Image
                  src={banner.imageUrl}
                  alt={banner.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1280px) 420px, (min-width: 1024px) 320px, 80vw"
                  className="object-contain object-center"
                />
              ) : (
                <div className="h-full rounded bg-white/70" />
              )}
            </div>

            <div className="flex flex-col gap-4 medium:items-start">
              <Countdown endsAt={banner.offerEndsAt} />
              <FeaturedPrice
                product={
                  banner.product ??
                  activeTab?.products.find(
                    (item) =>
                      item.price.status === "available" &&
                      item.price.calculated_amount !== null
                  ) ??
                  null
                }
              />
              <SaleCta
                href={banner.ctaUrl}
                className="flex h-11 w-full max-w-[300px] items-center justify-center gap-2 rounded-[8px] border border-brand bg-white px-5 text-[13px] font-bold uppercase text-brand transition-colors hover:bg-brand hover:text-white"
              >
                <ShoppingCartIcon size={16} />
                {banner.ctaLabel}
              </SaleCta>
            </div>
          </div>
        </div>
        )}

        {visibility.tabs && activeTab && activeTab.products.length ? (
          <div className="mt-5 grid gap-4 small:grid-cols-2 medium:grid-cols-4">
            {activeTab.products.slice(0, 4).map((product, index) => (
              <BestSellingProductCard
                key={product.id}
                product={product}
                priority={index < 4}
              />
            ))}
          </div>
        ) : visibility.tabs ? (
          <div className="mt-5 rounded-[8px] border border-dashed border-[#dedee5] bg-white px-5 py-8 text-center">
            <p className="text-[14px] font-semibold text-[#3f3f46]">
              No products available in this tab yet.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Countdown({ endsAt }: { endsAt: string | null }) {
  const [now, setNow] = useState(() => Date.now())
  const target = endsAt ? new Date(endsAt).getTime() : null
  const remaining = target ? target - now : 0

  useEffect(() => {
    if (!target || target <= Date.now()) {
      return
    }
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [target])

  if (!target || remaining <= 0) {
    return null
  }

  const totalSeconds = Math.floor(remaining / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return (
    <div>
      <p className="text-[12px] font-semibold text-[#34343d]">Offer ends in</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <TimeBox value={hours} label="Hours" />
        <TimeBox value={minutes} label="Minutes" />
        <TimeBox value={seconds} label="Seconds" />
      </div>
    </div>
  )
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex h-[58px] min-w-[72px] flex-col items-center justify-center rounded-[8px] bg-white text-center">
      <span className="text-[22px] font-bold leading-6 text-brand">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-semibold leading-4 text-[#31313a]">
        {label}
      </span>
    </div>
  )
}

function FeaturedPrice({
  product,
}: {
  product: TabbedSaleTab["products"][number] | null
}) {
  if (!product || product.price.calculated_amount === null) {
    return null
  }

  return (
    <div>
      <p className="text-[24px] font-bold leading-8 text-black">
        {formatAmount(product.price.calculated_amount, product.price.currency_code)}
      </p>
      {product.price.original_amount !== null && product.price.has_discount && (
        <p className="text-[13px] font-medium text-[#9a9aa2] line-through">
          {formatAmount(product.price.original_amount, product.price.currency_code)}
        </p>
      )}
    </div>
  )
}

function SaleCta({
  href,
  className,
  children,
}: {
  href: string
  className: string
  children: ReactNode
}) {
  if (/^https?:\/\//i.test(href)) {
    return (
      <Link href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </Link>
    )
  }

  return (
    <LocalizedClientLink href={href} className={className}>
      {children}
    </LocalizedClientLink>
  )
}

function TabIcon({ tabKey }: { tabKey: TabbedSaleTab["key"] }) {
  if (tabKey === "new_arrivals") return <span aria-hidden="true">▣</span>
  if (tabKey === "best_sellers") return <span aria-hidden="true">♛</span>
  if (tabKey === "top_rated") return <HeartIcon size={16} />
  return <span aria-hidden="true">☆</span>
}

function PointIcon({ icon }: { icon: string }) {
  if (icon === "shield") {
    return <span aria-hidden="true">▱</span>
  }
  if (icon === "headphones") {
    return <span aria-hidden="true">◉</span>
  }
  if (icon === "rocket") {
    return <span aria-hidden="true">↗</span>
  }
  return <span aria-hidden="true">ϟ</span>
}

function formatAmount(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default TabbedSaleProductsClient
