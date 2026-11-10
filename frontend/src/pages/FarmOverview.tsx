import { useQuery } from "@tanstack/react-query"
import { getStrategies } from "@/services/api"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import { Term } from "@/components/common/Term"

export default function FarmOverview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["strategies"],
    queryFn: getStrategies,
  })

  return (
    <>
      <PageHeader
        title="Farm Overview"
        description={
          <>
            Satellite data such as <Term k="ndvi" /> and{" "}
            <Term k="soilMoisture" /> helps explore better crop rotations.
          </>
        }
      />

      {isLoading && <Skeleton className="h-32 w-full rounded-2xl" />}
      {isError && <p className="text-sun">Something went wrong.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {data?.map((s) => (
          <Card key={s.id} className="rounded-2xl p-5">
            <h2 className="font-semibold">{s.name}</h2>
            <p className="text-sm">{s.sequence.map((c) => c.crop).join(" → ")}</p>
          </Card>
        ))}
      </div>
    </>
  )
}