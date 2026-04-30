import React from 'react'
import { PageConfig, AppConfig } from 'shared-types'
import { ComponentRegistry } from './ComponentRegistry'
import { EngineErrorBoundary } from './EngineErrorBoundary'

interface DashboardRendererProps {
  page: PageConfig
  appConfig: AppConfig
  appId: string
}

export function DashboardRenderer({ page, appConfig, appId }: DashboardRendererProps) {
  return (
    <div className="space-y-6">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {page.components.map((config) => {
          const Component = ComponentRegistry.get(config.type)

          // Basic responsive width logic based on config type or metadata
          // For now, forms are half-width on large screens, tables are full width
          let colSpan = 'col-span-12'
          if (config.type === 'form') colSpan = 'col-span-12 lg:col-span-6'

          return (
            <div key={config.id} className={colSpan}>
              <EngineErrorBoundary componentId={config.id}>
                <Component config={config} appConfig={appConfig} appId={appId} />
              </EngineErrorBoundary>
            </div>
          )
        })}
      </div>
    </div>
  )
}
