import type { CbaOrderTimelineItem } from "types/order-tracking"
import {
  deriveHorizontalTimelineSteps,
  formatTrackingDate,
  type HorizontalTimelineStep,
} from "../../utils/format-tracking"

type OrderTimelineHorizontalProps = {
  items: CbaOrderTimelineItem[]
  nextStepTitle?: string | null
}

export default function OrderTimelineHorizontal({
  items,
  nextStepTitle,
}: OrderTimelineHorizontalProps) {
  const steps = deriveHorizontalTimelineSteps(items)

  if (!steps.length) {
    return (
      <p className="text-[14px] text-[#5d6470]">
        Order progress will appear here as your order moves forward.
      </p>
    )
  }

  return (
    <div className="w-full min-w-0">
      <div className="small:hidden">
        <ol className="list-none p-0" aria-label="Order delivery progress">
          {steps.map((step, index) => (
            <VerticalStep
              key={step.id}
              step={step}
              isLast={index === steps.length - 1}
            />
          ))}
        </ol>
      </div>

      <div className="-mx-1 hidden overflow-x-auto pb-1 small:block">
        <ol
          className="flex min-w-[560px] list-none items-start p-0"
          aria-label="Order delivery progress"
        >
          {steps.map((step, index) => (
            <HorizontalStep
              key={step.id}
              step={step}
              isLast={index === steps.length - 1}
            />
          ))}
        </ol>
      </div>
      {nextStepTitle && steps.every((step) => step.state !== "cancelled") && (
        <p className="mt-4 break-words text-[13px] font-medium text-[#5d6470]">
          Next: <span className="text-[#151922]">{nextStepTitle}</span>
        </p>
      )}
    </div>
  )
}

function VerticalStep({
  step,
  isLast,
}: {
  step: HorizontalTimelineStep
  isLast: boolean
}) {
  const isFailed = step.state === "failed" || step.state === "cancelled"
  const connectorComplete = step.state === "complete"

  return (
    <li className="relative grid min-w-0 grid-cols-[24px_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
      {!isLast && (
        <span
          className={`absolute bottom-0 left-[11px] top-6 w-0.5 ${
            connectorComplete ? "bg-[#ff5c0e]" : "bg-[#e5e7eb]"
          }`}
          aria-hidden
        />
      )}
      <span
        className={`relative z-[1] flex h-6 w-6 items-center justify-center rounded-full border-2 ${
          isFailed
            ? "border-rose-500 bg-rose-500"
            : step.state === "complete"
              ? "border-[#ff5c0e] bg-[#ff5c0e]"
              : step.state === "current"
                ? "border-[#ff5c0e] bg-white"
                : "border-[#d1d5db] bg-white"
        }`}
        aria-hidden
      >
        {step.state === "complete" && !isFailed && (
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {step.state === "current" && !isFailed && (
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5c0e]" aria-hidden />
        )}
      </span>
      <div className="min-w-0">
        <p
          className={`break-words text-[13px] font-semibold leading-4 ${
            step.state === "upcoming" ? "text-[#8a919c]" : "text-[#151922]"
          }`}
        >
          {step.label}
        </p>
        {step.occurred_at && (
          <time
            dateTime={step.occurred_at}
            className="mt-1 block break-words text-[11px] leading-4 text-[#5d6470]"
          >
            {formatTrackingDate(step.occurred_at)}
          </time>
        )}
        <span className="sr-only">Status: {step.state}</span>
      </div>
    </li>
  )
}

function HorizontalStep({
  step,
  isLast,
}: {
  step: HorizontalTimelineStep
  isLast: boolean
}) {
  const isFailed = step.state === "failed" || step.state === "cancelled"
  const connectorComplete = step.state === "complete"

  return (
    <li className="relative flex min-w-0 flex-1 flex-col items-center px-2 text-center">
      {!isLast && (
        <span
          className={`absolute left-[calc(50%+14px)] right-[calc(-50%+14px)] top-[11px] h-0.5 ${
            connectorComplete ? "bg-[#ff5c0e]" : "bg-[#e5e7eb]"
          }`}
          aria-hidden
        />
      )}
      <span
        className={`relative z-[1] flex h-6 w-6 items-center justify-center rounded-full border-2 ${
          isFailed
            ? "border-rose-500 bg-rose-500"
            : step.state === "complete"
              ? "border-[#ff5c0e] bg-[#ff5c0e]"
              : step.state === "current"
                ? "border-[#ff5c0e] bg-white"
                : "border-[#d1d5db] bg-white"
        }`}
        aria-hidden
      >
        {step.state === "complete" && !isFailed && (
          <svg
            className="h-3 w-3 text-white"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden
          >
            <path
              d="M2.5 6.2 4.8 8.5 9.5 3.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {step.state === "current" && !isFailed && (
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5c0e]" aria-hidden />
        )}
      </span>
      <p
        className={`mt-3 text-[13px] font-semibold leading-4 ${
          step.state === "upcoming" ? "text-[#8a919c]" : "text-[#151922]"
        }`}
      >
        {step.label}
      </p>
      {step.occurred_at && (
        <time
          dateTime={step.occurred_at}
          className="mt-1 block text-[11px] leading-4 text-[#5d6470]"
        >
          {formatTrackingDate(step.occurred_at)}
        </time>
      )}
      <span className="sr-only">Status: {step.state}</span>
    </li>
  )
}
