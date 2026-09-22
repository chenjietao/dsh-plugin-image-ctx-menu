/**
 * 图片右键菜单的浏览器半：全局 contextmenu 拦截 + 自定义菜单。
 *
 * - 命中 IMG 才拦截，其余位置的右键行为不受影响；
 * - 「复制图片」在点击手势内同步调用 clipboard.write（Promise 载荷），不断手势链；
 * - 「图片另存为」优先 showSaveFilePicker，不支持时降级 a[download]；
 * - 菜单在 mousedown/click/右键他处、Esc、滚动、窗口失焦、原图 DOM 移除时自动关闭；
 * - 文案走 `image-ctx-menu` locale 命名空间，中英双语跟随应用语言。
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { blobToPngBlob, loadBlob } from './blob.ts'
import { NS, en, resolveStandaloneLang, zh, type ImageCtxMenuKey } from './locales.ts'
import { guessExtFromSrc, guessMimeKey, sanitizeName, stamp } from './naming.ts'
import { css, insertStyles } from './styles.ts'

/** 本插件 locale 命名空间的字典类型。 */
export type ImageCtxMenuDict = Record<ImageCtxMenuKey, string>

/** locale 服务的最小形状（只用 register/bind，不依赖具体包类型）。 */
interface LocaleFace {
  register(ns: string, locale: string, dict: Record<string, string>): () => void
  bind(ns: string): (key: string, params?: Record<string, unknown>) => string
}

/** 本插件无硬依赖：locale 可选（ctx.get），定时器直接用 window。 */
export const inject: readonly string[] = []

/** showSaveFilePicker 的最小类型（标准库未收录时使用）。 */
interface SavePickerHandle {
  createWritable(): Promise<{ write(data: Blob): Promise<void>, close(): Promise<void> }>
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string
      types?: Array<{ description?: string, accept: Record<string, string[]> }>
    }) => Promise<SavePickerHandle>
  }
}

/**
 * 浏览器插件体：注册词典并挂载全局右键菜单。
 * @param ctx - client 根 context。
 */
export function apply(ctx: ClientContext): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  insertStyles()

  const locale = ctx.get('locale') as LocaleFace | undefined
  if (locale) {
    ctx.effect(() => {
      const disposers = [
        locale.register(NS, 'zh', zh as unknown as Record<string, string>),
        locale.register(NS, 'en', en as unknown as Record<string, string>),
      ]
      return () => {
        for (const dispose of disposers) dispose()
      }
    }, 'image-ctx-menu: dictionaries')
  }
  // 独立兜底语言：仅简体中文用 zh，其余一律 en（国际化默认）。
  // 有 locale 服务时 bind 按 DSH active locale 解析，未覆盖的第三语言经
  // fallback 链落到 en；无 locale 服务时按浏览器语言做同样的判断。
  const standaloneLang: 'zh' | 'en' = (() => {
    try {
      const languages = navigator.languages ?? [navigator.language]
      return resolveStandaloneLang(languages)
    } catch {
      return 'en'
    }
  })()
  const fallbackDict = standaloneLang === 'zh' ? zh : en
  const t = (key: ImageCtxMenuKey): string => {
    try {
      if (locale) return locale.bind(NS)(key)
    } catch {
      // 词典尚未注册时回退到独立判断的词典。
    }
    return fallbackDict[key]
  }

  const later = (callback: () => void, delay: number): (() => void) => {
    const handle = window.setTimeout(callback, delay)
    return () => { window.clearTimeout(handle) }
  }

  let menuEl: HTMLElement | null = null
  let menuImg: HTMLImageElement | null = null
  let menuObserver: MutationObserver | null = null
  let toastEl: HTMLElement | null = null
  let toastDispose: (() => void) | null = null

  const showToast = (text: string, isError = false): void => {
    try {
      if (toastDispose) {
        try {
          toastDispose()
        } catch {
          // 前一个 toast 的定时器已失效时忽略。
        }
        toastDispose = null
      }
      if (!toastEl) {
        toastEl = document.createElement('div')
        toastEl.className = css.toast
        document.body.appendChild(toastEl)
      }
      toastEl.textContent = text
      if (isError) toastEl.setAttribute('data-kind', 'error')
      else toastEl.removeAttribute('data-kind')
      toastEl.style.display = 'block'
      toastDispose = later(() => {
        toastDispose = null
        if (toastEl) {
          try {
            toastEl.remove()
          } catch {
            // toast 已被移除时忽略。
          }
          toastEl = null
        }
      }, 2600)
    } catch {
      // toast 展示失败不影响主流程。
    }
  }

  const disconnectObserver = (): void => {
    if (menuObserver) {
      try {
        menuObserver.disconnect()
      } catch {
        // observer 已失效时忽略。
      }
      menuObserver = null
    }
  }

  const closeMenu = (): void => {
    disconnectObserver()
    menuImg = null
    if (menuEl) {
      try {
        menuEl.remove()
      } catch {
        // 菜单已被移除时忽略。
      }
      menuEl = null
    }
  }

  const copyImageInGesture = (src: string): void => {
    showToast(t('toast.copying'))
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        showToast(t('toast.copyUnsupported'), true)
        return
      }
      const isData = src.startsWith('data:')
      const mimeKey = guessMimeKey(src)
      const blobPromise = loadBlob(src).then(blob => {
        if (!blob || blob.size === 0) throw new Error('empty')
        if (isData) return blob
        if (blob.type === 'image/png') return blob
        return blobToPngBlob(blob)
      })
      const payload: Record<string, Promise<Blob>> = {}
      payload[mimeKey] = blobPromise
      navigator.clipboard.write([new ClipboardItem(payload)]).then(() => {
        showToast(t('toast.copied'))
      }).catch((error: unknown) => {
        console.error('[image-ctx-menu] copy failed', error)
        const name = (error as { name?: string } | null)?.name
        showToast(t(name === 'NotAllowedError' ? 'toast.copyBlocked' : 'toast.copyFailed'), true)
      })
    } catch (error) {
      console.error('[image-ctx-menu] copy failed', error)
      showToast(t('toast.copyFailed'), true)
    }
  }

  const downloadBlob = (blob: Blob, suggested: string): void => {
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = suggested
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    later(() => {
      try {
        URL.revokeObjectURL(url)
      } catch {
        // 释放失败不影响下载。
      }
    }, 30000)
    showToast(t('toast.saveStarted'))
  }

  const saveImageAsync = (src: string, label: string): void => {
    loadBlob(src).then(blob => {
      const suggested = `${sanitizeName(label)}_${stamp()}${guessExtFromSrc(src, blob.type || null)}`
      downloadBlob(blob, suggested)
    }).catch((error: unknown) => {
      console.error('[image-ctx-menu] save failed', error)
      showToast(t('toast.saveFailed'), true)
    })
  }

  const saveImageInGesture = (src: string, label: string): void => {
    try {
      if (!window.showSaveFilePicker) {
        saveImageAsync(src, label)
        return
      }
      let pickerPromise: Promise<SavePickerHandle>
      try {
        pickerPromise = window.showSaveFilePicker({
          suggestedName: `${sanitizeName(label)}_${stamp()}${guessExtFromSrc(src, null)}`,
          types: [{
            description: t('save.typesLabel'),
            accept: {
              'image/png': ['.png'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/webp': ['.webp'],
              'image/gif': ['.gif'],
            },
          }],
        })
      } catch {
        saveImageAsync(src, label)
        return
      }
      const blobPromise = loadBlob(src)
      Promise.all([pickerPromise, blobPromise]).then(([handle, blob]) =>
        handle.createWritable().then(writable =>
          writable.write(blob).then(() => writable.close()),
        ),
      ).then(() => {
        showToast(t('toast.saved'))
      }).catch((error: unknown) => {
        const name = (error as { name?: string } | null)?.name
        if (name === 'AbortError' || name === 'NotAllowedError') return
        console.error('[image-ctx-menu] save failed', error)
        showToast(t('toast.saveFailed'), true)
      })
    } catch {
      saveImageAsync(src, label)
    }
  }

  const observeMenuImg = (): void => {
    disconnectObserver()
    if (!menuImg) return
    try {
      menuObserver = new MutationObserver(() => {
        try {
          if (menuImg && !document.body.contains(menuImg)) closeMenu()
        } catch {
          // contains 检查失败时忽略。
        }
      })
      menuObserver.observe(document.body, { childList: true, subtree: true })
    } catch {
      menuObserver = null
    }
  }

  const openMenu = (x: number, y: number, img: HTMLImageElement): void => {
    closeMenu()
    const src = img.currentSrc || img.src
    const label = img.alt || fallbackDict['save.fallbackName']
    if (!src) return
    menuImg = img
    const menu = document.createElement('div')
    menu.className = css.menu
    menu.setAttribute('role', 'menu')
    const copyButton = document.createElement('button')
    copyButton.className = css.item
    copyButton.type = 'button'
    copyButton.textContent = t('menu.copy')
    copyButton.addEventListener('click', event => {
      event.stopPropagation()
      event.preventDefault()
      closeMenu()
      copyImageInGesture(src)
    })
    const saveButton = document.createElement('button')
    saveButton.className = css.item
    saveButton.type = 'button'
    saveButton.textContent = t('menu.save')
    saveButton.addEventListener('click', event => {
      event.stopPropagation()
      event.preventDefault()
      closeMenu()
      saveImageInGesture(src, label)
    })
    menu.appendChild(copyButton)
    menu.appendChild(saveButton)
    document.body.appendChild(menu)
    menuEl = menu
    observeMenuImg()
    const rect = menu.getBoundingClientRect()
    let left = x
    let top = y
    if (left + rect.width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - rect.width - 8)
    if (top + rect.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - rect.height - 8)
    menu.style.left = `${left}px`
    menu.style.top = `${top}px`
  }

  const findImg = (target: EventTarget | null): HTMLImageElement | null => {
    if (!target || !(target instanceof Element)) return null
    if (target.tagName === 'IMG') return target as HTMLImageElement
    try {
      return target.closest('img')
    } catch {
      return null
    }
  }

  const onContextMenu = (event: MouseEvent): void => {
    const img = findImg(event.target)
    if (!img) {
      closeMenu()
      return
    }
    const src = img.currentSrc || img.src
    if (!src) {
      closeMenu()
      return
    }
    event.preventDefault()
    event.stopPropagation()
    try {
      openMenu(event.clientX, event.clientY, img)
    } catch (error) {
      console.error('[image-ctx-menu] open menu failed', error)
    }
  }

  const onDocDown = (event: Event): void => {
    if (!menuEl) return
    if (event.target instanceof Node && menuEl.contains(event.target)) return
    closeMenu()
  }

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') closeMenu()
  }

  ctx.effect(() => {
    document.addEventListener('contextmenu', onContextMenu as EventListener, true)
    document.addEventListener('mousedown', onDocDown, true)
    document.addEventListener('click', onDocDown, true)
    document.addEventListener('scroll', closeMenu, true)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('resize', closeMenu)
    window.addEventListener('blur', closeMenu)
    return () => {
      document.removeEventListener('contextmenu', onContextMenu as EventListener, true)
      document.removeEventListener('mousedown', onDocDown, true)
      document.removeEventListener('click', onDocDown, true)
      document.removeEventListener('scroll', closeMenu, true)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('blur', closeMenu)
      closeMenu()
      if (toastEl) {
        try {
          toastEl.remove()
        } catch {
          // toast 已被移除时忽略。
        }
        toastEl = null
      }
      if (toastDispose) {
        try {
          toastDispose()
        } catch {
          // 定时器已失效时忽略。
        }
        toastDispose = null
      }
    }
  })
}
