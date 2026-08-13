const steps = [
  { number: 1, label: "Shopping cart" },
  { number: 2, label: "Checkout details" },
  { number: 3, label: "Order complete" },
]

export default function CartProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mx-auto mt-9 flex w-full max-w-[760px] items-start justify-between gap-4">
      {steps.map((step, index) => {
        const active = step.number === currentStep

        return (
          <div
            key={step.number}
            className="relative flex flex-1 flex-col items-center gap-3"
          >
            <div className="flex items-center gap-4">
              <span
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-full text-base font-semibold",
                  active
                    ? "bg-[#202432] text-white"
                    : "bg-[#aeb4c2] text-white",
                ].join(" ")}
              >
                {step.number}
              </span>
              <span
                className={[
                  "hidden whitespace-nowrap text-[15px] font-semibold small:inline",
                  active ? "text-[#3c414d]" : "text-[#b5bac6]",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {active && (
              <span className="h-px w-full max-w-[250px] bg-[#202020]" />
            )}
            {index < steps.length - 1 && (
              <span className="sr-only">Next step</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
