export type TemplateType = 'html' | 'python' | 'python-chart' | 'node' | 'mermaid' | 'word'

export interface Template {
  id: TemplateType
  name: string
  description: string
  icon: string
  language: string
  example: string
}

export const TEMPLATES: Template[] = [
  {
    id: 'html',
    name: 'HTML/CSS',
    description: 'Generate web pages with HTML and CSS',
    icon: '🌐',
    language: 'html',
    example: 'Create a modern login page with email and password fields'
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Run Python scripts',
    icon: '🐍',
    language: 'python',
    example: 'Calculate fibonacci numbers up to 100'
  },
  {
    id: 'python-chart',
    name: 'Python Chart',
    description: 'Create data visualizations with matplotlib',
    icon: '📊',
    language: 'python',
    example: 'Create a bar chart showing monthly sales data'
  },
  {
    id: 'node',
    name: 'JavaScript',
    description: 'Run Node.js scripts (built-in modules only)',
    icon: '⚡',
    language: 'javascript',
    example: 'Calculate hash of a string using crypto module'
  },
  {
    id: 'mermaid',
    name: 'Mermaid Diagram',
    description: 'Create diagrams with Mermaid syntax',
    icon: '📐',
    language: 'mermaid',
    example: 'Create a flowchart for user authentication'
  },
  {
    id: 'word',
    name: 'Word Document',
    description: 'Generate A4 formatted documents',
    icon: '📄',
    language: 'html',
    example: 'Create a business proposal document'
  }
]

export interface Artifact {
  id: string
  title: string
  code: string
  template: TemplateType
  result?: ExecutionResult
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  artifacts?: Artifact[]
  timestamp: Date
}

export interface ExecutionResult {
  success: boolean
  output: string
  error: string | null
  files: { name: string; content: string; type: string }[]
  executionTime: number
}

export interface GenerateRequest {
  prompt: string
  template: TemplateType
  model?: string
}

export interface GenerateResponse {
  code: string
  model: string
  template: TemplateType
}

export interface ExecuteRequest {
  code: string
  template: TemplateType
}

export interface ExecuteResponse extends ExecutionResult {}

export interface HealthStatus {
  ollama: boolean
  docker: boolean
  models: string[]
}
