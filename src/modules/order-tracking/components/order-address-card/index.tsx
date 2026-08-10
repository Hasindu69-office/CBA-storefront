import type { CbaSafeAddress } from "types/order-tracking"

type OrderAddressCardProps = {
  title: string
  address: CbaSafeAddress | null
  shippingMethodName?: string | null
}

export default function OrderAddressCard({
  title,
  address,
  shippingMethodName,
}: OrderAddressCardProps) {
  if (!address) {
    return (
      <div>
        <h3 className="text-[15px] font-semibold text-[#151922]">{title}</h3>
        <p className="mt-2 text-[14px] text-[#5d6470]">Not available</p>
      </div>
    )
  }

  const name = [address.first_name, address.last_name].filter(Boolean).join(" ")
  const lines = [
    name,
    address.company,
    [address.address_1, address.address_2].filter(Boolean).join(", "),
    [address.city, address.province, address.postal_code].filter(Boolean).join(", "),
    address.country_code?.toUpperCase(),
    address.phone,
  ].filter(Boolean)

  return (
    <div>
      <h3 className="text-[15px] font-semibold text-[#151922]">{title}</h3>
      <address className="mt-2 not-italic text-[14px] leading-6 text-[#3b414c]">
        {lines.map((line) => (
          <div key={String(line)}>{line}</div>
        ))}
      </address>
      {shippingMethodName && (
        <p className="mt-3 text-[13px] text-[#5d6470]">
          Delivery method:{" "}
          <span className="font-semibold text-[#151922]">{shippingMethodName}</span>
        </p>
      )}
    </div>
  )
}
