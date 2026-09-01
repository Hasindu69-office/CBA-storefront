"use client"

import { Dialog, Transition } from "@headlessui/react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  LayoutGridIcon,
  XIcon,
} from "@modules/layout/components/cba-icons"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useRef, useState } from "react"

export type DesktopCategoryDrawerLink = {
  label: string
  href: string
}

type DesktopCategoryDrawerProps = {
  label: string
  links: DesktopCategoryDrawerLink[]
}

export default function DesktopCategoryDrawer({
  label,
  links,
}: DesktopCategoryDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const previousOverflowRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflowRef.current ?? ""
      previousOverflowRef.current = null
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-[46px] w-[220px] flex-shrink-0 items-center rounded-md bg-[#1f1a1a] px-5 font-medium text-white transition-colors hover:bg-[#2b2525] focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
        aria-label={`Open ${label}`}
        aria-expanded={isOpen}
        data-testid="desktop-category-drawer-trigger"
      >
        <span className="flex min-w-0 items-center gap-3">
          <LayoutGridIcon size={18} />
          <span className="truncate text-[14.5px]">{label}</span>
        </span>
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[90]"
          onClose={setIsOpen}
          data-testid="desktop-category-drawer"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/55 backdrop-blur-[2px]" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="flex min-h-full justify-start">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="flex h-screen w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-2xl small:rounded-r-lg">
                  <div className="shrink-0 px-5 pb-2 pt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                          <LayoutGridIcon size={22} strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0">
                          <Dialog.Title className="text-[22px] font-bold leading-7 text-[#111827]">
                            {label}
                          </Dialog.Title>
                          <Dialog.Description className="mt-1 text-[13px] leading-[18px] text-[#596070]">
                            Browse product categories and jump straight to the
                            section you need.
                          </Dialog.Description>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[#111827] transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                        aria-label="Close categories"
                        data-testid="desktop-category-drawer-close"
                      >
                        <XIcon size={24} strokeWidth={2} />
                      </button>
                    </div>
                    <div className="mt-4 h-px w-14 bg-brand" />
                  </div>

                  <nav
                    className="min-h-0 flex-1 overflow-y-auto px-5 py-3"
                    aria-label={label}
                  >
                    <ul className="divide-y divide-gray-100">
                      {links.map((link) => (
                        <li key={`${link.label}-${link.href}`}>
                          <LocalizedClientLink
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="group flex min-h-12 items-center justify-between gap-4 py-3 text-[15px] font-semibold leading-5 text-[#111827] transition hover:text-brand focus:text-brand focus:outline-none"
                          >
                            <span className="min-w-0 break-words">
                              {link.label}
                            </span>
                          </LocalizedClientLink>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
