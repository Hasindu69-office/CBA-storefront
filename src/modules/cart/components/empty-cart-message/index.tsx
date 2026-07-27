import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ShoppingCartIcon } from "@modules/layout/components/cba-icons"

const EmptyCartMessage = () => {
  return (
    <div
      className="mt-8 rounded-[8px] border border-dashed border-[#d9dde3] bg-white px-6 py-16 text-center"
      data-testid="empty-cart-message"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff2e6] text-brand">
        <ShoppingCartIcon size={28} />
      </div>
      <h2 className="mt-5 text-xl font-bold">Your cart is empty</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5f6673]">
        Browse the store and add products to your cart when you&apos;re ready
        to check out.
      </p>
      <LocalizedClientLink
        href="/store"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-[6px] bg-brand px-6 text-sm font-bold text-white hover:bg-brand-hover"
      >
        Continue Shopping
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
