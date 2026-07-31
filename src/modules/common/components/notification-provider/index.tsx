"use client"

import { Toaster } from "sonner"

export default function NotificationProvider() {
  return (
    <Toaster
      closeButton
      richColors
      visibleToasts={4}
      position="top-right"
      toastOptions={{
        duration: 4500,
        classNames: {
          toast: "text-sm",
          title: "font-semibold",
          description: "text-sm",
        },
      }}
    />
  )
}
