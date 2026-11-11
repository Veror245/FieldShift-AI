import { useEffect, useState } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { evaluateScenario } from "@/services/api"
import { baselineScenario } from "@/lib/scenario"
import type { ScenarioInput } from "@/types/scenario"

export function useScenarioLab() {
  const [input, setInput] = useState<ScenarioInput>(baselineScenario)
  const [debounced, setDebounced] = useState<ScenarioInput>(baselineScenario)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(input), 350)
    return () => window.clearTimeout(t)
  }, [input])

  const query = useQuery({
    queryKey: ["scenario", debounced],
    queryFn: () => evaluateScenario(debounced),
    placeholderData: keepPreviousData,
  })

  return {
    input,
    setInput,
    reset: () => setInput(baselineScenario),
    result: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    isUpdating: JSON.stringify(input) !== JSON.stringify(debounced) || query.isFetching,
  }
}
