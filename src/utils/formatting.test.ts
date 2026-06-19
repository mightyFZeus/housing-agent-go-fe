import { describe, expect, it } from 'vitest'
import { normalizeAnswerText, normalizeContextText, normalizeDisplayWhitespace, normalizeSectionRefs } from '@/utils/formatting'

describe('normalizeSectionRefs', () => {
  it('moves mid-sentence section refs onto a new line with a blank line above', () => {
    const input = 'Payable in advance. Section7(6) says so.'
    const out = normalizeSectionRefs(input)
    expect(out).toContain('advance.\n\nSection7(6)')
  })

  it('does not change section refs already at line start', () => {
    const input = 'Intro\n\nSection 13(b)\nMore'
    const out = normalizeSectionRefs(input)
    expect(out).toBe(input)
  })

  it('upgrades single newline to double newline before section refs', () => {
    const input = 'Intro\nSection 4'
    const out = normalizeSectionRefs(input)
    expect(out).toBe('Intro\n\nSection 4')
  })
})

describe('normalizeDisplayWhitespace', () => {
  it('removes repeated spaces and space before punctuation', () => {
    const input = 'Hello   world  .  ( Section 7 )'
    const out = normalizeDisplayWhitespace(input)
    expect(out).toBe('Hello world. (Section 7)')
  })
})

describe('normalizeAnswerText', () => {
  it('splits headings and bullets from run-on text', () => {
    const input =
      "Short answer:It depends.-Fora monthly tenancy:if you are in arre ars for six(6)months,the tenancy shall lapse."
    const out = normalizeAnswerText(input)
    expect(out).toContain('Short answer:')
    expect(out).toContain('\n- For a monthly tenancy:')
    expect(out).toContain('arrears')
    expect(out).toContain('six (6) months')
  })

  it('keeps hyphenated terms intact instead of turning them into bullets', () => {
    const input = 'A half-yearly tenant with a non-payment issue needs a court-approved process.'
    const out = normalizeAnswerText(input)

    expect(out).toContain('half-yearly')
    expect(out).toContain('non-payment')
    expect(out).toContain('court-approved')
    expect(out).not.toContain('\n- yearly')
    expect(out).not.toContain('\n- payment')
    expect(out).not.toContain('\n- approved')
  })

  it('keeps section subsections tight while normalizing surrounding spaces', () => {
    const input = 'Section7(6)says a yearly tenant needs six(6)months notice.'
    const out = normalizeAnswerText(input)

    expect(out).toContain('Section 7(6)')
    expect(out).toContain('six (6) months')
  })
})

describe('normalizeContextText', () => {
  it('fixes broken words and punctuation spacing in excerpts', () => {
    const input =
      'Section 44 makes demol ishing,altering,forcibly ejecting,threatening or molest inga tenant to eject them without Court approval an offence,punish able by up toN 250,000 fine.'
    const out = normalizeContextText(input)
    expect(out).toContain('demolishing, altering, forcibly')
    expect(out).toContain('molesting a tenant')
    expect(out).toContain('punishable')
    expect(out).toContain('up to N 250,000')
  })
})
