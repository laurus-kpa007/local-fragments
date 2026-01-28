'use client'

import { useEffect, useState } from 'react'
import type { HealthStatus } from '@/lib/types'

interface StatusIndicatorProps {
  onModelsLoaded?: (models: string[]) => void
}

export function StatusIndicator({ onModelsLoaded }: StatusIndicatorProps) {
  const [status, setStatus] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [])

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      setStatus(data)
      onModelsLoaded?.(data.models || [])
    } catch (error) {
      console.error('Health check failed:', error)
      setStatus({ ollama: false, docker: false, models: [] })
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
        <span>Checking services...</span>
      </div>
    )
  }
  
  return (
    <div className="flex items-center gap-4 text-sm">
      {/* Ollama Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status?.ollama ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className={status?.ollama ? 'text-green-400' : 'text-red-400'}>
          Ollama {status?.ollama ? `(${status.models.length} models)` : '(offline)'}
        </span>
      </div>

      {/* Docker Status with Tooltip */}
      <div className="relative">
        <div
          className="flex items-center gap-2 cursor-help"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className={`w-2 h-2 rounded-full ${status?.docker ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className={status?.docker ? 'text-green-400' : 'text-yellow-400'}>
            Docker {status?.docker ? '✓' : '⚠'}
          </span>
        </div>

        {/* Tooltip */}
        {showTooltip && !status?.docker && (
          <div className="absolute top-full mt-2 right-0 w-64 p-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 text-xs">
            <p className="text-yellow-400 font-medium mb-2">Docker is not running</p>
            <p className="text-gray-300 mb-2">
              Docker is required for Python and Node.js execution.
            </p>
            <p className="text-gray-400">
              HTML and Mermaid templates work without Docker.
            </p>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <p className="text-gray-400 text-xs">
                Start Docker Desktop to enable all features.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
