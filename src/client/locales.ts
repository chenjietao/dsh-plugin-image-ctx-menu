/** `image-ctx-menu` 命名空间的中英双语词典。
 *
 * 语言策略：`en` 是默认语言（国际化兜底，各国用户都看英文，不会有语言障碍）；
 * 只有简体中文环境才用 `zh`。桌面端有 locale 服务时由 DSH 的 active locale
 * 决定（zh 环境 active 为 zh，其余为 en，未覆盖的第三语言经 fallback 链
 * 最终也落到 en）；无 locale 服务的极简 composition 下由
 * {@link resolveStandaloneLang} 按浏览器语言做同样的判断。
 */

/** 本插件拥有的 locale 命名空间。 */
export const NS = 'image-ctx-menu'

/** 简体中文词典（key 集的源头）。 */
export const zh = {
  'menu.copy': '复制图片',
  'menu.save': '图片另存为',
  'toast.copying': '正在复制图片…',
  'toast.copied': '图片已复制到剪贴板',
  'toast.copyBlocked': '复制被浏览器拦截：请再点一次“复制图片”',
  'toast.copyFailed': '复制失败，请重试',
  'toast.copyUnsupported': '当前环境不支持复制图片',
  'toast.saveStarted': '图片已开始下载',
  'toast.saved': '图片已保存',
  'toast.saveFailed': '保存失败，请重试',
  'save.typesLabel': '图片',
  'save.fallbackName': 'image',
} as const

/** 英文词典，与中文 key 完全一致。 */
export const en: Record<ImageCtxMenuKey, string> = {
  'menu.copy': 'Copy image',
  'menu.save': 'Save image as…',
  'toast.copying': 'Copying image…',
  'toast.copied': 'Image copied to clipboard',
  'toast.copyBlocked': 'Copy was blocked by the browser: click “Copy image” again',
  'toast.copyFailed': 'Copy failed, please retry',
  'toast.copyUnsupported': 'Copying images is not supported in this environment',
  'toast.saveStarted': 'Download started',
  'toast.saved': 'Image saved',
  'toast.saveFailed': 'Save failed, please retry',
  'save.typesLabel': 'Images',
  'save.fallbackName': 'image',
}

/** `image-ctx-menu` 命名空间的 key 域（zh 为源头）。 */
export type ImageCtxMenuKey = keyof typeof zh

/**
 * 无 locale 服务时的独立语言判断：仅简体中文用 zh，其余一律 en。
 *
 * 覆盖 zh-Hans / zh-CN / zh-SG 等简体中文标签；zh-HK / zh-TW 等繁体中文
 * 走默认 en（本插件暂无繁体词典，英文比错误的简体更合适）。
 * @param languages - 按优先级排序的浏览器语言标签（如 navigator.languages）。
 * @returns 'zh' 或 'en'。
 */
export function resolveStandaloneLang(languages: readonly string[]): 'zh' | 'en' {
  for (const tag of languages) {
    const lower = tag.toLowerCase()
    if (lower === 'zh' || lower.startsWith('zh-')) {
      const region = lower.split('-')[1] ?? ''
      // 繁体中文地区：hk/tw/mo 走 en；其余（cn/sg/hans/无地区）走 zh。
      if (region === 'hk' || region === 'tw' || region === 'mo' || lower.includes('hant')) continue
      return 'zh'
    }
  }
  return 'en'
}
