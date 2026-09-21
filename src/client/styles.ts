/**
 * 内联样式（与官方 dsh-css-modules-inline 等价的手工版）：
 * 避免引入 lightningcss，保持零运行时依赖。
 */
export const MENU_CSS = [
  '.dsh-imgctx-menu{position:fixed;z-index:2147483647;min-width:168px;padding:6px;margin:0;',
  'background:#fff;color:#1a1a1a;border:1px solid rgba(0,0,0,.12);border-radius:10px;',
  'box-shadow:0 8px 28px rgba(0,0,0,.18);font-size:13px;line-height:20px;user-select:none}',
  '.dsh-imgctx-item{display:block;width:100%;text-align:left;background:transparent;border:none;',
  'border-radius:6px;padding:8px 12px;font-size:13px;line-height:20px;color:inherit;cursor:pointer}',
  '.dsh-imgctx-item:hover{background:#f0f0f2}',
  '.dsh-imgctx-item:active{background:#e4e4e7}',
  '.dsh-imgctx-toast{position:fixed;left:50%;bottom:48px;transform:translateX(-50%);',
  'z-index:2147483647;background:rgba(20,20,22,.92);color:#fff;font-size:13px;line-height:20px;',
  'padding:9px 16px;border-radius:20px;box-shadow:0 4px 16px rgba(0,0,0,.25);',
  'pointer-events:none;white-space:nowrap;max-width:80vw;overflow:hidden;text-overflow:ellipsis}',
  '.dsh-imgctx-toast[data-kind="error"]{background:rgba(190,30,40,.95)}',
  '@media (prefers-color-scheme:dark){',
  '.dsh-imgctx-menu{background:#26262b;color:#f2f2f4;border-color:rgba(255,255,255,.14)}',
  '.dsh-imgctx-item:hover{background:#38383f}',
  '.dsh-imgctx-item:active{background:#45454e}',
  '}',
].join('\n')

/** 样式类名映射（与 CSS 中的类一一对应）。 */
export const css = {
  menu: 'dsh-imgctx-menu',
  item: 'dsh-imgctx-item',
  toast: 'dsh-imgctx-toast',
} as const

/** 插入本插件的样式表（幂等），返回移除函数。 */
export function insertStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  const tagId = 'dsh-plugin-image-ctx-menu/menu.css'
  if (document.querySelector(`style[data-plugin-css="${tagId}"]`) !== null) return () => {}
  const tag = document.createElement('style')
  tag.dataset.plugin = 'dsh-plugin-image-ctx-menu'
  tag.dataset.pluginCss = tagId
  tag.textContent = MENU_CSS
  document.head.appendChild(tag)
  return () => {
    tag.remove()
  }
}
