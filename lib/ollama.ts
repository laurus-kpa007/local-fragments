const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gemma3:27b'

export type TemplateType = 'html' | 'python' | 'python-chart' | 'node' | 'mermaid'

const SYSTEM_PROMPTS: Record<TemplateType, string> = {
  html: `You are an expert HTML/CSS developer. Generate clean, modern HTML with inline CSS.
Rules:
- Output ONLY valid HTML code, no explanations
- Include all CSS in a <style> tag in the head
- Use modern CSS (flexbox, grid, variables)
- Make it responsive
- Include <!DOCTYPE html> declaration
- Do NOT use any external resources or CDN links
- For images, use ONLY these options:
  1. CSS gradients, shapes, or backgrounds instead of <img> tags
  2. SVG inline in the HTML
  3. Placeholder images from https://via.placeholder.com/WIDTHxHEIGHT
- NEVER use broken image URLs like https://source.unsplash.com or local paths
- Prefer CSS-only solutions (gradients, shapes, icons) over images when possible`,

  python: `You are an expert Python developer. Generate clean, working Python code.
Rules:
- Output ONLY valid Python code, no explanations
- Include all necessary imports
- Handle errors gracefully
- Print results to stdout
- Do NOT use input() or any interactive functions`,

  'python-chart': `You are an expert data visualization developer. Generate Python code that creates charts.
Rules:
- Output ONLY valid Python code, no explanations
- Use matplotlib for charts with Korean font support
- ALWAYS include these font settings at the start:
  import matplotlib.pyplot as plt
  import matplotlib.font_manager as fm
  plt.rcParams['font.family'] = 'NanumGothic'
  plt.rcParams['axes.unicode_minus'] = False
- Save the figure to '/output/chart.png' with plt.savefig('/output/chart.png', dpi=150, bbox_inches='tight')
- Do NOT call plt.show()
- Include sample data if not provided
- Use a clean, modern style
- All text labels, titles, and legends should support Korean characters`,

  node: `You are an expert Node.js developer. Generate clean JavaScript code.
Rules:
- Output ONLY valid JavaScript code, no explanations
- Use modern ES6+ syntax
- Use ONLY Node.js built-in modules (fs, path, http, crypto, etc.)
- Do NOT use external npm packages (express, axios, lodash, etc.)
- For simple apps, use pure JavaScript without any imports
- Print results with console.log
- Do NOT use readline or any interactive input
- If the task requires complex libraries, implement a simplified version using built-in modules`,

  mermaid: `You are an expert in creating Mermaid diagrams. Generate valid Mermaid syntax.
Rules:
- Output ONLY valid Mermaid code, no explanations
- Do NOT include the \`\`\`mermaid code fence
- Start directly with the diagram type (flowchart, sequenceDiagram, etc.)
- Use clear, readable labels
- Keep diagrams reasonably sized`,

  word: `You are an expert document designer. Generate A4-formatted HTML documents that look like professional Word documents.
Rules:
- Output ONLY valid HTML code, no explanations
- Include all CSS in a <style> tag in the head
- Create A4 page format (210mm × 297mm) with proper margins
- Use print-friendly styles (@page, page-break rules)
- Support Korean fonts (Arial, Malgun Gothic, Nanum Gothic)
- Include proper document structure (header, body, footer if needed)
- Use professional typography and spacing
- For images, use ONLY these options:
  1. CSS gradients, shapes, or backgrounds instead of <img> tags
  2. SVG inline in the HTML
  3. Placeholder images from https://via.placeholder.com/WIDTHxHEIGHT
- NEVER use broken image URLs like https://source.unsplash.com or local paths
- Include print button and download functionality
- Make it look professional and clean like a real document`
}

export interface GenerateOptions {
  prompt: string
  template: TemplateType
  model?: string
}

export interface GenerateResult {
  code: string
  model: string
  template: TemplateType
}

function extractCode(content: string, template: TemplateType): string {
  // Remove markdown code fences if present
  let code = content.trim()
  
  // Handle ```language ... ``` blocks
  const codeBlockRegex = /```(?:\w+)?\s*\n?([\s\S]*?)```/g
  const matches = [...code.matchAll(codeBlockRegex)]
  
  if (matches.length > 0) {
    // Get the last code block (usually the main code)
    code = matches[matches.length - 1][1].trim()
  }
  
  // For HTML, ensure it starts with DOCTYPE or <
  if (template === 'html' && !code.startsWith('<!') && !code.startsWith('<')) {
    // Try to find HTML content
    const htmlMatch = code.match(/<(!DOCTYPE|html|head|body|div|section|main)[^]*$/i)
    if (htmlMatch) {
      code = htmlMatch[0]
    }
  }
  
  return code
}

export async function generateCode(options: GenerateOptions): Promise<GenerateResult> {
  const { prompt, template, model = DEFAULT_MODEL } = options
  
  const systemPrompt = SYSTEM_PROMPTS[template]
  
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 4096
      }
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Ollama error: ${error}`)
  }
  
  const data = await response.json()
  const rawContent = data.message?.content || ''
  const code = extractCode(rawContent, template)
  
  return {
    code,
    model,
    template
  }
}

export async function streamGenerateCode(
  options: GenerateOptions,
  onChunk: (chunk: string) => void
): Promise<GenerateResult> {
  const { prompt, template, model = DEFAULT_MODEL } = options
  
  const systemPrompt = SYSTEM_PROMPTS[template]
  
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: true,
      options: {
        temperature: 0.7,
        num_predict: 4096
      }
    })
  })
  
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`)
  }
  
  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')
  
  const decoder = new TextDecoder()
  let fullContent = ''
  
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    const lines = chunk.split('\n').filter(line => line.trim())
    
    for (const line of lines) {
      try {
        const json = JSON.parse(line)
        if (json.message?.content) {
          fullContent += json.message.content
          onChunk(json.message.content)
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  }
  
  return {
    code: extractCode(fullContent, template),
    model,
    template
  }
}

export async function listModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`)
    if (!response.ok) return []
    
    const data = await response.json()
    return data.models?.map((m: { name: string }) => m.name) || []
  } catch {
    return []
  }
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000)
    })
    return response.ok
  } catch {
    return false
  }
}
