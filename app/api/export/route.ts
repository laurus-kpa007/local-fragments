import { NextRequest, NextResponse } from 'next/server'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  LevelFormat,
} from 'docx'

// HTML 엔티티 디코딩
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&ndash;': '–',
    '&mdash;': '—',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
  }
  
  let result = text
  for (const [entity, char] of Object.entries(entities)) {
    result = result.replace(new RegExp(entity, 'g'), char)
  }
  
  // 숫자 엔티티 처리
  result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  
  return result
}

// HTML 태그 제거하고 텍스트 추출
function extractText(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, '').trim())
}

// 인라인 스타일에서 스타일 정보 추출
function parseInlineStyle(styleAttr: string): Record<string, string> {
  const styles: Record<string, string> = {}
  if (!styleAttr) return styles
  
  styleAttr.split(';').forEach(rule => {
    const [prop, value] = rule.split(':').map(s => s?.trim())
    if (prop && value) {
      styles[prop.toLowerCase()] = value
    }
  })
  
  return styles
}

// TextRun 생성 (스타일 포함)
function createTextRuns(html: string): TextRun[] {
  const runs: TextRun[] = []
  
  // 간단한 인라인 태그 처리
  const tagPattern = /<(b|strong|i|em|u|code|span)([^>]*)>([\s\S]*?)<\/\1>|([^<]+)/gi
  let match
  
  while ((match = tagPattern.exec(html)) !== null) {
    if (match[4]) {
      // 일반 텍스트
      const text = extractText(match[4])
      if (text) {
        runs.push(new TextRun({ text }))
      }
    } else {
      const tag = match[1].toLowerCase()
      const text = extractText(match[3])
      
      if (text) {
        const options: Record<string, unknown> = { text }
        
        if (tag === 'b' || tag === 'strong') options.bold = true
        if (tag === 'i' || tag === 'em') options.italics = true
        if (tag === 'u') options.underline = {}
        if (tag === 'code') {
          options.font = 'Courier New'
          options.shading = { fill: 'F0F0F0', type: ShadingType.CLEAR }
        }
        
        runs.push(new TextRun(options))
      }
    }
  }
  
  // 매칭 실패시 전체 텍스트 추출
  if (runs.length === 0) {
    const text = extractText(html)
    if (text) {
      runs.push(new TextRun({ text }))
    }
  }
  
  return runs
}

// HTML 파싱 및 DOCX 요소로 변환
function parseHtmlToDocx(html: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = []
  
  // 주요 블록 요소 패턴
  const blockPattern = /<(h[1-6]|p|div|li|tr|table|ul|ol)([^>]*)>([\s\S]*?)<\/\1>|<br\s*\/?>/gi
  
  // title 태그에서 제목 추출
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch) {
    const titleText = extractText(titleMatch[1])
    if (titleText) {
      elements.push(new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: titleText, bold: true, size: 48 })],
        spacing: { after: 400 }
      }))
    }
  }
  
  // body 내용만 파싱
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const content = bodyMatch ? bodyMatch[1] : html
  
  // 테이블 처리
  const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/gi
  let tableMatch
  let lastIndex = 0
  
  while ((tableMatch = tablePattern.exec(content)) !== null) {
    // 테이블 전 내용 처리
    const beforeTable = content.slice(lastIndex, tableMatch.index)
    elements.push(...parseBlockContent(beforeTable))
    
    // 테이블 파싱
    const table = parseTable(tableMatch[0])
    if (table) elements.push(table)
    
    lastIndex = tablePattern.lastIndex
  }
  
  // 나머지 내용 처리
  if (lastIndex < content.length) {
    elements.push(...parseBlockContent(content.slice(lastIndex)))
  }
  
  return elements
}

// 블록 컨텐츠 파싱 (테이블 제외)
function parseBlockContent(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  
  // 헤딩 처리
  const headingPattern = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi
  let match
  
  while ((match = headingPattern.exec(html)) !== null) {
    const level = parseInt(match[1])
    const text = extractText(match[2])
    if (text) {
      const headingLevel = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ][level - 1]
      
      paragraphs.push(new Paragraph({
        heading: headingLevel,
        children: [new TextRun({ text, bold: true })],
        spacing: { before: 240, after: 120 }
      }))
    }
  }
  
  // 단락 처리
  const pPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi
  while ((match = pPattern.exec(html)) !== null) {
    const runs = createTextRuns(match[1])
    if (runs.length > 0) {
      paragraphs.push(new Paragraph({
        children: runs,
        spacing: { after: 200 }
      }))
    }
  }
  
  // div 처리
  const divPattern = /<div[^>]*>([\s\S]*?)<\/div>/gi
  while ((match = divPattern.exec(html)) !== null) {
    const innerContent = match[1]
    // div 안에 다른 블록 요소가 없으면 텍스트로 처리
    if (!/<(h[1-6]|p|div|table|ul|ol|li)/i.test(innerContent)) {
      const text = extractText(innerContent)
      if (text) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text })],
          spacing: { after: 200 }
        }))
      }
    }
  }
  
  // 리스트 처리
  const ulPattern = /<ul[^>]*>([\s\S]*?)<\/ul>/gi
  while ((match = ulPattern.exec(html)) !== null) {
    const listItems = parseListItems(match[1], false)
    paragraphs.push(...listItems)
  }
  
  const olPattern = /<ol[^>]*>([\s\S]*?)<\/ol>/gi
  while ((match = olPattern.exec(html)) !== null) {
    const listItems = parseListItems(match[1], true)
    paragraphs.push(...listItems)
  }
  
  // 블록 요소가 없으면 전체를 하나의 단락으로
  if (paragraphs.length === 0) {
    const text = extractText(html)
    if (text && text.length > 0) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text })],
        spacing: { after: 200 }
      }))
    }
  }
  
  return paragraphs
}

// 리스트 아이템 파싱
function parseListItems(html: string, ordered: boolean): Paragraph[] {
  const items: Paragraph[] = []
  const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi
  let match
  let index = 1
  
  while ((match = liPattern.exec(html)) !== null) {
    const text = extractText(match[1])
    if (text) {
      const bullet = ordered ? `${index}. ` : '• '
      items.push(new Paragraph({
        children: [new TextRun({ text: bullet + text })],
        indent: { left: 720 },
        spacing: { after: 100 }
      }))
      index++
    }
  }
  
  return items
}

// 테이블 파싱
function parseTable(tableHtml: string): Table | null {
  const rows: TableRow[] = []
  
  // 행 추출
  const trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let trMatch
  
  while ((trMatch = trPattern.exec(tableHtml)) !== null) {
    const cells: TableCell[] = []
    
    // 셀 추출 (th 또는 td)
    const cellPattern = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi
    let cellMatch
    
    while ((cellMatch = cellPattern.exec(trMatch[1])) !== null) {
      const isHeader = cellMatch[1].toLowerCase() === 'th'
      const text = extractText(cellMatch[2])
      
      const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' }
      
      cells.push(new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ 
            text: text || ' ',
            bold: isHeader
          })],
          alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT
        })],
        borders: { top: border, bottom: border, left: border, right: border },
        shading: isHeader ? { fill: 'E8E8E8', type: ShadingType.CLEAR } : undefined,
        margins: { top: 80, bottom: 80, left: 120, right: 120 }
      }))
    }
    
    if (cells.length > 0) {
      rows.push(new TableRow({ children: cells }))
    }
  }
  
  if (rows.length === 0) return null
  
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  })
}

export async function POST(request: NextRequest) {
  try {
    const { html, filename = 'document' } = await request.json()
    
    if (!html) {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 })
    }
    
    // HTML을 DOCX 요소로 변환
    const content = parseHtmlToDocx(html)
    
    // 내용이 없으면 기본 메시지 추가
    if (content.length === 0) {
      content.push(new Paragraph({
        children: [new TextRun({ text: 'No content to export' })]
      }))
    }
    
    // DOCX 문서 생성
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: 'Arial', size: 24 }  // 12pt
          }
        },
        paragraphStyles: [
          {
            id: 'Heading1',
            name: 'Heading 1',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 48, bold: true, font: 'Arial' },
            paragraph: { spacing: { before: 240, after: 120 } }
          },
          {
            id: 'Heading2',
            name: 'Heading 2',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 36, bold: true, font: 'Arial' },
            paragraph: { spacing: { before: 200, after: 100 } }
          },
          {
            id: 'Heading3',
            name: 'Heading 3',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { size: 28, bold: true, font: 'Arial' },
            paragraph: { spacing: { before: 160, after: 80 } }
          }
        ]
      },
      sections: [{
        properties: {
          page: {
            size: {
              width: 12240,   // US Letter 8.5"
              height: 15840   // US Letter 11"
            },
            margin: {
              top: 1440,      // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440
            }
          }
        },
        children: content
      }]
    })
    
    // Buffer로 변환
    const buffer = await Packer.toBuffer(doc)
    
    // 파일명 정리
    const safeFilename = filename.replace(/[^a-zA-Z0-9가-힣\-_]/g, '_')
    
    // Buffer를 Uint8Array로 변환
    const uint8Array = new Uint8Array(buffer)
    
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeFilename}.docx"`,
        'Content-Length': uint8Array.byteLength.toString()
      }
    })
    
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
