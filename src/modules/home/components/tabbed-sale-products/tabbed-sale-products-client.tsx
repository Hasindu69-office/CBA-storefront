"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { FeaturedProductCardItem } from "@modules/home/components/featured-product-slider"
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
      <div className="content-container flex flex-col">
        {visibility.tabs && activeTab && (
        <div
          className={`order-2 mb-5 flex flex-col gap-4 border-b border-[#ececf1] pb-0 medium:order-1 medium:flex-row medium:items-center medium:justify-between ${
            visibility.banner ? "mt-5 medium:mt-0" : ""
          }`}
        >
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
            className="mb-3 flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-white px-4 text-[12px] font-bold text-[#25252c] transition-colors hover:text-brand medium:mb-0 medium:w-auto medium:min-w-[150px]"
          >
            <span>View All Products</span>
            <span aria-hidden="true">›</span>
          </SaleCta>
        </div>
        )}

        {visibility.banner && (
        <div
          className="order-1 overflow-hidden rounded-[8px] border border-[#eeeeee] bg-[#fff8f4] medium:order-2"
          style={{
            backgroundImage: `url("${banner.backgroundUrl}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="grid min-h-[228px] gap-4 px-6 py-6 medium:grid-cols-[36%_30%_34%] medium:items-center medium:px-8 large:grid-cols-[34%_32%_34%]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#ffd7c6] bg-white px-3 py-1.5 text-[11px] font-bold uppercase text-brand shadow-sm">
                <span aria-hidden="true">ϟ</span>
                {banner.eyebrow}
              </div>
              <h2
                id="tabbed-sale-products-title"
                className="mt-4 text-[28px] font-bold leading-[1.12] tracking-normal text-black small:text-[32px] medium:whitespace-nowrap large:text-[34px]"
              >
                {banner.headline}
              </h2>
              <p className="mt-2 max-w-[520px] text-[14px] leading-6 text-[#555560] small:text-[15px]">
                {banner.description}
              </p>
              {!!banner.points.length && (
                <div className="mt-5 flex flex-nowrap items-center gap-x-3 overflow-hidden medium:max-w-[500px] large:gap-x-4">
                  {banner.points.map((point) => (
                    <div
                      key={`${point.icon}-${point.label}`}
                      className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2.5 text-[#2f2f38]"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#fff0e9] text-brand">
                        <PointIcon icon={point.icon} />
                      </span>
                      <span className="min-w-0 text-[11px] font-semibold leading-[15px] large:text-[12px] large:leading-4">
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
              <FeaturedPrice product={banner.product} />
              <SaleCta
                href={banner.productUrl ?? banner.ctaUrl}
                className="flex h-11 w-full max-w-[300px] items-center justify-center gap-2 rounded-[8px] border border-black bg-white px-5 text-[13px] font-bold uppercase text-black transition-colors hover:bg-black hover:text-white"
              >
                <ShoppingCartIcon size={16} />
                {banner.ctaLabel}
              </SaleCta>
            </div>
          </div>
        </div>
        )}

        {visibility.tabs && activeTab && activeTab.products.length ? (
          <div className="order-3 mt-5 grid grid-cols-2 gap-3 small:gap-4 medium:grid-cols-5">
            {activeTab.products.slice(0, 5).map((product, index) => (
              <FeaturedProductCardItem
                key={product.id}
                product={product}
                priority={index < 5}
                mobileCompact
              />
            ))}
          </div>
        ) : visibility.tabs ? (
          <div className="order-3 mt-5 rounded-[8px] border border-dashed border-[#dedee5] bg-white px-5 py-8 text-center">
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
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const hasDays = days > 0

  return (
    <div>
      <p className="text-[12px] font-semibold text-[#34343d]">Offer ends in</p>
      <div className={`mt-2 grid gap-2 ${hasDays ? "grid-cols-4" : "grid-cols-3"}`}>
        {hasDays && <TimeBox value={days} label="Days" />}
        <TimeBox value={hours} label="Hours" />
        <TimeBox value={minutes} label="Minutes" />
        <TimeBox value={seconds} label="Seconds" />
      </div>
    </div>
  )
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex h-[58px] min-w-[72px] flex-col items-center justify-center rounded-[8px] bg-[#fef2ea] text-center">
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
    <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
      <p className="whitespace-nowrap text-[24px] font-bold leading-8 text-black">
        {formatAmount(product.price.calculated_amount, product.price.currency_code)}
      </p>
      {product.price.original_amount !== null && product.price.has_discount && (
        <p className="whitespace-nowrap text-[13px] font-medium text-[#9a9aa2] line-through">
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
    return <ShieldCheckIcon />
  }
  if (icon === "headphones") {
    return <HeadsetIcon />
  }
  if (icon === "rocket") {
    return <RocketIcon />
  }
  return <LightningIcon />
}

const pointIconProps = {
  "aria-hidden": true,
  className: "h-[18px] w-[18px]",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

function RocketIcon() {
  return (
    <svg {...pointIconProps}>
      <path d="M4.5 16.5c-1 1-1.3 3-.8 3.8.8.5 2.8.2 3.8-.8" />
      <path d="M8 16 5.5 13.5c.9-2.5 2.7-4.1 5.3-4.8l4.5-4.5c1.5-1.5 3.6-2 5.7-1.4.6 2.1.1 4.2-1.4 5.7L15 13c-.7 2.6-2.3 4.4-4.8 5.3L8 16Z" />
      <circle cx="15.5" cy="8.5" r="1.6" />
    </svg>
  )
}

function ShieldCheckIcon() {
  return (
    <svg {...pointIconProps}>
      <path d="M12 3.2 19 6v5.1c0 4.4-2.8 8-7 9.7-4.2-1.7-7-5.3-7-9.7V6l7-2.8Z" />
      <path d="m8.8 12 2 2 4.4-4.7" />
    </svg>
  )
}

function HeadsetIcon() {
  return (
    <svg {...pointIconProps}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13h3v5H5.5A1.5 1.5 0 0 1 4 16.5V13Z" />
      <path d="M20 13h-3v5h1.5a1.5 1.5 0 0 0 1.5-1.5V13Z" />
      <path d="M16.5 18.5c-.8 1.1-2.2 1.7-4.5 1.7" />
    </svg>
  )
}

function LightningIcon() {
  return (
    <svg {...pointIconProps}>
      <path d="M13 2 5 13h6l-1 9 8-12h-6l1-8Z" />
    </svg>
  )
}

function formatAmount(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount)
}

export default TabbedSaleProductsClient
