'use client'

import { useEffect, useRef, useState } from 'react'

interface CodeEditorProps {
  code: string
  language: string
  onChange?: (code: string) => void
  readOnly?: boolean
  streaming?: boolean
}

export function CodeEditor({ code, language, onChange, readOnly = false, streaming = false }: CodeEditorProps) {
  const [localCode, setLocalCode] = useState(code)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 외부에서 code prop이 변경되면 localCode 업데이트
  useEffect(() => {
    setLocalCode(code)
    // 스트리밍 중이면 스크롤을 맨 아래로
    if (streaming && textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight
    }
  }, [code, streaming])
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalCode(e.target.value)
    onChange?.(e.target.value)
  }
  
  const handleCopy = () => {
    navigator.clipboard.writeText(localCode)
  }
  
  return (
    <div className="relative h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 font-mono">{language}</span>
          {streaming && (
            <span className="flex items-center gap-1 text-xs text-blue-400">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Generating...
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Copy
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <textarea
          ref={textareaRef}
          value={localCode}
          onChange={handleChange}
          readOnly={readOnly}
          spellCheck={false}
          className="w-full h-full p-4 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none"
          style={{ minHeight: '300px' }}
        />
      </div>
    </div>
  )
}
