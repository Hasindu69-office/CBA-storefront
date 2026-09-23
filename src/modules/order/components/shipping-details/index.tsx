import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import { resolveFulfillmentMode } from "@lib/util/fulfillment-plan"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const fulfillmentMode = resolveFulfillmentMode({
    items: order.items as never,
    shippingMethods: order.shipping_methods,
  })
  const isPickupOnly = fulfillmentMode === "pickup-only"

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        {isPickupOnly
          ? "Collection"
          : fulfillmentMode === "mixed"
          ? "Fulfillment"
          : "Delivery"}
      </Heading>
      <div className="flex items-start gap-x-8">
        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-address-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1">
            {isPickupOnly ? "Customer Address" : "Shipping Address"}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.first_name}{" "}
            {order.shipping_address?.last_name}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.address_1}{" "}
            {order.shipping_address?.address_2}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.postal_code},{" "}
            {order.shipping_address?.city}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.country_code?.toUpperCase()}
          </Text>
        </div>

        <div
          className="flex flex-col w-1/3 "
          data-testid="shipping-contact-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1">Contact</Text>
          <Text className="txt-medium text-ui-fg-subtle">
            {order.shipping_address?.phone}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">{order.email}</Text>
        </div>

        <div
          className="flex flex-col w-1/3"
          data-testid="shipping-method-summary"
        >
          <Text className="txt-medium-plus text-ui-fg-base mb-1">Method</Text>
          {(order.shipping_methods ?? []).map((method) => (
            <Text key={method.id} className="txt-medium text-ui-fg-subtle">
              {method.name} (
              {/pickup|pick-up|collection/i.test(method.name ?? "") &&
              (method.total ?? 0) <= 0
                ? "Self collection"
                : convertToLocale({
                    amount: method.total ?? 0,
                    currency_code: order.currency_code,
                  })}
              )
            </Text>
          ))}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default ShippingDetails
