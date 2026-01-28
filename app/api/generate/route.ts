import { NextRequest, NextResponse } from 'next/server'
import { generateCode, streamGenerateCode, checkOllamaHealth } from '@/lib/ollama'
import type { TemplateType } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, template, model, stream = false } = body as {
      prompt: string
      template: TemplateType
      model?: string
      stream?: boolean
    }
    
    if (!prompt || !template) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, template' },
        { status: 400 }
      )
    }
    
    // Check Ollama health
    const healthy = await checkOllamaHealth()
    if (!healthy) {
      return NextResponse.json(
        { error: 'Ollama is not available. Please ensure Ollama is running.' },
        { status: 503 }
      )
    }
    
    if (stream) {
      // Streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            await streamGenerateCode(
              { prompt, template, model },
              (chunk) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`))
              }
            )
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (err) {
            const error = err instanceof Error ? err.message : 'Unknown error'
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error })}\n\n`))
            controller.close()
          }
        }
      })
      
      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    }
    
    // Non-streaming response
    const result = await generateCode({ prompt, template, model })
    return NextResponse.json(result)
    
  } catch (err) {
    console.error('Generate error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
