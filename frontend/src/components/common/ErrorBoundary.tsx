import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

type State = { hasError: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page crashed:", error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory p-6">
        <div className="max-w-md rounded-2xl border border-forest/10 bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-bold">Something went wrong</h1>
          <p className="mb-6 text-sm text-forest/70">
            This page ran into a problem. Your saved farm details are safe. Please try again, or go
            back to the overview.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={() => this.setState({ hasError: false })} className="h-11 rounded-xl">
              Try again
            </Button>
            <Button asChild variant="secondary" className="h-11 rounded-xl">
              <a href="/">Go to overview</a>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}