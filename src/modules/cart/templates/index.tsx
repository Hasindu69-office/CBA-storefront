import CartItemsPanel from "./cart-items-panel"
import CartProgress from "./cart-progress"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="py-10 small:py-12">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="flex flex-col">
            <h1 className="text-center text-[32px] small:text-[36px] font-bold leading-tight text-[#111111]">
              Cart
            </h1>
            <CartProgress currentStep={1} />
            <div className="mt-10 flex flex-col gap-y-5">
              {!customer && (
                <div className="rounded-md border border-gray-100 bg-white px-5 py-4 shadow-sm">
                  <SignInPrompt />
                  <Divider />
                </div>
              )}
              <CartItemsPanel cart={cart as any} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <h1 className="text-center text-[32px] small:text-[36px] font-bold leading-tight text-[#111111]">
              Cart
            </h1>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
