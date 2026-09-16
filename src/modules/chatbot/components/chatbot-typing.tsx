import ChatbotAvatar from "./chatbot-avatar"

export default function ChatbotTyping(props: { avatarUrl?: string | null; avatarAltText?: string | null }) {
  return <div role="status" aria-label="CBA Assistant is checking verified information" className="cba-chatbot-message flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/20"><ChatbotAvatar src={props.avatarUrl} alt={props.avatarAltText || ""} className="h-9 w-9 object-contain"/></span><span className="flex h-10 items-center gap-1 rounded-2xl rounded-bl-md border border-grey-20 bg-white px-4 shadow-sm"><i className="cba-chatbot-dot"/><i className="cba-chatbot-dot"/><i className="cba-chatbot-dot"/></span></div>
}
