import React from 'react'
import { ComponentConfig } from 'shared-types'
import { UnknownComponentFallback } from './UnknownComponentFallback'

// Temporary dummy components for registry to avoid importing non-existent ones
const DummyForm = ({ config }: { config: ComponentConfig }) => (
  <div>Form Component: {config.title}</div>
)
const DummyTable = ({ config }: { config: ComponentConfig }) => (
  <div>Table Component: {config.title}</div>
)
const DummyDashboard = ({ config }: { config: ComponentConfig }) => (
  <div>Dashboard Component: {config.title}</div>
)
const DummyChart = ({ config }: { config: ComponentConfig }) => (
  <div>Chart Component: {config.title}</div>
)
const DummyText = ({ config }: { config: ComponentConfig }) => (
  <div>Text Component: {config.title}</div>
)

class Registry {
  private components = new Map<string, React.ComponentType<{ config: ComponentConfig }>>()

  constructor() {
    // Register defaults
    this.register('form', DummyForm)
    this.register('table', DummyTable)
    this.register('dashboard', DummyDashboard)
    this.register('chart', DummyChart)
    this.register('text', DummyText)
  }

  register(type: string, component: React.ComponentType<{ config: ComponentConfig }>) {
    this.components.set(type, component)
  }

  get(type: string): React.ComponentType<{ config: ComponentConfig }> {
    return (
      this.components.get(type) || (({ config }) => <UnknownComponentFallback type={config.type} />)
    )
  }
}

export const ComponentRegistry = new Registry()
