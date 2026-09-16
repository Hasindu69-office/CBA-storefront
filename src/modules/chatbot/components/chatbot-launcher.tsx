import { forwardRef } from "react"
import { CloseIcon } from "./chatbot-icons"

type Props = { open: boolean; onClick: () => void }

const ChatbotLauncher = forwardRef<HTMLButtonElement, Props>(({ open, onClick }, ref) => (
  <button ref={ref} type="button" tabIndex={0} onClick={onClick} aria-label={open ? "Close CBA assistant" : "Open CBA assistant"} aria-expanded={open} aria-controls="cba-chatbot-dialog" className={`cba-chatbot-launcher group pointer-events-auto relative flex h-20 w-20 items-center justify-center rounded-full bg-transparent text-white transition-[transform,background-color,box-shadow,opacity] duration-300 hover:-translate-y-1 hover:bg-transparent focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/25 motion-reduce:transform-none small:h-[88px] small:w-[88px] ${open ? "cba-chatbot-launcher--open h-12 w-12 small:h-14 small:w-14" : ""}`}>
    <span aria-hidden="true" className={`cba-chatbot-launcher-bubble absolute right-0 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-cyan-100/90 bg-cyan-300/70 text-[10px] font-black text-cyan-950 shadow-[0_5px_14px_rgba(34,211,238,.28)] backdrop-blur-[2px] transition-opacity duration-300 motion-reduce:animation-none ${open ? "cba-chatbot-launcher-bubble--open opacity-0" : "opacity-100"}`}>
      <span className="relative z-10">Hi</span>
    </span>
    <span aria-hidden="true" className={`cba-chatbot-launcher-image absolute inset-0 flex items-end justify-center transition-[opacity,transform] duration-300 motion-reduce:transition-none ${open ? "scale-75 opacity-0" : "scale-100 opacity-100"}`}>
      <img src="/images/Mr.Biz.png" alt="" className="h-[calc(100%+10px)] w-[calc(100%+10px)] max-w-none object-contain" />
    </span>
    <span aria-hidden="true" className={`cba-chatbot-launcher-close absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-300 motion-reduce:transition-none ${open ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
      <CloseIcon className="h-5 w-5" />
    </span>
  </button>
))
ChatbotLauncher.displayName = "ChatbotLauncher"
export default ChatbotLauncher
