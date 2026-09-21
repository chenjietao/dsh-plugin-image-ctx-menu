/** `image-ctx-menu` 命名空间的中英双语词典。 */

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
