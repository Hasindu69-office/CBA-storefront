import { unsubscribeNewsletter } from "@lib/data/newsletter"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function NewsletterUnsubscribe({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; reason?: string }>
}) {
  const { token = "", reason } = await searchParams
  const result = await unsubscribeNewsletter(token, reason)
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-white px-6 py-16">
      <section className="w-full max-w-[480px] rounded border border-gray-200 p-8 text-center">
        <p className={result.status === "success" ? "text-sm font-bold uppercase text-green-700" : "text-sm font-bold uppercase text-red-600"}>
          {result.status}
        </p>
        <h1 className="mt-3 text-2xl font-bold text-gray-950">Newsletter unsubscribe</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">{result.message}</p>
        <LocalizedClientLink href="/" className="mt-6 inline-flex h-11 items-center rounded bg-brand px-5 text-sm font-bold text-white">
          Continue shopping
        </LocalizedClientLink>
      </section>
    </main>
  )
}
