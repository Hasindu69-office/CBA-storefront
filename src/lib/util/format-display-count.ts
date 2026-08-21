const DEFAULT_MAX_DISPLAY_COUNT = 99

export function formatDisplayCount(
  count: number,
  maxDisplayCount = DEFAULT_MAX_DISPLAY_COUNT
) {
  if (!Number.isFinite(count) || count <= 0) {
    return "0"
  }

  return count > maxDisplayCount ? `${maxDisplayCount}+` : String(count)
}
