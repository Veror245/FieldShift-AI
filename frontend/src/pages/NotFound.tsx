import { Link } from "react-router-dom"
import { Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/common/PageHeader"

export default function NotFound() {
  return (
    <>
      <PageHeader title="Page not found" description="We could not find that page." />
      <Card className="rounded-2xl p-10 text-center">
        <Compass className="mx-auto mb-4 h-10 w-10 text-forest/30" />
        <p className="mb-5 text-sm text-forest/70">
          The link may be mistyped or the page may have moved.
        </p>
        <Button asChild className="h-11 rounded-xl">
          <Link to="/">Back to the overview</Link>
        </Button>
      </Card>
    </>
  )
}