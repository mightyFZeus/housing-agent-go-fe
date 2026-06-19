import { Fragment, useMemo } from 'react'
import { normalizeAnswerText, normalizeSectionRefs } from '@/utils/formatting'

type Node =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: ListItem[] }

type ListItem = {
  text: string
  children?: Node
}

type InlineToken =
  | string
  | { type: 'strong'; value: string }
  | { type: 'section'; value: string }

function parseInline(text: string): Array<string | { type: 'strong'; value: string }> {
  const out: Array<string | { type: 'strong'; value: string }> = []
  let i = 0

  while (i < text.length) {
    const start = text.indexOf('**', i)
    if (start === -1) {
      out.push(text.slice(i))
      break
    }

    const end = text.indexOf('**', start + 2)
    if (end === -1) {
      out.push(text.slice(i))
      break
    }

    if (start > i) out.push(text.slice(i, start))
    out.push({ type: 'strong', value: text.slice(start + 2, end) })
    i = end + 2
  }

  return out
}

const SECTION_RE = /(\[|\(|【)?Section\s*\d+(?:\s*\([^)]+\))?(\]|\)|】)?/g

function splitSectionRefs(text: string): InlineToken[] {
  const out: InlineToken[] = []
  let last = 0

  for (const match of text.matchAll(SECTION_RE)) {
    if (match.index === undefined) continue
    const start = match.index
    const end = start + match[0].length

    if (start > last) out.push(text.slice(last, start))
    out.push({ type: 'section', value: text.slice(start, end) })
    last = end
  }

  if (last < text.length) out.push(text.slice(last))
  return out
}

function isListLine(line: string) {
  return /^(\s*)([-*])\s+/.test(line)
}

function getIndent(line: string) {
  const match = line.match(/^(\s*)/)
  return match ? match[1].length : 0
}

function stripListMarker(line: string) {
  return line.replace(/^(\s*)([-*])\s+/, '')
}

function parseList(lines: string[], startIndex: number, baseIndent: number): { node: Node; nextIndex: number } {
  const items: ListItem[] = []
  let i = startIndex

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().length === 0) break
    if (!isListLine(line)) break

    const indent = getIndent(line)
    if (indent < baseIndent) break
    if (indent > baseIndent) break

    const item: ListItem = { text: stripListMarker(line) }
    i += 1

    while (i < lines.length) {
      const next = lines[i]
      if (next.trim().length === 0) break

      if (isListLine(next)) {
        const nextIndent = getIndent(next)
        if (nextIndent > baseIndent) {
          const parsed = parseList(lines, i, nextIndent)
          item.children = parsed.node
          i = parsed.nextIndex
          continue
        }
        break
      }

      const nextIndent = getIndent(next)
      if (nextIndent > baseIndent) {
        item.text = `${item.text} ${next.trim()}`
        i += 1
        continue
      }

      break
    }

    items.push(item)

    while (i < lines.length && lines[i].trim().length === 0) i += 1
  }

  return { node: { type: 'ul', items }, nextIndex: i }
}
function normalizeMarkdown(input: string): string {
  // If the text already has newlines, don't touch it
  if (input.includes('\n')) return input

  // Split on likely list markers embedded in run-on text.
  return input
    .replace(/([.?!:;])\s*[-*]\s*(?=\S)/g, '$1\n- ')
    .replace(/(\))\s*[-*]\s*(?=\S)/g, '$1\n- ')
}

function parseMarkdown(input: string): Node[] {
  const normalized = normalizeSectionRefs(normalizeAnswerText(normalizeMarkdown(input)))
  const lines = normalized.replace(/\r\n/g, '\n').split('\n')
  const nodes: Node[] = []

  let i = 0
  let paragraph: string[] = []

  const flushParagraph = () => {
    const text = paragraph.join('\n').trim()
    paragraph = []
    if (text.length > 0) nodes.push({ type: 'p', text })
  }

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim().length === 0) {
      flushParagraph()
      i += 1
      continue
    }

    if (isListLine(line)) {
      flushParagraph()
      const baseIndent = getIndent(line)
      const parsed = parseList(lines, i, baseIndent)
      nodes.push(parsed.node)
      i = parsed.nextIndex
      continue
    }

    paragraph.push(line.trim())
    i += 1
  }

  flushParagraph()
  return nodes
}

function Inline({ text }: { text: string }) {
  const chunks = parseInline(text)
  const tokens: InlineToken[] = chunks.flatMap((c) => (typeof c === 'string' ? splitSectionRefs(c) : [c]))

  return (
    <>
      {tokens.map((t, idx) => {
        if (typeof t === 'string') return <Fragment key={idx}>{t}</Fragment>
        if (t.type === 'strong') {
          return (
            <strong key={idx} className="font-semibold text-white/90">
              {t.value}
            </strong>
          )
        }
        return (
          <span key={idx} className="font-semibold text-white">
            {t.value}
          </span>
        )
      })}
    </>
  )
}

function RenderNode({ node, depth }: { node: Node; depth: number }) {
  if (node.type === 'p') {
    return (
      <p className="whitespace-pre-line break-words text-sm font-normal leading-7 text-white/75 [overflow-wrap:anywhere] sm:text-base sm:leading-8">
        <Inline text={node.text} />
      </p>
    )
  }

  return (
    <ul
      className={
        depth === 0
          ? 'ml-5 list-disc space-y-2 break-words text-sm font-normal leading-7 text-white/70 [overflow-wrap:anywhere] sm:text-base sm:leading-8'
          : 'ml-5 mt-2 list-disc space-y-2 break-words text-sm font-normal leading-7 text-white/65 [overflow-wrap:anywhere] sm:text-base sm:leading-8'
      }
    >
      {node.items.map((item, idx) => (
        <li key={idx}>
          <Inline text={item.text} />
          {item.children ? <RenderNode node={item.children} depth={depth + 1} /> : null}
        </li>
      ))}
    </ul>
  )
}

export default function Markdown({ content }: { content: string }) {
  const nodes = useMemo(() => parseMarkdown(content), [content])

  return (
    <div className="min-w-0 space-y-4 break-words [overflow-wrap:anywhere] sm:space-y-5">
      {nodes.map((node, idx) => (
        <RenderNode key={idx} node={node} depth={0} />
      ))}
    </div>
  )
}
