import { PageHeader } from "@/components/common/PageHeader"

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="rounded-2xl border border-dashed border-sage bg-white/60 p-10 text-center text-forest/60">
        Coming soon. This page is built later in the plan.
      </div>
    </>
  )
}