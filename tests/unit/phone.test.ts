import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone } from '@/lib/phone'

describe('normalizePhone', () => {
  it.each([
    ['(11) 99999-0000', '11999990000'],
    ['11 99999 0000', '11999990000'],
    ['(11) 3333-4444', '1133334444'],
    ['+55 11 99999-0000', '11999990000'],
    ['5511999990000', '11999990000'],
  ])('%s -> %s', (input, digits) => {
    expect(normalizePhone(input)).toBe(digits)
  })

  it.each(['', '123', '(00) 99999-0000', '(11) 9999-000', '(11) 199999-0000', 'abc', '(11) 89999-0000'])(
    'rejeita %j',
    (input) => {
      expect(normalizePhone(input)).toBeNull()
    },
  )
})

describe('formatPhone', () => {
  it('aplica a máscara brasileira', () => {
    expect(formatPhone('11999990000')).toBe('(11) 99999-0000')
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444')
  })
  it('devolve o texto original quando não reconhece o formato', () => {
    expect(formatPhone('abc')).toBe('abc')
  })
})
