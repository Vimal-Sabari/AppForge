'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/shared/AppHeader'
import { useAuthStore } from '@/lib/store/auth.store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { Save, Trash2, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

const MonacoEditor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.default), {
  ssr: false,
})

export default function AppSettingsPage({ params }: { params: { appId: string } }) {
  const router = useRouter()
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const appId = params?.appId

  const [jsonInput, setJsonInput] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const { data: appData, isLoading } = useQuery({
    queryKey: ['apps', appId],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to fetch app')
      return res.json()
    },
    enabled: !!accessToken,
  })

  useEffect(() => {
    if (appData?.config) {
      setJsonInput(JSON.stringify(appData.config, null, 2))
    }
  }, [appData])

  const updateMutation = useMutation({
    mutationFn: async (configStr: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: configStr,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update app')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      queryClient.invalidateQueries({ queryKey: ['apps', appId] })
      setWarnings(data.warnings || [])
      setError(null)
      // alert('Settings saved successfully');
    },
    onError: (err) => {
      setError(err.message)
      setWarnings([])
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/apps/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Failed to delete app')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apps'] })
      router.push('/dashboard')
    },
  })

  const handleSave = () => {
    try {
      JSON.parse(jsonInput)
      updateMutation.mutate(jsonInput)
    } catch (e) {
      setError('Invalid JSON format')
    }
  }

  const handleDelete = () => {
    if (deleteConfirmText === appData?.name) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader appName={appData?.name || 'Settings'} appId={appId} />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Update your configuration or delete this app
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 bg-white rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm text-sm font-medium"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete App
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0" />
              <div>
                <strong className="text-amber-800 text-sm block mb-1">
                  Configuration Warnings
                </strong>
                <ul className="list-disc pl-5 text-sm text-amber-700 space-y-1">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-grow flex flex-col overflow-hidden h-[600px]">
          <div className="p-3 border-b border-gray-200 bg-gray-50 text-sm font-medium text-gray-700">
            Configuration (JSON)
          </div>
          <div className="flex-grow">
            <MonacoEditor
              language="json"
              theme="vs-light"
              value={jsonInput}
              onChange={(val) => setJsonInput(val || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                formatOnPaste: true,
              }}
            />
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Application</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              <strong>{appData?.name}</strong> application and all its associated data.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Please type <strong>{appData?.name}</strong> to confirm.
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={appData?.name}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium transition-colors">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={handleDelete}
              disabled={deleteConfirmText !== appData?.name || deleteMutation.isPending}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete App'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
