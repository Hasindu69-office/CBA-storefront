"use client"

import { deleteLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"
import Spinner from "@modules/common/icons/spinner"
import { useState } from "react"

type CartLineItemRowProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  draftQuantity: number
  onQuantityChange: (quantity: number) => void
  onDeleted: () => void
  disabled?: boolean
}

export default function CartLineItemRow({
  item,
  currencyCode,
  draftQuantity,
  onQuantityChange,
  onDeleted,
  disabled,
}: CartLineItemRowProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const productSubtitle = item.product_subtitle || item.variant?.product?.subtitle
  const variantTitle =
    item.variant_title && item.variant_title !== "Default variant"
      ? item.variant_title
      : item.variant?.title && item.variant.title !== "Default variant"
      ? item.variant.title
      : null

  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)
    try {
      await deleteLineItem(item.id)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove item.")
      setIsDeleting(false)
    }
  }

  const quantityStepper = (
    <div className="inline-grid h-10 grid-cols-3 overflow-hidden rounded-md border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => onQuantityChange(draftQuantity - 1)}
        disabled={disabled || isDeleting || draftQuantity <= 1}
        className="flex w-10 items-center justify-center text-lg text-[#333740] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
        aria-label={`Decrease quantity of ${item.product_title}`}
      >
        -
      </button>
      <span className="flex w-10 items-center justify-center border-x border-gray-200 text-[14px] font-medium text-[#333740]">
        {draftQuantity}
      </span>
      <button
        type="button"
        onClick={() => onQuantityChange(draftQuantity + 1)}
        disabled={disabled || isDeleting || draftQuantity >= 99}
        className="flex w-10 items-center justify-center text-lg text-[#333740] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
        aria-label={`Increase quantity of ${item.product_title}`}
      >
        +
      </button>
    </div>
  )

  return (
    <div
      className="grid gap-4 border-b border-gray-100 py-6 last:border-b-0 small:grid-cols-[minmax(260px,1fr)_112px_132px_112px_56px] small:items-center small:gap-x-3 medium:grid-cols-[minmax(300px,1fr)_124px_140px_124px_60px]"
      data-testid="product-row"
    >
      <div className="grid min-w-0 grid-cols-[112px_minmax(0,1fr)] gap-5 small:grid-cols-[112px_minmax(0,1fr)] medium:grid-cols-[132px_minmax(0,1fr)]">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="block w-full"
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
            className="!bg-transparent !p-0 !shadow-none !rounded-none [&_img]:!object-contain"
          />
        </LocalizedClientLink>
        <div className="flex min-w-0 flex-col justify-center gap-2">
          <LocalizedClientLink
            href={`/products/${item.product_handle}`}
            className="text-[15px] font-bold leading-6 text-[#111111] transition hover:text-brand"
            data-testid="product-title"
          >
            {item.product_title}
          </LocalizedClientLink>
          {productSubtitle && (
            <p className="text-[13px] text-[#595f6d]">{productSubtitle}</p>
          )}
          {variantTitle && (
            <p className="text-[13px] text-[#595f6d]">{variantTitle}</p>
          )}
        </div>
      </div>

      <div className="min-w-0 items-center justify-between small:flex small:justify-center small:text-center">
        <span className="text-[12px] font-semibold uppercase text-gray-400 small:hidden">
          Unit Price
        </span>
        <div className="min-w-0 text-right small:flex small:justify-center small:text-center">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between small:justify-center small:text-center">
        <span className="text-[12px] font-semibold uppercase text-gray-400 small:hidden">
          Quantity
        </span>
        {quantityStepper}
      </div>

      <div className="min-w-0 items-center justify-between small:flex small:justify-center small:text-center">
        <span className="text-[12px] font-semibold uppercase text-gray-400 small:hidden">
          Subtotal
        </span>
        <div className="min-w-0 text-right font-bold text-[#111111] small:flex small:justify-center small:text-center">
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </div>
      </div>

      <div className="flex min-w-0 items-center justify-between small:justify-center small:text-center">
        <span className="text-[12px] font-semibold uppercase text-gray-400 small:hidden">
          Action
        </span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={disabled || isDeleting}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#5a606d] transition hover:bg-gray-50 hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Remove ${item.product_title} from cart`}
          data-testid="product-delete-button"
        >
          {isDeleting ? <Spinner /> : <Trash size={22} />}
        </button>
      </div>

      {error && (
        <p className="text-small-regular text-red-600 small:col-span-5">
          {error}
        </p>
      )}
    </div>
  )
}
