'use client'

interface ModelSelectorProps {
  models: string[]
  selected: string
  onSelect: (model: string) => void
}

export function ModelSelector({ models, selected, onSelect }: ModelSelectorProps) {
  if (models.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No models available
      </div>
    )
  }
  
  return (
    <select
      value={selected}
      onChange={(e) => onSelect(e.target.value)}
      className="bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-blue-500"
    >
      {models.map((model) => (
        <option key={model} value={model}>
          {model}
        </option>
      ))}
    </select>
  )
}
