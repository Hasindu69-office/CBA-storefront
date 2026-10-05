"use client"

import ChatbotWidget from "@modules/chatbot/components/chatbot-widget"
import ScrollToTopButton from "@modules/layout/components/scroll-to-top-button"

export default function FloatingUtilityLayer() {
  return (
    <div className="fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-4 z-[72] flex flex-col items-end gap-3 small:bottom-6 small:right-6">
      <ScrollToTopButton />
      <ChatbotWidget />
    </div>
  )
}
