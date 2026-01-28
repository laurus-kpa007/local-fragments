import { NextRequest, NextResponse } from 'next/server'
import { executeCode, executeHtml, checkDockerHealth } from '@/lib/docker'
import type { TemplateType } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, template } = body as {
      code: string
      template: TemplateType
    }
    
    if (!code || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: code, template' },
        { status: 400 }
      )
    }
    
    // HTML and Word don't need Docker
    if (template === 'html' || template === 'word') {
      const result = await executeHtml(code)
      return NextResponse.json(result)
    }

    // Mermaid is client-side only
    if (template === 'mermaid') {
      return NextResponse.json({
        success: true,
        output: code,
        error: null,
        files: [],
        executionTime: 0
      })
    }
    
    // Check Docker health for other templates
    const dockerHealthy = await checkDockerHealth()
    if (!dockerHealthy) {
      return NextResponse.json(
        { error: 'Docker is not available. Please ensure Docker is running.' },
        { status: 503 }
      )
    }
    
    // Execute in Docker
    let result
    switch (template) {
      case 'python':
      case 'python-chart':
        result = await executeCode(code, template)
        break
      case 'node':
        result = await executeCode(code, 'node')
        break
      default:
        return NextResponse.json(
          { error: `Unsupported template: ${template}` },
          { status: 400 }
        )
    }
    
    return NextResponse.json(result)
    
  } catch (err) {
    console.error('Execute error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
