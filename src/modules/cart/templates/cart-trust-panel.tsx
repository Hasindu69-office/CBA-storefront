import {
  HeadphonesIcon,
  TruckIcon,
} from "@modules/layout/components/cba-icons"

function ShieldIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  )
}

const items = [
  {
    title: "Secure Payments",
    description: "Your payment information is safe and encrypted.",
    icon: <ShieldIcon />,
  },
  {
    title: "Fast Delivery",
    description: "Quick and reliable delivery across Sri Lanka.",
    icon: <TruckIcon size={30} />,
  },
  {
    title: "Dedicated Support",
    description: "Our team is here to help you before and after your purchase.",
    icon: <HeadphonesIcon size={30} />,
  },
]

export default function CartTrustPanel() {
  return (
    <section className="rounded-md border border-gray-100 bg-white px-6 py-5 shadow-sm">
      {items.map((item, index) => (
        <div
          key={item.title}
          className={[
            "flex gap-4 py-4",
            index === 0 ? "pt-0" : "border-t border-gray-100",
            index === items.length - 1 ? "pb-0" : "",
          ].join(" ")}
        >
          <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center text-brand">
            {item.icon}
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[#111111]">
              {item.title}
            </h3>
            <p className="mt-1 text-[12px] leading-5 text-[#626978]">
              {item.description}
            </p>
          </div>
        </div>
      ))}
    </section>
  )
}
