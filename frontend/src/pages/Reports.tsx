import { useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/common/PageHeader"
import ReportDocument from "@/reports/ReportDocument"
import { getClimateFindings, getExplanation, getStrategies, USE_MOCK } from "@/services/api"
import { useFarmStore } from "@/store/useFarmStore"
import {
  computePolygonCentroid,
  reverseGeocode,
  type GeocodedAddress,
} from "@/utils/reverseGeocode"

export default function ReportsPage() {
  const {
    profile,
    hectares,
    polygon,
    selectedStrategyId,
    weights,
    investigationId,
    investigationResult,
  } = useFarmStore()

  const corners = polygon ? polygon.geometry.coordinates[0].length - 1 : 0
  const coords = polygon?.geometry?.coordinates?.[0] as [number, number][] | undefined
  const [centroidLng, centroidLat] =
    coords && coords.length >= 3 ? computePolygonCentroid(coords) : [null, null]

  const activeCoords =
    centroidLat !== null && centroidLng !== null
      ? { lat: centroidLat, lng: centroidLng }
      : null

  const { data: address } = useQuery({
    queryKey: ["reportReverseGeocode", centroidLng, centroidLat],
    queryFn: () =>
      centroidLng !== null && centroidLat !== null
        ? reverseGeocode(centroidLng, centroidLat)
        : null,
    enabled: Boolean(polygon && centroidLng !== null && centroidLat !== null),
    staleTime: 1000 * 60 * 30,
  })

  const strategies = useQuery({
    queryKey: ["strategies", weights],
    queryFn: () => getStrategies(weights),
    staleTime: 60_000,
  })
  const climate = useQuery({ queryKey: ["climate"], queryFn: getClimateFindings })
  const explanation = useQuery({
    queryKey: ["explanation", selectedStrategyId],
    queryFn: () => getExplanation(selectedStrategyId!),
    enabled: !!selectedStrategyId,
  })

  const selected = strategies.data?.find((s) => s.id === selectedStrategyId)
  const loading =
    strategies.isLoading || climate.isLoading || (!!selectedStrategyId && explanation.isLoading)
  const failed = strategies.isError || climate.isError || explanation.isError

  const exportDevJson = useCallback(() => {
    const payload = {
      exported_at: new Date().toISOString(),
      farm_id: profile?.farmName ?? "farm-001",
      investigation_id: investigationId ?? investigationResult?.investigation_id ?? "demo",
      coordinates: activeCoords,
      location: address as GeocodedAddress | null,
      field: {
        hectares,
        corners,
        polygon: polygon?.geometry ?? null,
      },
      priorities: undefined,
      farm_profile: profile,
      investigation_result: investigationResult,
    }

    const jsonString = JSON.stringify(payload, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `fieldshift-investigation-${investigationId ?? "data"}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("[Dev / Admin] Full investigation JSON exported")
    return payload
  }, [profile, investigationId, investigationResult, activeCoords, address, hectares, corners, polygon])

  useEffect(() => {
    ;(window as unknown as { __getFieldShiftJson: () => unknown }).__getFieldShiftJson = () =>
      exportDevJson()

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j")) {
        e.preventDefault()
        exportDevJson()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [exportDevJson])

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
            polygon={polygon}
            coordinates={activeCoords}
            address={address ?? null}
            strategies={strategies.data}
            selected={selected}
            climate={climate.data}
            explanation={explanation.data}
            weights={weights}
            priorities={undefined}
            investigationResult={investigationResult}
            isDemo={USE_MOCK}
          />
        </div>
      )}
    </>
  )
}
