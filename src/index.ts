/**
 * dsh-plugin-image-ctx-menu，node 半。
 *
 * 纯浏览器插件：node 半是空 apply，占位以便 Loader 能 import 包入口；
 * 真正的行为在 `./client` 导出（browser 半），由 dsh-client-modules
 * 通过 package.json 的 `dsh.client` 声明发现并加载。
 */

/** Host 插件体——本插件无 host 侧行为。 */
export function apply(): void {}
