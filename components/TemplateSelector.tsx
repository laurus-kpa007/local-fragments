'use client'

import { TEMPLATES, type TemplateType } from '@/lib/types'

interface TemplateSelectorProps {
  selected: TemplateType
  onSelect: (template: TemplateType) => void
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TEMPLATES.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selected === template.id
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <span>{template.icon}</span>
          <span>{template.name}</span>
        </button>
      ))}
    </div>
  )
}
