'use client'

import { Message, Artifact, TEMPLATES } from '@/lib/types'

interface ChatHistoryProps {
  messages: Message[]
  isGenerating: boolean
  selectedArtifactId?: string
  onArtifactSelect: (artifact: Artifact) => void
}

export function ChatHistory({ messages, isGenerating, selectedArtifactId, onArtifactSelect }: ChatHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-medium text-gray-400 mb-4 px-4">Conversation</h2>

      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {messages.length === 0 && !isGenerating && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">No conversation yet</p>
            <p className="text-sm">Enter a prompt above to start generating code</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3">
            {/* Message Content */}
            <div
              className={`${
                message.role === 'user'
                  ? 'bg-blue-900/20 border-blue-800'
                  : 'bg-gray-800/50 border-gray-700'
              } border rounded-lg p-4`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-purple-600 text-white'
                }`}>
                  {message.role === 'user' ? 'U' : 'AI'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500 mb-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>

                  <div className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </div>
                </div>
              </div>
            </div>

            {/* Artifacts */}
            {message.artifacts && message.artifacts.length > 0 && (
              <div className="pl-10 space-y-2">
                {message.artifacts.map((artifact) => {
                  const template = TEMPLATES.find(t => t.id === artifact.template)
                  const isSelected = selectedArtifactId === artifact.id

                  return (
                    <button
                      key={artifact.id}
                      onClick={() => onArtifactSelect(artifact)}
                      className={`w-full text-left border rounded-lg p-3 transition-all ${
                        isSelected
                          ? 'bg-blue-900/30 border-blue-600 shadow-lg shadow-blue-900/20'
                          : 'bg-gray-800/80 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {template?.icon || '📄'}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-200 truncate">
                              {artifact.title}
                            </h3>
                            <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-700 rounded">
                              {template?.name || artifact.template}
                            </span>
                          </div>

                          {artifact.result && (
                            <div className={`text-xs flex items-center gap-1 ${
                              artifact.result.success ? 'text-green-400' : 'text-red-400'
                            }`}>
                              <span>{artifact.result.success ? '✓' : '✗'}</span>
                              <span>{artifact.result.success ? 'Executed' : 'Error'}</span>
                              {artifact.result.executionTime > 0 && (
                                <span className="text-gray-500">
                                  • {artifact.result.executionTime}ms
                                </span>
                              )}
                            </div>
                          )}

                          {!artifact.result && (
                            <div className="text-xs text-gray-500">
                              Click to preview
                            </div>
                          )}
                        </div>

                        {isSelected && (
                          <div className="flex-shrink-0 text-blue-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                AI
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                  Generating...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
