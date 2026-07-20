"use client"

import { SearchIcon } from "@modules/layout/components/cba-icons"
import { useParams, useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

export default function CbaSearchForm() {
  const [searchQuery, setSearchQuery] = useState("")
  const params = useParams()
  const router = useRouter()
  const countryCode = String(params.countryCode ?? "lk")

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const query = searchQuery.trim()
    if (!query) {
      return
    }

    router.push(`/${countryCode}/store?query=${encodeURIComponent(query)}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex items-center w-full relative">
      <label htmlFor="site-search" className="sr-only">
        Search products
      </label>
      <input
        id="site-search"
        type="search"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="w-full border-[1.5px] border-[#DDE1E4] border-r-0 rounded-l-[8px] py-2.5 px-4 focus:outline-none focus:border-brand text-sm h-[46px]"
      />
      <button
        type="submit"
        className="bg-brand text-white px-6 h-[46px] rounded-r-[8px] hover:bg-brand-hover transition-colors flex items-center justify-center flex-shrink-0"
        aria-label="Search"
      >
        <SearchIcon size={18} strokeWidth={2.5} />
      </button>
    </form>
  )
}
