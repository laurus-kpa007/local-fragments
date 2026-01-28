import Docker from 'dockerode'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'

// Docker 설정 - Windows/Linux 호환
function getDockerConfig() {
  if (process.platform === 'win32') {
    // Windows: Named pipe 사용
    return {
      socketPath: '\\\\.\\pipe\\docker_engine'
    }
  } else {
    // Linux/Mac: Unix socket 사용
    return {
      socketPath: process.env.DOCKER_HOST || '/var/run/docker.sock'
    }
  }
}

const docker = new Docker(getDockerConfig())

const MAX_EXECUTION_TIME = parseInt(process.env.MAX_EXECUTION_TIME || '30000')
const MAX_MEMORY_MB = parseInt(process.env.MAX_MEMORY_MB || '512')

export interface ExecuteResult {
  success: boolean
  output: string
  error: string | null
  files: { name: string; content: string; type: string }[]
  executionTime: number
}

interface ContainerConfig {
  image: string
  cmd: string[]
  workdir: string
}

const CONTAINER_CONFIGS: Record<string, ContainerConfig> = {
  python: {
    image: 'python:3.11-slim',
    cmd: ['python', '/code/main.py'],
    workdir: '/code'
  },
  'python-chart': {
    image: 'local-sandbox-python',
    cmd: ['python', '/code/main.py'],
    workdir: '/code'
  },
  node: {
    image: 'node:20-slim',
    cmd: ['node', '/code/main.js'],
    workdir: '/code'
  }
}

async function ensureImage(imageName: string): Promise<void> {
  try {
    await docker.getImage(imageName).inspect()
  } catch {
    // Image doesn't exist, try to pull it
    if (!imageName.startsWith('local-')) {
      console.log(`Pulling image: ${imageName}`)
      await new Promise<void>((resolve, reject) => {
        docker.pull(imageName, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err)
          docker.modem.followProgress(stream, (err: Error | null) => {
            if (err) reject(err)
            else resolve()
          })
        })
      })
    } else {
      throw new Error(`Local image ${imageName} not found. Please build it first.`)
    }
  }
}

// Windows 경로를 Docker 볼륨 마운트 형식으로 변환
function convertWindowsPath(windowsPath: string): string {
  if (process.platform === 'win32') {
    // C:\Users\... → /c/Users/...
    return windowsPath
      .replace(/\\/g, '/')
      .replace(/^([A-Z]):/, (_, drive) => `/${drive.toLowerCase()}`)
  }
  return windowsPath
}

export async function executeCode(
  code: string,
  language: 'python' | 'python-chart' | 'node'
): Promise<ExecuteResult> {
  const startTime = Date.now()
  const config = CONTAINER_CONFIGS[language]
  const sessionId = uuidv4()

  // Create temp directory for code and output
  const tempDir = path.join(os.tmpdir(), `sandbox-${sessionId}`)
  const codeDir = path.join(tempDir, 'code')
  const outputDir = path.join(tempDir, 'output')

  await fs.mkdir(codeDir, { recursive: true })
  await fs.mkdir(outputDir, { recursive: true })

  // Write code to file
  const filename = language === 'node' ? 'main.js' : 'main.py'
  await fs.writeFile(path.join(codeDir, filename), code)
  
  try {
    await ensureImage(config.image)
    
    // Windows에서 Docker 볼륨 마운트를 위한 경로 변환
    const dockerCodeDir = convertWindowsPath(codeDir)
    const dockerOutputDir = convertWindowsPath(outputDir)

    const container = await docker.createContainer({
      Image: config.image,
      Cmd: config.cmd,
      WorkingDir: config.workdir,
      NetworkDisabled: true,
      HostConfig: {
        Memory: MAX_MEMORY_MB * 1024 * 1024,
        MemorySwap: MAX_MEMORY_MB * 1024 * 1024,
        CpuPeriod: 100000,
        CpuQuota: 50000,
        AutoRemove: false,
        Binds: [
          `${dockerCodeDir}:/code:ro`,
          `${dockerOutputDir}:/output:rw`
        ]
      }
    })
    
    await container.start()
    
    // Wait for container with timeout
    const waitPromise = container.wait()
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), MAX_EXECUTION_TIME)
    })
    
    let exitCode: number
    try {
      const result = await Promise.race([waitPromise, timeoutPromise])
      exitCode = result.StatusCode
    } catch (err) {
      // Timeout - kill container
      try {
        await container.kill()
      } catch {
        // Container might already be stopped
      }
      throw err
    }
    
    // Get logs
    const logs = await container.logs({
      stdout: true,
      stderr: true,
      follow: false
    })
    
    // Parse logs (Docker logs have 8-byte header per line)
    const output = parseDockerLogs(logs)
    
    // Check for output files
    const files: { name: string; content: string; type: string }[] = []
    try {
      const outputFiles = await fs.readdir(outputDir)
      for (const file of outputFiles) {
        const filePath = path.join(outputDir, file)
        const stat = await fs.stat(filePath)
        
        if (stat.isFile() && stat.size < 5 * 1024 * 1024) { // Max 5MB
          const ext = path.extname(file).toLowerCase()
          const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)
          
          if (isImage) {
            const content = await fs.readFile(filePath)
            files.push({
              name: file,
              content: content.toString('base64'),
              type: `image/${ext.slice(1)}`
            })
          } else {
            const content = await fs.readFile(filePath, 'utf-8')
            files.push({
              name: file,
              content,
              type: 'text/plain'
            })
          }
        }
      }
    } catch {
      // No output files
    }
    
    // Cleanup
    await container.remove()
    await fs.rm(tempDir, { recursive: true, force: true })
    
    return {
      success: exitCode === 0,
      output: output.stdout,
      error: exitCode !== 0 ? output.stderr || `Exit code: ${exitCode}` : null,
      files,
      executionTime: Date.now() - startTime
    }
    
  } catch (err) {
    // Cleanup on error
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
    
    return {
      success: false,
      output: '',
      error: err instanceof Error ? err.message : 'Unknown error',
      files: [],
      executionTime: Date.now() - startTime
    }
  }
}

function parseDockerLogs(buffer: Buffer): { stdout: string; stderr: string } {
  let stdout = ''
  let stderr = ''
  let offset = 0
  
  while (offset < buffer.length) {
    if (offset + 8 > buffer.length) break
    
    const streamType = buffer[offset]
    const size = buffer.readUInt32BE(offset + 4)
    
    if (offset + 8 + size > buffer.length) break
    
    const content = buffer.slice(offset + 8, offset + 8 + size).toString('utf-8')
    
    if (streamType === 1) {
      stdout += content
    } else if (streamType === 2) {
      stderr += content
    }
    
    offset += 8 + size
  }
  
  // Fallback: treat entire buffer as stdout if parsing fails
  if (stdout === '' && stderr === '' && buffer.length > 0) {
    stdout = buffer.toString('utf-8')
  }
  
  return { stdout, stderr }
}

export async function executeHtml(code: string): Promise<ExecuteResult> {
  const startTime = Date.now()
  
  // Sanitize HTML (basic XSS prevention)
  // Note: For production, use a proper HTML sanitizer
  const sanitizedCode = code
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<!-- scripts removed -->')
  
  return {
    success: true,
    output: sanitizedCode,
    error: null,
    files: [],
    executionTime: Date.now() - startTime
  }
}

export async function checkDockerHealth(): Promise<boolean> {
  try {
    await docker.ping()
    return true
  } catch (error) {
    console.error('Docker health check failed:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return false
  }
}

export async function getDockerInfo(): Promise<string | null> {
  try {
    const info = await docker.info()
    return `Docker is running (Version: ${info.ServerVersion})`
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT') || error.message.includes('connect')) {
        return 'Docker is not running. Please start Docker Desktop.'
      }
      return `Docker error: ${error.message}`
    }
    return 'Docker is not available'
  }
}

export async function buildPythonSandboxImage(): Promise<void> {
  const dockerfileContent = `
FROM python:3.11-slim

RUN pip install --no-cache-dir \\
    matplotlib \\
    pandas \\
    numpy \\
    seaborn \\
    plotly

RUN useradd -m sandbox
USER sandbox
WORKDIR /code

RUN mkdir -p /output
`
  
  const tempDir = path.join(os.tmpdir(), `docker-build-${uuidv4()}`)
  await fs.mkdir(tempDir, { recursive: true })
  await fs.writeFile(path.join(tempDir, 'Dockerfile'), dockerfileContent)
  
  try {
    const stream = await docker.buildImage(
      { context: tempDir, src: ['Dockerfile'] },
      { t: 'local-sandbox-python' }
    )
    
    await new Promise<void>((resolve, reject) => {
      docker.modem.followProgress(stream, (err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })
    })
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true })
  }
}
