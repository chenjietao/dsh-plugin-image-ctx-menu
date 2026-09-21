/** 文件名清理与扩展名推断（纯函数，可单元测试）。 */

/** 清理非法文件名字符并截断，供另存为建议名使用。 */
export function sanitizeName(name: string | undefined): string {
  const cleaned = String(name || 'image')
    .replace(/[<>:\"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 60)
  return cleaned || 'image'
}

/** 由 MIME 得到的默认扩展名。 */
function extFromMime(mime: string | null): string | null {
  if (mime === 'image/png') return '.png'
  if (mime === 'image/jpeg') return '.jpg'
  if (mime === 'image/webp') return '.webp'
  if (mime === 'image/gif') return '.gif'
  if (mime === 'image/bmp') return '.bmp'
  if (mime === 'image/svg+xml') return '.svg'
  return null
}

/** 由图片 URL 与 MIME 推断保存扩展名。 */
export function guessExtFromSrc(src: string, mime: string | null): string {
  const match = /\.([a-zA-Z0-9]{2,5})(?:[?#]|$)/.exec(String(src || ''))
  if (match) {
    const ext = `.${match[1].toLowerCase()}`
    if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'].includes(ext)) {
      return ext === '.jpeg' ? '.jpg' : ext
    }
  }
  return extFromMime(mime) || '.png'
}

/** 由图片 URL 推断剪贴板写入的 MIME key。 */
export function guessMimeKey(src: string): string {
  if (src.startsWith('data:')) {
    const match = /^data:([^;,]+)?/iu.exec(src)
    if (match?.[1]?.startsWith('image/')) return match[1]
  }
  return 'image/png'
}

/** 本地时间戳 `YYYYMMDD_HHMMSS`，拼进建议文件名防覆盖。 */
export function stamp(now = new Date()): string {
  const pad = (n: number): string => (n < 10 ? '0' : '') + n
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}
