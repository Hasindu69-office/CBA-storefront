"use client"

import { clx } from "@medusajs/ui"
import { ChevronDownIcon } from "@modules/layout/components/cba-icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function Pagination({
  page,
  totalPages,
  "data-testid": dataTestid,
}: {
  page: number
  totalPages: number
  "data-testid"?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const canGoPrevious = currentPage > 1
  const canGoNext = currentPage < totalPages

  const arrayRange = (start: number, stop: number) =>
    Array.from({ length: stop - start + 1 }, (_, index) => start + index)

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
      return
    }

    const params = new URLSearchParams(searchParams)
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const renderPageButton = (p: number) => {
    const isCurrent = p === currentPage

    return (
      <button
        key={p}
        type="button"
        className={clx(
          "flex h-10 min-w-10 items-center justify-center rounded-[8px] border px-3 text-[14px] font-bold transition-colors",
          {
            "border-brand bg-brand text-white shadow-[0_8px_18px_rgba(255,92,14,0.22)]":
              isCurrent,
            "border-[#e5e7eb] bg-white text-[#596070] hover:border-brand hover:text-brand":
              !isCurrent,
          }
        )}
        disabled={isCurrent}
        aria-current={isCurrent ? "page" : undefined}
        aria-label={isCurrent ? `Current page, page ${p}` : `Go to page ${p}`}
        onClick={() => handlePageChange(p)}
      >
        {p}
      </button>
    )
  }

  const renderEllipsis = (key: string) => (
    <span
      key={key}
      className="flex h-10 min-w-8 items-center justify-center text-[14px] font-bold text-[#9ca3af]"
      aria-hidden="true"
    >
      ...
    </span>
  )

  const renderPageButtons = () => {
    if (totalPages <= 7) {
      return arrayRange(1, totalPages).map((p) => renderPageButton(p))
    }

    if (currentPage <= 4) {
      return [
        ...arrayRange(1, 5).map((p) => renderPageButton(p)),
        renderEllipsis("ellipsis-start"),
        renderPageButton(totalPages),
      ]
    }

    if (currentPage >= totalPages - 3) {
      return [
        renderPageButton(1),
        renderEllipsis("ellipsis-end"),
        ...arrayRange(totalPages - 4, totalPages).map((p) =>
          renderPageButton(p)
        ),
      ]
    }

    return [
      renderPageButton(1),
      renderEllipsis("ellipsis-before-current"),
      ...arrayRange(currentPage - 1, currentPage + 1).map((p) =>
        renderPageButton(p)
      ),
      renderEllipsis("ellipsis-after-current"),
      renderPageButton(totalPages),
    ]
  }

  const renderDirectionButton = (
    direction: "previous" | "next",
    disabled: boolean
  ) => {
    const isPrevious = direction === "previous"
    const targetPage = isPrevious ? currentPage - 1 : currentPage + 1
    const label = isPrevious ? "Previous" : "Next"

    return (
      <button
        type="button"
        className={clx(
          "flex h-10 items-center justify-center gap-1.5 rounded-[8px] border px-2 text-[12px] font-bold transition-colors xsmall:gap-2 xsmall:px-4 xsmall:text-[13px] small:h-11 small:px-5 small:text-[14px]",
          {
            "cursor-not-allowed border-[#ececf1] bg-[#f7f7f8] text-[#a1a1aa]":
              disabled,
            "border-[#d9dde3] bg-white text-[#111827] hover:border-brand hover:text-brand":
              !disabled,
          }
        )}
        disabled={disabled}
        aria-label={`${label} page`}
        onClick={() => handlePageChange(targetPage)}
      >
        {isPrevious && (
          <ChevronDownIcon
            size={15}
            strokeWidth={2.2}
            className="rotate-90"
            aria-hidden="true"
          />
        )}
        <span>{label}</span>
        {!isPrevious && (
          <ChevronDownIcon
            size={15}
            strokeWidth={2.2}
            className="-rotate-90"
            aria-hidden="true"
          />
        )}
      </button>
    )
  }

  return (
    <nav
      className="mb-[calc(92px+env(safe-area-inset-bottom))] mt-10 flex w-full justify-center small:mb-0 small:mt-12"
      aria-label="Product pagination"
      data-testid={dataTestid}
    >
      <div className="flex w-full max-w-[420px] items-center justify-between gap-2 rounded-[8px] border border-[#ececf1] bg-white p-2 shadow-[0_8px_24px_rgba(17,24,39,0.06)] small:hidden">
        {renderDirectionButton("previous", !canGoPrevious)}
        <span
          className="min-w-0 px-1 text-center text-[12px] font-bold text-[#111827] xsmall:px-2 xsmall:text-[13px]"
          aria-live="polite"
        >
          Page {currentPage} of {totalPages}
        </span>
        {renderDirectionButton("next", !canGoNext)}
      </div>

      <div className="hidden items-center gap-2 rounded-[8px] border border-[#ececf1] bg-white p-2 shadow-[0_8px_24px_rgba(17,24,39,0.06)] small:flex">
        {renderDirectionButton("previous", !canGoPrevious)}
        <div className="flex items-center gap-1.5 px-1">
          {renderPageButtons()}
        </div>
        {renderDirectionButton("next", !canGoNext)}
      </div>
    </nav>
  )
}
