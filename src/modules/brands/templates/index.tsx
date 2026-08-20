import { listAllStoreBrands } from "@lib/data/brands"

import BrandDirectory from "./brand-directory"

export default async function BrandsTemplate() {
  const brandResult = await listAllStoreBrands()
    .then((brands) => ({ brands, error: null }))
    .catch((error) => ({
      brands: [],
      error:
        error instanceof Error
          ? error.message
          : "Brands could not be loaded.",
    }))

  return (
    <main className="bg-white pb-14">
      {brandResult.error ? (
        <section className="bg-white py-12 small:py-16">
          <div className="content-container">
            <div className="rounded-[8px] border border-[#ffe1d2] bg-[#fff7f1] px-5 py-10 text-center">
              <p className="text-[18px] font-bold leading-6 text-black">
                Brands could not be loaded
              </p>
              <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-6 text-[#6f6f76]">
                The brand directory is temporarily unavailable. Please try again
                shortly.
              </p>
            </div>
          </div>
        </section>
      ) : brandResult.brands.length ? (
        <BrandDirectory brands={brandResult.brands} />
      ) : (
        <section className="bg-white py-12 small:py-16">
          <div className="content-container">
            <div className="rounded-[8px] border border-dashed border-[#d8d8de] bg-[#fbfbfb] px-5 py-12 text-center">
              <p className="text-[18px] font-bold leading-6 text-black">
                No brands are available
              </p>
              <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-6 text-[#6f6f76]">
                Active brands will appear here once they are published in the
                catalog.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
