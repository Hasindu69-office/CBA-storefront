"use client"

import { transferCart } from "@lib/data/customer"
import { ExclamationCircleSolid } from "@medusajs/icons"
import { StoreCart, StoreCustomer } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useRouter } from "next/navigation"
import { useState } from "react"

function CartMismatchBanner(props: {
  customer: StoreCustomer
  cart: StoreCart
}) {
  const { customer, cart } = props
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [actionText, setActionText] = useState("Run transfer again")
  const [message, setMessage] = useState(
    "Something went wrong when we tried to transfer your cart"
  )

  if (!customer || !!cart.customer_id) {
    return
  }

  const handleSubmit = async () => {
    if (isPending || !cart?.id || cart.customer_id) {
      return
    }

    try {
      setIsPending(true)
      setActionText("Transferring..")

      const result = await transferCart()
      setMessage(result.message ?? message)

      if (result.success && result.needsRefresh) {
        router.refresh()
        return
      }

      setActionText("Run transfer again")
      setIsPending(false)
    } catch {
      setMessage("Something went wrong when we tried to transfer your cart")
      setActionText("Run transfer again")
      setIsPending(false)
    }
  }

  return (
    <div className="flex items-center justify-center small:p-4 p-2 text-center bg-orange-300 small:gap-2 gap-1 text-sm mt-2 text-orange-800">
      <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
        <span className="flex items-center gap-1">
          <ExclamationCircleSolid className="inline" />
          {message}
        </span>

        <span>·</span>

        <Button
          variant="transparent"
          className="hover:bg-transparent active:bg-transparent focus:bg-transparent disabled:text-orange-500 text-orange-950 p-0 bg-transparent"
          size="base"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {actionText}
        </Button>
      </div>
    </div>
  )
}

export default CartMismatchBanner
