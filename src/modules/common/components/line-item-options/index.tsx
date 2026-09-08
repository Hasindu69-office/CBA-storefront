import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { visibleVariantTitle } from "@lib/util/product-options"

type LineItemOptionsProps = {
  variant: HttpTypes.StoreProductVariant | undefined
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

const LineItemOptions = ({
  variant,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  const title = visibleVariantTitle(variant?.title)
  if (!title) {
    return null
  }

  return (
    <Text
      data-testid={dataTestid}
      data-value={dataValue}
      className="inline-block txt-medium text-ui-fg-subtle w-full overflow-hidden text-ellipsis"
    >
      Variant: {title}
    </Text>
  )
}

export default LineItemOptions
