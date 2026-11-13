type HomeSectionSkeletonProps = {
  className?: string
  label?: string
}

const HomeSectionSkeleton = ({
  className = "bg-white py-10 small:py-14",
  label = "Loading section",
}: HomeSectionSkeletonProps) => {
  return (
    <section className={className} aria-busy="true" aria-label={label}>
      <div className="content-container">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-[#e8ecf2]" />
        <div className="mt-6 grid grid-cols-2 gap-3 small:grid-cols-4 small:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-xl bg-[#eef1f6]"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeSectionSkeleton
