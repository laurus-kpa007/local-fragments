import { NextResponse } from 'next/server'
import { checkOllamaHealth, listModels } from '@/lib/ollama'
import { checkDockerHealth } from '@/lib/docker'

export async function GET() {
  const [ollamaHealthy, dockerHealthy, models] = await Promise.all([
    checkOllamaHealth(),
    checkDockerHealth(),
    listModels()
  ])
  
  return NextResponse.json({
    ollama: ollamaHealthy,
    docker: dockerHealthy,
    models
  })
}
