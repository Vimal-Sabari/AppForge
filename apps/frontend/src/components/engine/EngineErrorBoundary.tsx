'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface EngineErrorBoundaryProps {
  children: React.ReactNode
  componentId?: string
}

interface EngineErrorBoundaryState {
  hasError: boolean
}

/** Prevents one dynamic component from crashing the whole generated page. */
export class EngineErrorBoundary extends React.Component<
  EngineErrorBoundaryProps,
  EngineErrorBoundaryState
> {
  constructor(props: EngineErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  /** Marks the boundary as failed when a child throws. */
  static getDerivedStateFromError(): EngineErrorBoundaryState {
    return { hasError: true }
  }

  /** Logs render failures for local debugging without exposing stack traces in UI. */
  componentDidCatch(error: Error): void {
    console.error('[EngineErrorBoundary]', this.props.componentId, error.message)
  }

  /** Renders either children or a safe fallback panel. */
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Component failed to render
          </div>
          <p className="mt-1 text-red-700">Check this component configuration and try again.</p>
        </div>
      )
    }

    return this.props.children
  }
}
