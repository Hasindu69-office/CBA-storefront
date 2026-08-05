import type { CbaTrackingLabel } from "types/order-tracking"
import { isSafeExternalUrl } from "../../utils/format-tracking"
import TrackingNumberCopy from "../tracking-number-copy"

type TrackingLabelListProps = {
  labels: CbaTrackingLabel[]
}

export default function TrackingLabelList({ labels }: TrackingLabelListProps) {
  if (!labels.length) {
    return (
      <p className="text-[14px] text-[#5d6470]">
        Tracking details will appear here after your order ships.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {labels.map((label, index) => (
        <li
          key={`${label.tracking_number ?? "label"}-${index}`}
          className="flex flex-col gap-2 border-t border-[#eeeeee] pt-3 first:border-t-0 first:pt-0"
        >
          {label.tracking_number ? (
            <TrackingNumberCopy value={label.tracking_number} />
          ) : (
            <p className="text-[13px] text-[#5d6470]">Tracking number pending</p>
          )}
          <div className="flex flex-wrap gap-3">
            {isSafeExternalUrl(label.tracking_url) && (
              <a
                href={label.tracking_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold text-[#ff5c0e] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
              >
                Track shipment
              </a>
            )}
            {isSafeExternalUrl(label.label_url) && (
              <a
                href={label.label_url!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-semibold text-[#3b414c] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
              >
                Shipping document
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
