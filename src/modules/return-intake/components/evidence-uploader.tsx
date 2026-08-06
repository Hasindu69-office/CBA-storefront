"use client"

import { useRef, useState } from "react"

import {
  DEFAULT_UPLOAD_POLICY,
  formatBytes,
  validateEvidenceFileClient,
  type EvidenceUploadPolicy,
  type StagedEvidenceItem,
} from "@modules/return-intake/lib/evidence"

type Props = {
  policy?: EvidenceUploadPolicy
  required?: boolean
  items: StagedEvidenceItem[]
  uploading?: boolean
  error?: string | null
  onAddFiles: (files: File[]) => void
  onRemove: (id: string) => void
  disabled?: boolean
}

export default function EvidenceUploader({
  policy = DEFAULT_UPLOAD_POLICY,
  required = false,
  items,
  uploading = false,
  error = null,
  onAddFiles,
  onRemove,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  function handleSelect(fileList: FileList | null) {
    if (!fileList?.length) return
    setLocalError(null)
    const files = Array.from(fileList)
    const accepted: File[] = []
    let count = items.length
    let bytes = items.reduce((sum, item) => sum + item.size_bytes, 0)

    for (const file of files) {
      const check = validateEvidenceFileClient(file, policy, count, bytes)
      if (!check.ok) {
        setLocalError(check.error)
        break
      }
      accepted.push(file)
      count += 1
      bytes += file.size
    }

    if (accepted.length) onAddFiles(accepted)
    if (inputRef.current) inputRef.current.value = ""
  }

  const accept = policy.allowed_types.join(",")
  const displayError = error || localError

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-dashed border-[#d7dbe3] bg-[#fafbfc] p-4">
        <p className="text-[14px] font-semibold text-[#151922]">
          {required
            ? "Photos or documents (required)"
            : "Photos or documents (optional)"}
        </p>
        <p className="mt-1 text-[13px] text-[#5d6470]">
          JPEG, PNG, WebP, or PDF · up to {policy.max_files} files ·{" "}
          {formatBytes(policy.max_file_bytes)} each
        </p>
        <button
          type="button"
          disabled={disabled || uploading || items.length >= policy.max_files}
          onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex items-center justify-center rounded-md border border-[#ff5c0e] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#ff5c0e] transition hover:bg-[#fff4ee] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c0e]"
        >
          {uploading ? "Uploading…" : "Add files"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          onChange={(e) => handleSelect(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-[#e5e7eb] bg-white p-3"
            >
              {item.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-14 w-14 rounded object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded bg-[#f3f4f6] text-[11px] font-semibold text-[#5d6470]">
                  PDF
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-[#151922]">
                  {item.original_file_name}
                </p>
                <p className="text-[12px] text-[#5d6470]">
                  {formatBytes(item.size_bytes)} · {item.evidence_type}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => onRemove(item.id)}
                className="text-[12px] font-semibold text-[#5d6470] hover:text-rose-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {displayError && <p className="text-[13px] text-rose-600">{displayError}</p>}
    </div>
  )
}
