'use client'

import { useEffect, useRef, useState } from 'react'
import type { ExecutionResult, TemplateType } from '@/lib/types'

interface ResultPreviewProps {
  result: ExecutionResult | null
  template: TemplateType
  code?: string
  streaming?: boolean
}

export function ResultPreview({ result, template, code, streaming = false }: ResultPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [mermaidSvg, setMermaidSvg] = useState<string>('')
  const [mermaidError, setMermaidError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [showSource, setShowSource] = useState(false)
  const [htmlError, setHtmlError] = useState<string | null>(null)
  
  // HTML/Word 실시간 프리뷰 - 스트리밍 중에도 업데이트
  useEffect(() => {
    if ((template === 'html' || template === 'word') && code && iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        try {
          setHtmlError(null)
          doc.open()
          doc.write(code)
          doc.close()

          // 이미지 로드 오류 처리
          const images = doc.getElementsByTagName('img')
          Array.from(images).forEach((img) => {
            img.onerror = () => {
              console.warn('Image failed to load:', img.src)
              img.style.border = '2px dashed #ef4444'
              img.style.padding = '10px'
              img.style.background = '#fee'
              img.alt = `❌ Failed to load: ${img.src}`
            }
          })
        } catch (err) {
          console.error('Error rendering HTML:', err)
          setHtmlError(err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }
  }, [code, template])

  // 결과가 있을 때 HTML/Word 프리뷰
  useEffect(() => {
    if ((template === 'html' || template === 'word') && result?.success && result.output && iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        try {
          doc.open()
          doc.write(result.output)
          doc.close()

          // 이미지 로드 오류 처리
          const images = doc.getElementsByTagName('img')
          Array.from(images).forEach((img) => {
            img.onerror = () => {
              console.warn('Image failed to load:', img.src)
              img.style.border = '2px solid red'
              img.alt = `Failed to load: ${img.src}`
            }
          })
        } catch (err) {
          console.error('Error rendering HTML:', err)
        }
      }
    }
  }, [result, template])
  
  // Mermaid 다이어그램 - 스트리밍 완료 후 렌더링
  useEffect(() => {
    if (template === 'mermaid' && code && !streaming) {
      renderMermaid(code)
    }
  }, [template, code, streaming])
  
  const renderMermaid = async (mermaidCode: string) => {
    try {
      setMermaidError(null)
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({ 
        startOnLoad: false, 
        theme: 'dark',
        securityLevel: 'loose'
      })
      
      const id = `mermaid-${Date.now()}`
      const { svg } = await mermaid.render(id, mermaidCode)
      setMermaidSvg(svg)
    } catch (err) {
      console.error('Mermaid render error:', err)
      setMermaidError(err instanceof Error ? err.message : 'Unknown error')
      setMermaidSvg('')
    }
  }
  
  // HTML/Word를 DOCX로 Export
  const handleExportDocx = async () => {
    if (!code || (template !== 'html' && template !== 'word')) return
    
    setIsExporting(true)
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          html: code,
          filename: `export-${Date.now()}`
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }
      
      // Blob 다운로드
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `export-${Date.now()}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (err) {
      console.error('Export error:', err)
      alert(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }
  
  // HTML/Word 실시간 프리뷰 (스트리밍 중 + 완료 후)
  if (template === 'html' || template === 'word') {
    return (
      <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
        <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-sm text-gray-400">Preview</span>
          {streaming && (
            <span className="ml-2 flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {result?.executionTime && !streaming && (
              <span className="text-xs text-gray-500">
                {result.executionTime}ms
              </span>
            )}
            {code && !streaming && (
              <>
                <button
                  onClick={() => setShowSource(!showSource)}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs font-medium transition-colors"
                >
                  {showSource ? 'Preview' : 'Source'}
                </button>
                <button
                  onClick={handleExportDocx}
                  disabled={isExporting}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded text-xs font-medium transition-colors flex items-center gap-1"
                >
                  {isExporting ? (
                    <>
                      <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export DOCX
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {htmlError && (
          <div className="px-4 py-2 bg-red-900/30 border-b border-red-800 text-red-300 text-xs">
            Error: {htmlError}
          </div>
        )}

        {showSource ? (
          <div className="flex-1 overflow-auto p-4 bg-gray-950">
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
              {code}
            </pre>
          </div>
        ) : (
          <div className="flex-1 bg-white">
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          </div>
        )}
      </div>
    )
  }
  
  // Mermaid 다이어그램
  if (template === 'mermaid') {
    return (
      <div className="h-full bg-gray-900 rounded-lg overflow-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400">Mermaid Diagram</span>
          {streaming && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Waiting for complete code...
            </span>
          )}
        </div>
        {mermaidError ? (
          <div className="flex items-center justify-center h-64 text-red-400 text-sm">
            Mermaid Error: {mermaidError}
          </div>
        ) : mermaidSvg ? (
          <div 
            className="flex justify-center items-center min-h-[300px]"
            dangerouslySetInnerHTML={{ __html: mermaidSvg }}
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            {streaming ? 'Generating diagram code...' : 'Generate a diagram to see preview'}
          </div>
        )}
      </div>
    )
  }

  // 결과 없을 때
  if (!result) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <p className="text-gray-500">Run code to see results</p>
      </div>
    )
  }
  
  // Python/Node 출력
  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-gray-400">Output</span>
        <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
          result?.success ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
        }`}>
          {result?.success ? 'Success' : 'Error'}
        </span>
        {result?.executionTime && (
          <span className="ml-auto text-xs text-gray-500">
            {result.executionTime}ms
          </span>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {/* Console output */}
        {result?.output && (
          <div className="mb-4">
            <pre className="text-sm text-gray-100 font-mono whitespace-pre-wrap">
              {result.output}
            </pre>
          </div>
        )}
        
        {/* Error output */}
        {result?.error && (
          <div className="mb-4 p-3 bg-red-900/30 rounded border border-red-800">
            <pre className="text-sm text-red-300 font-mono whitespace-pre-wrap">
              {result.error}
            </pre>
          </div>
        )}
        
        {/* Generated files (images, etc.) */}
        {result?.files && result.files.length > 0 && (
          <div className="space-y-4">
            {result.files.map((file, index) => (
              <div key={index} className="border border-gray-700 rounded-lg overflow-hidden">
                <div className="px-3 py-2 bg-gray-800 text-sm text-gray-400">
                  {file.name}
                </div>
                {file.type.startsWith('image/') ? (
                  <div className="p-4 bg-white flex justify-center">
                    <img
                      src={`data:${file.type};base64,${file.content}`}
                      alt={file.name}
                      className="max-w-full h-auto"
                    />
                  </div>
                ) : (
                  <pre className="p-4 text-sm text-gray-100 font-mono overflow-auto">
                    {file.content}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Empty state */}
        {!result?.output && !result?.error && (!result?.files || result.files.length === 0) && (
          <p className="text-gray-500">No output</p>
        )}
      </div>
    </div>
  )
}
