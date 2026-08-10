import type { CbaReturnIntakeRequestType } from "types/return-intake"

export type EvidenceUploadPolicy = {
  max_files: number
  max_file_bytes: number
  max_total_bytes: number
  allowed_types: string[]
}

export const DEFAULT_UPLOAD_POLICY: EvidenceUploadPolicy = {
  max_files: 5,
  max_file_bytes: 5 * 1024 * 1024,
  max_total_bytes: 15 * 1024 * 1024,
  allowed_types: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
}

export type StagedEvidenceItem = {
  id: string
  original_file_name: string
  content_type: string
  size_bytes: number
  evidence_type: "photo" | "document" | "other"
  previewUrl: string | null
}

export function evidenceRequiredForType(
  requestType: CbaReturnIntakeRequestType | ""
) {
  return (
    requestType === "claim_refund" ||
    requestType === "claim_replace" ||
    requestType === "warranty"
  )
}

export function evidenceStepVisible(
  requestType: CbaReturnIntakeRequestType | ""
) {
  return Boolean(requestType) && requestType !== "cancellation"
}

export function evidenceTypeFromMime(
  contentType: string
): "photo" | "document" | "other" {
  if (contentType.startsWith("image/")) return "photo"
  if (contentType === "application/pdf") return "document"
  return "other"
}

export function validateEvidenceFileClient(
  file: File,
  policy: EvidenceUploadPolicy,
  alreadyCount: number,
  alreadyBytes: number
): { ok: true } | { ok: false; error: string } {
  if (alreadyCount >= policy.max_files) {
    return {
      ok: false,
      error: `You can upload at most ${policy.max_files} files.`,
    }
  }

  const contentType = (file.type || "").toLowerCase().split(";")[0].trim()
  if (!policy.allowed_types.includes(contentType)) {
    return {
      ok: false,
      error: "File type is not allowed. Use JPEG, PNG, WebP, or PDF.",
    }
  }

  const lower = file.name.toLowerCase()
  if (
    lower.endsWith(".svg") ||
    lower.endsWith(".html") ||
    lower.endsWith(".htm") ||
    lower.endsWith(".exe") ||
    lower.endsWith(".zip")
  ) {
    return { ok: false, error: "This file extension is not allowed." }
  }

  if (file.size <= 0 || file.size > policy.max_file_bytes) {
    return {
      ok: false,
      error: `Each file must be under ${formatBytes(policy.max_file_bytes)}.`,
    }
  }

  if (alreadyBytes + file.size > policy.max_total_bytes) {
    return {
      ok: false,
      error: `Total upload size must be under ${formatBytes(policy.max_total_bytes)}.`,
    }
  }

  return { ok: true }
}

export function validateEvidenceStepClient(
  requestType: CbaReturnIntakeRequestType | "",
  evidenceCount: number,
  evidenceRequired?: boolean
): { ok: boolean; error: string | null } {
  if (!evidenceStepVisible(requestType)) {
    return { ok: true, error: null }
  }
  const required =
    evidenceRequired ?? evidenceRequiredForType(requestType)
  if (required && evidenceCount < 1) {
    return {
      ok: false,
      error: "Please attach at least one photo or document for this request.",
    }
  }
  return { ok: true, error: null }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? "")
      const comma = result.indexOf(",")
      if (comma < 0) {
        reject(new Error("Unable to read file."))
        return
      }
      resolve(result.slice(comma + 1))
    }
    reader.onerror = () => reject(new Error("Unable to read file."))
    reader.readAsDataURL(file)
  })
}

export function revokePreviewUrls(items: Array<{ previewUrl: string | null }>) {
  for (const item of items) {
    if (item.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(item.previewUrl)
    }
  }
}
