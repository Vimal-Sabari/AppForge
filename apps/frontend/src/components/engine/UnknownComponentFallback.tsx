import React from 'react'

export function UnknownComponentFallback({ type }: { type?: string }) {
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 my-2">
      <strong>Warning:</strong> Unknown component type {type ? `"${type}"` : 'provided'}. Check your
      configuration JSON.
    </div>
  )
}
