import type { FormEvent, RefObject } from "react"
import { SendIcon } from "./chatbot-icons"

type Props = { value: string; busy: boolean; inputRef: RefObject<HTMLInputElement | null>; onChange: (value: string) => void; onSubmit: () => void }

export default function ChatbotComposer({ value, busy, inputRef, onChange, onSubmit }: Props) {
  const submit = (event: FormEvent) => { event.preventDefault(); onSubmit() }
  return <form onSubmit={submit} className="border-t border-grey-20 bg-white p-3"><div className="flex min-h-12 items-center gap-2 rounded-full border border-grey-30 bg-grey-5 p-1.5 pl-4 transition focus-within:border-brand focus-within:bg-white focus-within:ring-4 focus-within:ring-brand/10"><input ref={inputRef} maxLength={2000} value={value} onChange={(event) => onChange(event.target.value)} disabled={busy} aria-label="Message CBA Assistant" placeholder="Ask about CBA products…" className="min-w-0 flex-1 bg-transparent text-sm text-grey-90 outline-none placeholder:text-grey-40 disabled:cursor-wait"/><button type="submit" disabled={busy || !value.trim()} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-40"><SendIcon className="h-5 w-5"/></button></div><div className="mt-1.5 flex justify-between px-2 text-[10px] text-grey-40"><span>Verified CBA information only</span><span>{value.length}/2000</span></div></form>
}
