import { forwardRef } from "react"
import { ChatIcon, CloseIcon } from "./chatbot-icons"

type Props = { open: boolean; onClick: () => void }

const ChatbotLauncher = forwardRef<HTMLButtonElement, Props>(({ open, onClick }, ref) => (
  <button ref={ref} type="button" onClick={onClick} aria-label={open ? "Close CBA assistant" : "Open CBA assistant"} aria-expanded={open} aria-controls="cba-chatbot-dialog" className="group fixed bottom-[calc(92px+env(safe-area-inset-bottom))] right-4 z-[72] flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-brand px-4 text-white shadow-[0_14px_34px_rgba(255,92,14,.32),0_4px_12px_rgba(17,24,39,.16)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-brand-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 motion-reduce:transform-none small:bottom-6 small:right-6">
    <span className="relative h-6 w-6 shrink-0"><ChatIcon className={`absolute inset-0 h-6 w-6 transition-all duration-200 motion-reduce:transition-none ${open ? "scale-75 opacity-0" : "scale-100 opacity-100"}`}/><CloseIcon className={`absolute inset-0 h-6 w-6 transition-all duration-200 motion-reduce:transition-none ${open ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}/></span>
    <span className="hidden whitespace-nowrap text-sm font-bold small:inline">{open ? "Close" : "Ebiz AI"}</span>
  </button>
))
ChatbotLauncher.displayName = "ChatbotLauncher"
export default ChatbotLauncher
