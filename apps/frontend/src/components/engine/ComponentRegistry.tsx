import React from 'react'
import { ComponentConfig, AppConfig } from 'shared-types'
import { UnknownComponentFallback } from './UnknownComponentFallback'
import {
  ConfigurableForm,
  ConfigurableTable,
  ConfigurableDashboard,
  ConfigurableChart,
  ConfigurableText,
} from './ConfigurableWrappers'

export type ComponentProps = { config: ComponentConfig; appConfig: AppConfig; appId: string }

class Registry {
  private components = new Map<string, React.ComponentType<ComponentProps>>()

  constructor() {
    this.register('form', ConfigurableForm)
    this.register('table', ConfigurableTable)
    this.register('dashboard', ConfigurableDashboard)
    this.register('chart', ConfigurableChart)
    this.register('text', ConfigurableText)
  }

  register(type: string, component: React.ComponentType<ComponentProps>) {
    this.components.set(type, component)
  }

  get(type: string): React.ComponentType<ComponentProps> {
    return (
      this.components.get(type) || (({ config }) => <UnknownComponentFallback type={config.type} />)
    )
  }
}

export const ComponentRegistry = new Registry()
