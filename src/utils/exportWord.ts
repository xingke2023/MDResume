import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  convertInchesToTwip,
} from 'docx'
import { saveAs } from 'file-saver'
import { marked } from 'marked'
import type { Token, Tokens } from 'marked'

// ─── 基础配置 ──────────────────────────────────────────────
const FONT = `宋体`
const SIZE = 24 // 12pt（docx 使用半点，12pt * 2 = 24）
const LINE_SPACING = { line: 360, lineRule: `auto` as const } // 1.5 倍行距

type InlineChild = TextRun | ExternalHyperlink

// ─── 工具函数 ──────────────────────────────────────────────

function run(text: string, opts: Record<string, unknown> = {}): TextRun {
  return new TextRun({ text, font: { name: FONT }, size: SIZE, ...opts })
}

function processInline(tokens: Token[], extra: Record<string, unknown> = {}): InlineChild[] {
  const result: InlineChild[] = []

  for (const tok of tokens) {
    switch (tok.type) {
      case `text`: {
        const t = tok as Tokens.Text
        if (t.tokens?.length) {
          result.push(...processInline(t.tokens, extra))
        }
        else if (t.text) {
          result.push(run(t.text, extra))
        }
        break
      }
      case `strong`: {
        const t = tok as Tokens.Strong
        result.push(...processInline(t.tokens ?? [], { ...extra, bold: true }))
        break
      }
      case `em`: {
        const t = tok as Tokens.Em
        result.push(...processInline(t.tokens ?? [], { ...extra, italics: true }))
        break
      }
      case `del`: {
        const t = tok as Tokens.Del
        result.push(...processInline(t.tokens ?? [], { ...extra, strike: true }))
        break
      }
      case `codespan`: {
        const t = tok as Tokens.Codespan
        result.push(new TextRun({
          text: t.text,
          font: { name: `Courier New` },
          size: SIZE,
          shading: { fill: `F0F0F0` },
        }))
        break
      }
      case `link`: {
        const t = tok as Tokens.Link
        const children = processInline(t.tokens ?? [run(t.text)], {
          ...extra,
          style: `Hyperlink`,
        }) as TextRun[]
        result.push(new ExternalHyperlink({ children, link: t.href }))
        break
      }
      default: {
        const t = tok as any
        if (t.text) result.push(run(t.text, extra))
        break
      }
    }
  }

  if (result.length === 0) result.push(run(``, extra))
  return result
}

// ─── 标题 ──────────────────────────────────────────────────

const HEADING_LEVELS = [
  undefined,
  `Heading1`,
  `Heading2`,
  `Heading3`,
  `Heading4`,
  `Heading5`,
  `Heading6`,
] as const

const HEADING_SIZES = [0, 36, 32, 28, 26, 24, 22] // pt * 2

function buildHeading(tok: Tokens.Heading): Paragraph {
  const depth = Math.min(tok.depth, 6)
  const sz = HEADING_SIZES[depth]
  const children = tok.tokens?.length
    ? processInline(tok.tokens, { bold: true, size: sz })
    : [run(tok.text, { bold: true, size: sz })]

  return new Paragraph({
    children,
    heading: HEADING_LEVELS[depth] as any,
    spacing: { before: 240, after: 120, ...LINE_SPACING },
  })
}

// ─── 段落 ──────────────────────────────────────────────────

function buildParagraph(tok: Tokens.Paragraph): Paragraph {
  const children = tok.tokens?.length ? processInline(tok.tokens) : [run(tok.text)]
  return new Paragraph({
    children,
    spacing: { before: 0, after: 120, ...LINE_SPACING },
  })
}

// ─── 引用 ──────────────────────────────────────────────────

function buildBlockquote(tok: Tokens.Blockquote): Paragraph[] {
  const paras: Paragraph[] = []

  for (const child of tok.tokens ?? []) {
    let children: InlineChild[]
    if (child.type === `paragraph`) {
      const p = child as Tokens.Paragraph
      children = p.tokens?.length ? processInline(p.tokens) : [run(p.text)]
    }
    else {
      children = [run((child as any).text ?? ``)]
    }

    paras.push(new Paragraph({
      children,
      spacing: { before: 60, after: 60, ...LINE_SPACING },
      indent: { left: convertInchesToTwip(0.4) },
      border: {
        left: { color: `CCCCCC`, space: 8, style: `single` as any, size: 12 },
      },
    }))
  }

  return paras.length ? paras : [new Paragraph({ children: [run(``)], spacing: LINE_SPACING })]
}

// ─── 代码块 ────────────────────────────────────────────────

function buildCodeBlock(tok: Tokens.Code): Paragraph[] {
  const lines = tok.text.split(`\n`)
  return lines.map((line, i) => new Paragraph({
    children: [new TextRun({ text: line, font: { name: `Courier New` }, size: SIZE - 2 })],
    spacing: {
      before: i === 0 ? 120 : 0,
      after: i === lines.length - 1 ? 120 : 0,
      line: 240,
      lineRule: `auto`,
    },
    shading: { type: `solid`, color: `F8F8F8`, fill: `F8F8F8` },
    border: {
      top: i === 0 ? { style: BorderStyle.SINGLE, size: 1, color: `DDDDDD` } : undefined,
      bottom: i === lines.length - 1 ? { style: BorderStyle.SINGLE, size: 1, color: `DDDDDD` } : undefined,
      left: { style: BorderStyle.SINGLE, size: 1, color: `DDDDDD` },
      right: { style: BorderStyle.SINGLE, size: 1, color: `DDDDDD` },
    },
    indent: { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
  }))
}

// ─── 列表 ──────────────────────────────────────────────────

function buildList(tok: Tokens.List, level = 0): Paragraph[] {
  const paras: Paragraph[] = []
  const ref = tok.ordered ? `ordered-list` : `unordered-list`

  for (const item of tok.items) {
    // 主列表项文本
    const textTokens = item.tokens.filter(t => t.type !== `list`)
    let children: InlineChild[]
    if (textTokens.length) {
      // 通常第一个是 paragraph token
      const first = textTokens[0]
      if (first.type === `paragraph` && (first as Tokens.Paragraph).tokens?.length) {
        children = processInline((first as Tokens.Paragraph).tokens!)
      }
      else {
        children = processInline(textTokens as Token[])
      }
    }
    else {
      children = [run(item.text || ``)]
    }

    paras.push(new Paragraph({
      children,
      numbering: { reference: ref, level },
      spacing: { before: 40, after: 40, ...LINE_SPACING },
    }))

    // 嵌套列表
    for (const child of item.tokens) {
      if (child.type === `list`) {
        paras.push(...buildList(child as Tokens.List, level + 1))
      }
    }
  }

  return paras
}

// ─── 表格 ──────────────────────────────────────────────────

function buildTable(tok: Tokens.Table): Table {
  const rows: TableRow[] = []

  // 表头
  const headerCells = tok.header.map(cell =>
    new TableCell({
      children: [new Paragraph({
        children: cell.tokens?.length
          ? processInline(cell.tokens, { bold: true })
          : [run(cell.text, { bold: true })],
        alignment: AlignmentType.LEFT,
      })],
      shading: { fill: `F2F2F2` },
    }),
  )
  rows.push(new TableRow({ children: headerCells }))

  // 数据行
  for (const row of tok.rows) {
    const cells = row.map(cell =>
      new TableCell({
        children: [new Paragraph({
          children: cell.tokens?.length ? processInline(cell.tokens) : [run(cell.text)],
          alignment: AlignmentType.LEFT,
        })],
      }),
    )
    rows.push(new TableRow({ children: cells }))
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: `CCCCCC` },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: `CCCCCC` },
      left: { style: BorderStyle.SINGLE, size: 1, color: `CCCCCC` },
      right: { style: BorderStyle.SINGLE, size: 1, color: `CCCCCC` },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: `CCCCCC` },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: `CCCCCC` },
    },
  })
}

// ─── 分隔线 ────────────────────────────────────────────────

function buildHr(): Paragraph {
  return new Paragraph({
    children: [run(``)],
    spacing: { before: 240, after: 240 },
    border: { bottom: { color: `999999`, space: 1, style: BorderStyle.SINGLE, size: 6 } },
  })
}

// ─── 主函数 ────────────────────────────────────────────────

export async function exportWord(markdown: string, title = `untitled`) {
  const tokens = marked.lexer(markdown)
  const children: (Paragraph | Table)[] = []

  for (const tok of tokens) {
    switch (tok.type) {
      case `heading`:
        children.push(buildHeading(tok as Tokens.Heading))
        break
      case `paragraph`:
        children.push(buildParagraph(tok as Tokens.Paragraph))
        break
      case `blockquote`:
        children.push(...buildBlockquote(tok as Tokens.Blockquote))
        break
      case `code`:
        children.push(...buildCodeBlock(tok as Tokens.Code))
        break
      case `list`:
        children.push(...buildList(tok as Tokens.List))
        break
      case `table`:
        children.push(buildTable(tok as Tokens.Table))
        break
      case `hr`:
        children.push(buildHr())
        break
      case `space`:
        break
      default:
        break
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: `unordered-list`,
          levels: [0, 1, 2].map(level => ({
            level,
            format: `bullet`,
            text: [`●`, `○`, `▪`][level],
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: {
                  left: convertInchesToTwip(0.5 + level * 0.5),
                  hanging: convertInchesToTwip(0.25),
                },
              },
              run: { font: { name: FONT }, size: SIZE, bold: true },
            },
          })),
        },
        {
          reference: `ordered-list`,
          levels: [
            { level: 0, format: `decimal`, text: `%1.` },
            { level: 1, format: `lowerLetter`, text: `%2.` },
            { level: 2, format: `lowerRoman`, text: `%3.` },
          ].map(({ level, format, text }) => ({
            level,
            format: format as any,
            text,
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: {
                indent: {
                  left: convertInchesToTwip(0.5 + level * 0.5),
                  hanging: convertInchesToTwip(0.25),
                },
              },
              run: { font: { name: FONT }, size: SIZE },
            },
          })),
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1.25),
          },
        },
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const safeName = title.replace(/[/\\:*?"<>|]/g, `_`) || `document`
  saveAs(blob, `${safeName}.docx`)
}
