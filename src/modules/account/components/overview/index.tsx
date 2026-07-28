"use client"

import {
  ArrowRightMini,
  Calendar,
  Cash,
  ChevronRight,
  CubeSolid,
  Envelope,
  Heart,
  MapPin,
  Phone,
  ShoppingBag,
  Sparkles,
  User,
} from "@medusajs/icons"
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react"

import type {
  CbaAccountDashboard,
  CbaAccountDashboardOrder,
} from "@lib/data/account-dashboard"
import type { FeaturedProductCard } from "@lib/data/featured-products"
import { subscribeToNewsletter } from "@lib/data/newsletter"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"

type OverviewProps = {
  dashboard: CbaAccountDashboard
  recommendedProducts: FeaturedProductCard[]
}

const Overview = ({ dashboard, recommendedProducts }: OverviewProps) => {
  const profile = dashboard.profile
  const firstName = profile.first_name || "there"
  const totalSpent = useMemo(
    () => formatSpend(dashboard.total_spent),
    [dashboard.total_spent]
  )

  const summaryCards = [
    {
      label: "Total Orders",
      value: dashboard.total_order_count.toLocaleString(),
      href: "/account/orders",
      action: "View all orders",
      icon: ShoppingBag,
      tone: "orange",
    },
    {
      label: "Total Spent",
      value: totalSpent,
      href: "/account/orders",
      action: dashboard.total_spent_is_partial ? "View spending" : "View orders",
      icon: Cash,
      tone: "blue",
      note: dashboard.total_spent_is_partial
        ? "Calculated from recent completed orders"
        : undefined,
    },
    {
      label: "In Progress",
      value: dashboard.in_progress_order_count.toLocaleString(),
      href: "/account/orders",
      action: "Track orders",
      icon: CubeSolid,
      tone: "green",
    },
    {
      label: "Wishlist Items",
      value: dashboard.wishlist_item_count.toLocaleString(),
      href: "/wishlist",
      action: "View wishlist",
      icon: Heart,
      tone: "purple",
    },
  ] as const

  return (
    <div
      className="w-full bg-[#f7f8fa] px-4 py-5 small:px-7 small:py-7"
      data-testid="overview-page-wrapper"
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 small:flex-row small:items-start small:justify-between">
          <div>
            <h1 className="text-2xl-semi text-gray-950">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-small-regular text-gray-600">
              Here is what is happening with your account today.
            </p>
          </div>
          <time className="text-small-regular text-gray-500">
            {new Intl.DateTimeFormat("en-US", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </time>
        </div>

        <div className="grid grid-cols-1 gap-4 medium:grid-cols-4">
          {summaryCards.map((card) => (
            <DashboardMetricCard key={card.label} {...card} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-5 medium:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-large-semi text-gray-950">Recent Orders</h2>
              <LocalizedClientLink
                href="/account/orders"
                className="inline-flex items-center gap-1 text-small-semi text-[#ff5c0e]"
              >
                View All Orders <ArrowRightMini />
              </LocalizedClientLink>
            </div>
            <div>
              {dashboard.recent_orders.length ? (
                dashboard.recent_orders.map((order) => (
                  <RecentOrderRow key={order.id} order={order} />
                ))
              ) : (
                <EmptyPanel
                  title="No recent orders"
                  body="Your latest purchases will appear here after checkout."
                  href="/"
                  action="Browse products"
                />
              )}
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-large-semi text-gray-950">Account Summary</h2>
              <dl className="mt-5 flex flex-col gap-4">
                <SummaryRow
                  icon={User}
                  label="Account Type"
                  value={profile.company_name ? "Business" : "Customer"}
                />
                <SummaryRow
                  icon={Calendar}
                  label="Member Since"
                  value={formatDate(profile.created_at)}
                />
                <SummaryRow
                  icon={Envelope}
                  label="Email"
                  value={profile.email || "Not provided"}
                />
                <SummaryRow
                  icon={Phone}
                  label="Phone"
                  value={profile.phone || "Not provided"}
                />
              </dl>
              <LocalizedClientLink
                href="/account/profile"
                className="mt-6 inline-flex items-center gap-1 text-small-semi text-[#ff5c0e]"
              >
                Edit Profile <ArrowRightMini />
              </LocalizedClientLink>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-large-semi text-gray-950">Quick Actions</h2>
              <div className="mt-5 grid grid-cols-1 gap-3 small:grid-cols-2 medium:grid-cols-1">
                <QuickAction href="/" icon={ShoppingBag} label="Browse Products" />
                <QuickAction href="/wishlist" icon={Heart} label="View Wishlist" />
                <QuickAction href="/account/orders" icon={CubeSolid} label="Track Orders" />
                <QuickAction href="/account/addresses" icon={MapPin} label="Manage Addresses" />
              </div>
            </section>

            <NewsletterPanel />
          </aside>
        </div>

        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-large-semi text-gray-950">Recommended for You</h2>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center gap-1 text-small-semi text-[#ff5c0e]"
            >
              View All <ArrowRightMini />
            </LocalizedClientLink>
          </div>
          {recommendedProducts.length ? (
            <div className="mt-5 grid grid-cols-1 gap-4 small:grid-cols-2 medium:grid-cols-4">
              {recommendedProducts.slice(0, 4).map((product) => (
                <LocalizedClientLink
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="group rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-[#ff5c0e]"
                >
                  <Thumbnail
                    thumbnail={product.thumbnail?.url}
                    images={[]}
                    size="square"
                    className="rounded-md shadow-none"
                  />
                  <div className="mt-4 min-h-[72px]">
                    <h3 className="line-clamp-2 text-small-semi text-gray-950">
                      {product.title}
                    </h3>
                    {product.price.calculated_amount !== null ? (
                      <p className="mt-3 text-small-semi text-[#ff5c0e]">
                        {convertToLocale({
                          amount: product.price.calculated_amount,
                          currency_code: product.price.currency_code,
                        })}
                      </p>
                    ) : (
                      <p className="mt-3 text-small-regular text-gray-500">
                        Price unavailable
                      </p>
                    )}
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          ) : (
            <EmptyPanel
              title="No recommendations yet"
              body="Featured products will appear here when they are available."
              href="/store"
              action="Browse store"
            />
          )}
        </section>
      </div>
    </div>
  )
}

type MetricCardProps = {
  label: string
  value: string
  href: string
  action: string
  icon: ComponentType<{ className?: string }>
  tone: "orange" | "blue" | "green" | "purple"
  note?: string
}

const toneClasses = {
  orange: "bg-orange-50 text-[#ff5c0e]",
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  purple: "bg-violet-50 text-violet-600",
}

const DashboardMetricCard = ({
  label,
  value,
  href,
  action,
  icon: Icon,
  tone,
  note,
}: MetricCardProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-small-regular text-gray-500">{label}</p>
          <p className="mt-1 break-words text-xl-semi text-gray-950">{value}</p>
          {note && <p className="mt-1 text-xsmall-regular text-gray-500">{note}</p>}
          <LocalizedClientLink
            href={href}
            className="mt-3 inline-flex items-center gap-1 text-small-semi text-[#ff5c0e]"
          >
            {action} <ArrowRightMini />
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

const RecentOrderRow = ({ order }: { order: CbaAccountDashboardOrder }) => {
  const status = order.fulfillment_status.label || order.order_status.label
  return (
    <LocalizedClientLink
      href={`/account/orders/details/${order.id}`}
      className="grid grid-cols-[64px_minmax(0,1fr)] gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0 small:grid-cols-[64px_minmax(0,1fr)_140px_120px_24px] small:items-center"
      data-testid="order-wrapper"
      data-value={order.id}
    >
      <Thumbnail
        thumbnail={order.thumbnail}
        images={[]}
        size="square"
        className="h-16 w-16 rounded-md p-2 shadow-none"
      />
      <div className="min-w-0">
        <p className="text-small-semi text-gray-950">
          Order #{order.custom_display_id || order.display_id}
        </p>
        <p className="mt-1 line-clamp-1 text-small-regular text-gray-600">
          {order.primary_item_title || "Order items"}
          {order.additional_item_count > 0
            ? ` + ${order.additional_item_count} more`
            : ""}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 small:hidden">
          <StatusPill status={status} />
          <span className="text-small-regular text-gray-500">
            {formatDate(order.created_at)}
          </span>
          <span className="text-small-semi text-gray-950">
            {convertToLocale({
              amount: order.total,
              currency_code: order.currency_code,
            })}
          </span>
        </div>
      </div>
      <div className="hidden small:block">
        <StatusPill status={status} />
      </div>
      <span className="hidden text-small-regular text-gray-500 small:block">
        {formatDate(order.created_at)}
      </span>
      <span className="hidden text-small-semi text-gray-950 small:block">
        {convertToLocale({
          amount: order.total,
          currency_code: order.currency_code,
        })}
      </span>
      <ChevronRight className="hidden text-gray-400 small:block" />
    </LocalizedClientLink>
  )
}

const StatusPill = ({ status }: { status: string }) => {
  const normalized = status.toLowerCase()
  const className = normalized.includes("deliver")
    ? "bg-emerald-50 text-emerald-700"
    : normalized.includes("ship")
    ? "bg-orange-50 text-[#ff5c0e]"
    : "bg-blue-50 text-blue-700"

  return (
    <span className={`inline-flex rounded-md px-2 py-1 text-xsmall-semi ${className}`}>
      {status}
    </span>
  )
}

const SummaryRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="flex min-w-0 items-center gap-3 text-small-regular text-gray-600">
      <Icon className="h-5 w-5 shrink-0 text-gray-500" />
      <span>{label}</span>
    </dt>
    <dd className="min-w-0 break-words text-right text-small-regular text-gray-950">
      {value}
    </dd>
  </div>
)

const QuickAction = ({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: ComponentType<{ className?: string }>
  label: string
}) => (
  <LocalizedClientLink
    href={href}
    className="flex min-h-12 items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-small-semi text-gray-700 transition-colors hover:border-[#ff5c0e] hover:text-gray-950"
  >
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-orange-50 text-[#ff5c0e]">
      <Icon className="h-5 w-5" />
    </span>
    <span>{label}</span>
  </LocalizedClientLink>
)

const NewsletterPanel = () => {
  const initialState = { status: "idle" as const }
  const [state, formAction, isPending] = useActionState(
    subscribeToNewsletter,
    initialState
  )
  const [email, setEmail] = useState("")
  const [clientError, setClientError] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.status === "success") {
      setEmail("")
      setClientError("")
      formRef.current?.reset()
    }
  }, [state.status])

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-large-semi text-gray-950">Stay Updated</h2>
          <p className="mt-1 text-small-regular text-gray-600">
            Get the latest updates, offers, and product news.
          </p>
        </div>
      </div>
      <form
        ref={formRef}
        action={formAction}
        className="mt-5 flex flex-col gap-3 small:flex-row medium:flex-col"
        onSubmit={(event) => {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            event.preventDefault()
            setClientError("Enter a valid email address.")
          }
        }}
      >
        <label htmlFor="account-newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="account-newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setClientError("")
          }}
          placeholder="Enter your email"
          disabled={isPending}
          className="min-h-11 min-w-0 flex-1 rounded-md border border-gray-200 px-3 text-small-regular text-gray-950 outline-none focus:border-[#ff5c0e] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending}
          className="min-h-11 rounded-md bg-[#ff5c0e] px-5 text-small-semi text-white transition-colors hover:bg-[#e6530c] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Subscribing" : "Subscribe"}
        </button>
      </form>
      {(clientError || state.status === "error") && (
        <p className="mt-2 text-small-regular text-red-600" role="alert">
          {clientError || state.error}
        </p>
      )}
      {state.status === "success" && (
        <p className="mt-2 text-small-regular text-emerald-700" role="alert">
          {state.message}
        </p>
      )}
      <p className="mt-3 text-xsmall-regular text-gray-500">
        You can unsubscribe at any time.
      </p>
    </section>
  )
}

const EmptyPanel = ({
  title,
  body,
  href,
  action,
}: {
  title: string
  body: string
  href: string
  action: string
}) => (
  <div className="px-5 py-10 text-center">
    <p className="text-base-semi text-gray-950">{title}</p>
    <p className="mx-auto mt-2 max-w-md text-small-regular text-gray-600">{body}</p>
    <LocalizedClientLink
      href={href}
      className="mt-4 inline-flex items-center gap-1 text-small-semi text-[#ff5c0e]"
    >
      {action} <ArrowRightMini />
    </LocalizedClientLink>
  </div>
)

function formatSpend(spend: Array<{ currency_code: string; total: number }>) {
  if (!spend.length) {
    return convertToLocale({ amount: 0, currency_code: "lkr" })
  }

  return spend
    .map((item) =>
      convertToLocale({
        amount: item.total,
        currency_code: item.currency_code,
      })
    )
    .join(" / ")
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Not available"
  }
  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export default Overview
