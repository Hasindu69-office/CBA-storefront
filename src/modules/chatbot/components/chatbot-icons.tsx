type IconProps = { className?: string }

export function ChatIcon({ className = "" }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}><path d="M7.3 18.2 3.8 20l1-3.7A8.3 8.3 0 1 1 7.3 18.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
}

export function CloseIcon({ className = "" }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}><path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
}

export function SendIcon({ className = "" }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}><path d="m4 4 16 8-16 8 2.2-6.2L15 12l-8.8-1.8L4 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
}

export function SupportIcon({ className = "" }: IconProps) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}><path d="M5 13v-2a7 7 0 0 1 14 0v2M5 13H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v-6H5Zm14 0h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2v-6h1ZM18 19c0 1.1-.9 2-2 2h-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
