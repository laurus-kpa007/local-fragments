'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { TemplateSelector } from '@/components/TemplateSelector'
import { CodeEditor } from '@/components/CodeEditor'
import { ResultPreview } from '@/components/ResultPreview'
import { StatusIndicator } from '@/components/StatusIndicator'
import { ModelSelector } from '@/components/ModelSelector'
import { ChatHistory } from '@/components/ChatHistory'
import { TEMPLATES, type TemplateType, type ExecutionResult, type Message, type Artifact } from '@/lib/types'

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [template, setTemplate] = useState<TemplateType>('html')
  const [code, setCode] = useState('')
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const currentTemplate = TEMPLATES.find(t => t.id === template)

  // 아티팩트 타이틀 생성
  const generateArtifactTitle = (prompt: string, template: TemplateType): string => {
    const shortPrompt = prompt.slice(0, 40)
    const tmpl = TEMPLATES.find(t => t.id === template)
    return `${tmpl?.icon || '📄'} ${shortPrompt}${prompt.length > 40 ? '...' : ''}`
  }

  // 아티팩트 선택 핸들러
  const handleArtifactSelect = useCallback((artifact: Artifact) => {
    setSelectedArtifact(artifact)
    setCode(artifact.code)
    setTemplate(artifact.template)
    setResult(artifact.result || null)
  }, [])

  // localStorage에서 저장된 모델 불러오기
  useEffect(() => {
    const savedModel = localStorage.getItem('selectedModel')
    if (savedModel) {
      setSelectedModel(savedModel)
    }
  }, [])

  // 모델 선택 시 localStorage에 저장
  const handleModelSelect = useCallback((model: string) => {
    setSelectedModel(model)
    localStorage.setItem('selectedModel', model)
  }, [])

  const handleModelsLoaded = useCallback((loadedModels: string[]) => {
    setModels(loadedModels)

    // localStorage에 저장된 모델 확인
    const savedModel = localStorage.getItem('selectedModel')

    if (savedModel && loadedModels.includes(savedModel)) {
      // 저장된 모델이 있고 사용 가능하면 사용
      setSelectedModel(savedModel)
    } else if (loadedModels.length > 0 && !selectedModel) {
      // 저장된 모델이 없거나 사용 불가능하면 기본값 설정
      const gemma = loadedModels.find(m => m.includes('gemma'))
      const defaultModel = gemma || loadedModels[0]
      setSelectedModel(defaultModel)
      localStorage.setItem('selectedModel', defaultModel)
    }
  }, [selectedModel])
  
  // 스트리밍 코드 생성
  const handleGenerate = async () => {
    if (!prompt.trim()) return

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      template,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsGenerating(true)
    setError(null)
    setCode('')
    setResult(null)
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          template,
          model: selectedModel,
          stream: true  // 스트리밍 활성화
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Generation failed')
      }
      
      // 스트리밍 응답 처리
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')
      
      const decoder = new TextDecoder()
      let accumulatedCode = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))
        
        for (const line of lines) {
          const data = line.slice(6) // 'data: ' 제거
          
          if (data === '[DONE]') {
            // 스트리밍 완료
            break
          }
          
          try {
            const json = JSON.parse(data)
            if (json.chunk) {
              accumulatedCode += json.chunk
              setCode(accumulatedCode)
            }
            if (json.error) {
              throw new Error(json.error)
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue // JSON 파싱 에러 무시
            throw e
          }
        }
      }
      
      // 스트리밍 완료 후 코드 정리 (마크다운 코드블록 제거)
      const cleanedCode = extractCode(accumulatedCode, template)
      setCode(cleanedCode)

      // 아티팩트 생성
      const artifact: Artifact = {
        id: `artifact-${Date.now()}`,
        title: generateArtifactTitle(prompt, template),
        code: cleanedCode,
        template
      }

      // 어시스턴트 메시지 추가
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've created a ${currentTemplate?.name || template} for you.`,
        artifacts: [artifact],
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])

      // 자동으로 아티팩트 선택
      setSelectedArtifact(artifact)

      // HTML, Word, Mermaid는 자동 실행 (execute API 호출)
      if (template === 'html' || template === 'mermaid' || template === 'word') {
        setIsGenerating(false)
        await handleExecute(cleanedCode)
        return
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // 사용자가 취소함
        return
      }
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)

      // 에러 메시지 추가
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMsg}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
      setPrompt('') // 프롬프트 초기화
    }
  }
  
  // 코드 추출 (마크다운 코드블록 제거)
  const extractCode = (content: string, tmpl: TemplateType): string => {
    let code = content.trim()
    
    // ```language ... ``` 블록 제거
    const codeBlockRegex = /```(?:\w+)?\s*\n?([\s\S]*?)```/g
    const matches = [...code.matchAll(codeBlockRegex)]
    
    if (matches.length > 0) {
      code = matches[matches.length - 1][1].trim()
    }
    
    // HTML은 DOCTYPE이나 < 로 시작해야 함
    if (tmpl === 'html' && !code.startsWith('<!') && !code.startsWith('<')) {
      const htmlMatch = code.match(/<(!DOCTYPE|html|head|body|div|section|main)[^]*$/i)
      if (htmlMatch) {
        code = htmlMatch[0]
      }
    }
    
    return code
  }
  
  const handleExecute = async (codeToExecute?: string) => {
    const execCode = codeToExecute || code
    if (!execCode.trim()) return
    
    setIsExecuting(true)
    setError(null)
    
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: execCode,
          template
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Execution failed')
      }
      
      setResult(data)

      // 실행 결과를 마지막 어시스턴트 메시지의 아티팩트에 업데이트
      setMessages(prev => {
        const updated = [...prev]
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant' && updated[i].artifacts) {
            const artifacts = updated[i].artifacts!
            const artifactIdx = artifacts.findIndex(a => a.id === selectedArtifact?.id)
            if (artifactIdx >= 0) {
              artifacts[artifactIdx] = { ...artifacts[artifactIdx], result: data }
              // selectedArtifact도 업데이트
              if (selectedArtifact?.id === artifacts[artifactIdx].id) {
                setSelectedArtifact(artifacts[artifactIdx])
              }
              break
            }
          }
        }
        return updated
      })

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMsg)
      const errorResult = {
        success: false,
        output: '',
        error: errorMsg,
        files: [],
        executionTime: 0
      }
      setResult(errorResult)

      // 실행 에러를 마지막 어시스턴트 메시지의 아티팩트에 업데이트
      setMessages(prev => {
        const updated = [...prev]
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant' && updated[i].artifacts) {
            const artifacts = updated[i].artifacts!
            const artifactIdx = artifacts.findIndex(a => a.id === selectedArtifact?.id)
            if (artifactIdx >= 0) {
              artifacts[artifactIdx] = { ...artifacts[artifactIdx], result: errorResult }
              // selectedArtifact도 업데이트
              if (selectedArtifact?.id === artifacts[artifactIdx].id) {
                setSelectedArtifact(artifacts[artifactIdx])
              }
              break
            }
          }
        }
        return updated
      })
    } finally {
      setIsExecuting(false)
    }
  }
  
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsGenerating(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate()
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">
              <span className="text-blue-400">Local</span> Fragments
            </h1>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
              Ollama + Docker
            </span>
          </div>
          <StatusIndicator onModelsLoaded={handleModelsLoaded} />
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Conversation */}
        <div className="w-1/2 border-r border-gray-800 flex flex-col">
          {/* Controls */}
          <div className="p-6 border-b border-gray-800 flex-shrink-0 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TemplateSelector selected={template} onSelect={setTemplate} />
              <ModelSelector
                models={models}
                selected={selectedModel}
                onSelect={handleModelSelect}
              />
            </div>

            {/* Prompt Input */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={currentTemplate?.example || 'Describe what you want to create...'}
                rows={3}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <span className="text-xs text-gray-500 hidden sm:inline">⌘+Enter</span>
                {isGenerating ? (
                  <button
                    onClick={handleStop}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || !selectedModel}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
                  >
                    Generate
                  </button>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-hidden">
            <ChatHistory
              messages={messages}
              isGenerating={isGenerating}
              selectedArtifactId={selectedArtifact?.id}
              onArtifactSelect={handleArtifactSelect}
            />
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 flex flex-col bg-gray-900">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-medium text-gray-400">Preview</h2>
              {selectedArtifact && (
                <span className="text-xs text-gray-500 px-2 py-1 bg-gray-800 rounded">
                  {TEMPLATES.find(t => t.id === selectedArtifact.template)?.name || selectedArtifact.template}
                </span>
              )}
            </div>
            {code && selectedArtifact && selectedArtifact.template !== 'html' && selectedArtifact.template !== 'mermaid' && selectedArtifact.template !== 'word' && !isGenerating && (
              <button
                onClick={() => handleExecute()}
                disabled={isExecuting}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded text-xs font-medium transition-colors"
              >
                {isExecuting ? 'Running...' : '▶ Run'}
              </button>
            )}
          </div>

          <div className="flex-1 overflow-auto p-6">
            {selectedArtifact ? (
              <ResultPreview
                result={result}
                template={selectedArtifact.template}
                code={code}
                streaming={isGenerating}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-lg mb-2">No artifact selected</p>
                  <p className="text-sm">Generate code or select an artifact to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
