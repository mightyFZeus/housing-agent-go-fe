export function normalizeSectionRefs(input: string): string {
  const text = input.replace(/\r\n/g, '\n')
  const re = /(\[|\(|【)?Section\s*\d+(?:\([^)]+\))?(\]|\)|】)?/g

  let out = ''
  let lastIndex = 0

  for (const match of text.matchAll(re)) {
    if (match.index === undefined) continue

    const start = match.index
    const end = start + match[0].length

    out += text.slice(lastIndex, start)

    const lastNewline = out.lastIndexOf('\n')
    const atLineStart = lastNewline === -1 ? out.trim().length === 0 : out.slice(lastNewline + 1).trim().length === 0

    while (out.endsWith(' ')) out = out.slice(0, -1)

    if (out.length > 0) {
      const hasDoubleNewline = out.endsWith('\n\n')
      const hasSingleNewline = out.endsWith('\n')

      if (atLineStart) {
        if (!hasDoubleNewline && hasSingleNewline) out += '\n'
      } else {
        if (!hasDoubleNewline) out += hasSingleNewline ? '\n' : '\n\n'
      }
    }

    out += text.slice(start, end)
    lastIndex = end
  }

  out += text.slice(lastIndex)
  return out
}

export function normalizeDisplayWhitespace(input: string): string {
  const lines = input.replace(/\r\n/g, '\n').split('\n')
  const cleaned = lines.map((line) => {
    const match = line.match(/^(\s*)/)
    const prefix = match ? match[1] : ''
    let rest = line.slice(prefix.length)

    rest = rest.replace(/[ \t]{2,}/g, ' ')
    rest = rest.replace(/\s+([.,;:!?])/g, '$1')
    rest = rest.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')')
    rest = rest.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']')
    rest = rest.replace(/【\s+/g, '【').replace(/\s+】/g, '】')
    rest = rest.replace(/\s+-\s+/g, ' - ')

    return (prefix + rest).replace(/[ \t]+$/g, '')
  })

  return cleaned.join('\n')
}

function normalizeCommonText(input: string): string {
  let text = input.replace(/\r\n/g, '\n')

  text = text.replace(/([.!?])([A-Za-z])/g, '$1 $2')
  text = text.replace(/,([A-Za-z])/g, ', $1')
  text = text.replace(/;([A-Za-z])/g, '; $1')
  text = text.replace(/:(?=\S)/g, ': ')
  text = text.replace(/([A-Za-z0-9])\(/g, '$1 (')
  text = text.replace(/\)\s*([A-Za-z])/g, ') $1')
  text = text.replace(/([a-z])([A-Z])/g, '$1 $2')

  text = text.replace(/\b(other)(non[-‑])/gi, '$1 $2')

  text = text.replace(/\b([A-Za-z]{3,}ing)(a|an|the)\b/g, '$1 $2')
  text = text.replace(/\b([A-Za-z]{3,}ing)(out|in|on|of|to)\b/g, '$1 $2')

  text = text.replace(/\b([A-Za-z]{3,})\s+inga\b/g, '$1ing a')

  text = text.replace(/\bUn\s+law\s+fully\b/gi, 'Unlawfully')
  text = text.replace(/\bfullyret\b/gi, 'fully ret')
  text = text.replace(/\bret\s+aking\b/gi, 'retaking')

  text = text.replace(/\b([a-z]{3,})\s+(able|ible|ishing|tion|sion|ment|ness|fully|ly|al|ance|ence|ary|ory|ous|ive|ed|ing)\b/g, '$1$2')

  return text
}

function joinBrokenWords(input: string): string {
  return input
    .replace(/\barre\s+ars\b/gi, 'arrears')
    .replace(/\byear\s+ly\b/gi, 'yearly')
    .replace(/\bhalf[-‑ ]year\s+ly\b/gi, 'half‑yearly')
    .replace(/\beff\s+lux\s+ion\b/gi, 'effluxion')
}

export function normalizeAnswerText(input: string): string {
  let text = input.replace(/\r\n/g, '\n')

  text = normalizeCommonText(text)
  text = text.replace(/\bFora\b/gi, 'For a')
  text = text.replace(/\bandI\b/g, 'and I')
  text = text.replace(/\baftera\b/gi, 'after a')
  text = text.replace(/\bget a\b/gi, 'get a')

  text = text.replace(/(^|[.!?]\s+)(Short answer:)/gi, '$1\n\n$2\n')
  text = text.replace(/(^|[.!?]\s+)(Why[^:\n]{0,40}:)/gi, '$1\n\n$2\n')
  text = text.replace(/(^|[.!?]\s+)(Practical advice[^:\n]{0,60}:)/gi, '$1\n\n$2\n')

  text = text.replace(/\s*-\s*(?=\S)/g, '\n- ')
  text = text.replace(/\n{3,}/g, '\n\n')

  text = joinBrokenWords(text)
  text = normalizeDisplayWhitespace(text)

  return text.trim()
}

export function normalizeContextText(input: string): string {
  let text = input.replace(/\r\n/g, '\n')
  text = normalizeCommonText(text)
  text = normalizeDisplayWhitespace(text)
  return text.trim()
}
