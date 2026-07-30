import { confirmNewsletter } from "@lib/data/newsletter"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function NewsletterConfirm({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token = "" } = await searchParams
  const result = await confirmNewsletter(token)
  return <NewsletterResult title="Newsletter confirmation" result={result} />
}

function NewsletterResult({
  title,
  result,
}: {
  title: string
  result: { status: "success" | "error"; message: string }
}) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-white px-6 py-16">
      <section className="w-full max-w-[480px] rounded border border-gray-200 p-8 text-center">
        <p className={result.status === "success" ? "text-sm font-bold uppercase text-green-700" : "text-sm font-bold uppercase text-red-600"}>
          {result.status}
        </p>
        <h1 className="mt-3 text-2xl font-bold text-gray-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">{result.message}</p>
        <LocalizedClientLink href="/" className="mt-6 inline-flex h-11 items-center rounded bg-brand px-5 text-sm font-bold text-white">
          Continue shopping
        </LocalizedClientLink>
      </section>
    </main>
  )
}
