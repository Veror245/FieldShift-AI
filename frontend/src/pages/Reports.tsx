import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import ReportDocument from "@/reports/ReportDocument"
import { getClimateFindings, getExplanation, getStrategies, USE_MOCK } from "@/services/api"
import { useFarmStore } from "@/store/useFarmStore"

export default function ReportsPage() {
  const { profile, hectares, polygon, selectedStrategyId } = useFarmStore()

  const strategies = useQuery({ queryKey: ["strategies"], queryFn: getStrategies })
  const climate = useQuery({ queryKey: ["climate"], queryFn: getClimateFindings })
  const explanation = useQuery({
    queryKey: ["explanation", selectedStrategyId],
    queryFn: () => getExplanation(selectedStrategyId!),
    enabled: !!selectedStrategyId,
  })

  const selected = strategies.data?.find((s) => s.id === selectedStrategyId)
  const corners = polygon ? polygon.geometry.coordinates[0].length - 1 : 0
  const loading = strategies.isLoading || climate.isLoading || (!!selectedStrategyId && explanation.isLoading)
  const failed = strategies.isError || climate.isError || explanation.isError

  return (
    <>
      <PageHeader
        title="Reports"
        description="A printable assessment with the evidence, methods and limitations behind it."
      />

      {!selectedStrategyId && (
        <Card className="rounded-2xl p-8 text-center">
          <p className="mb-4 text-sm text-forest/70">
            Select a rotation for review first. The report is built around your chosen strategy.
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/strategies">Go to Rotation Studio</Link>
          </Button>
        </Card>
      )}

      {selectedStrategyId && loading && <Skeleton className="h-[600px] rounded-2xl" />}

      {selectedStrategyId && failed && (
        <Card className="rounded-2xl p-6 text-center">
          <p className="mb-3 text-sm">Could not build the report.</p>
          <Button
            onClick={() => {
              strategies.refetch()
              climate.refetch()
              explanation.refetch()
            }}
            className="rounded-xl"
          >
            Try again
          </Button>
        </Card>
      )}

      {selected && strategies.data && climate.data && explanation.data && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => window.print()} className="h-12 rounded-xl">
              <Printer className="mr-2 h-5 w-5" />
              Print or save as PDF
            </Button>
            <p className="text-xs text-forest/60">
              In the print window, choose &ldquo;Save as PDF&rdquo; as the destination.
            </p>
          </div>

          <ReportDocument
            profile={profile}
            hectares={hectares}
            corners={corners}
            strategies={strategies.data}
            selected={selected}
            climate={climate.data}
            explanation={explanation.data}
            isDemo={USE_MOCK}
          />
        </div>
      )}
    </>
  )
}