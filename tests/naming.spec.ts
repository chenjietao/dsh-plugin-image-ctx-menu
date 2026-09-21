/**
 * 纯函数单测：文件名清理、扩展名推断、时间戳。
 * client/index.ts 的 DOM 部分由浏览器集成验证覆盖。
 */
import { describe, expect, it } from 'vitest'
import { guessExtFromSrc, guessMimeKey, sanitizeName, stamp } from '../src/client/naming.ts'
import { dataURLToBlob } from '../src/client/blob.ts'
import { en, zh } from '../src/client/locales.ts'

describe('sanitizeName', () => {
  it('清理非法字符并截断', () => {
    expect(sanitizeName('a/b:c*d')).toBe('a_b_c_d')
    expect(sanitizeName('')).toBe('image')
    expect(sanitizeName(undefined)).toBe('image')
    expect(sanitizeName('x'.repeat(100)).length).toBe(60)
  })
})

describe('guessExtFromSrc', () => {
  it('优先 URL 后缀', () => {
    expect(guessExtFromSrc('https://x/y.PNG?z=1', null)).toBe('.png')
    expect(guessExtFromSrc('https://x/y.jpeg', null)).toBe('.jpg')
  })

  it('回退到 MIME', () => {
    expect(guessExtFromSrc('blob:https://x/abc', 'image/webp')).toBe('.webp')
    expect(guessExtFromSrc('blob:https://x/abc', null)).toBe('.png')
  })
})

describe('guessMimeKey', () => {
  it('data URL 取真实 MIME', () => {
    expect(guessMimeKey('data:image/jpeg;base64,xx')).toBe('image/jpeg')
  })

  it('其余默认 PNG', () => {
    expect(guessMimeKey('blob:https://x/abc')).toBe('image/png')
  })
})

describe('stamp', () => {
  it('固定时间输出固定戳', () => {
    expect(stamp(new Date(2026, 8, 21, 15, 4, 5))).toBe('20260921_150405')
  })
})

describe('dataURLToBlob', () => {
  it('解码 base64 data URL', () => {
    const blob = dataURLToBlob('data:image/png;base64,aGk=')
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBeGreaterThan(0)
  })
})

describe('locales', () => {
  it('中英 key 完全一致', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
  })
})
