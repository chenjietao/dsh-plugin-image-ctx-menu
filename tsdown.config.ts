/**
 * Client bundle builder for dsh-plugin-image-ctx-menu.
 *
 * 输出与 harness 官方 client 插件相同的 lazy-CJS factory 产物：
 * `window.__ModuleLoader__.load({ id, factory })`，供 dsh-client-modules
 * 模块表加载。react / react-dom / cordis 走外部模块表行，其余依赖内联。
 */
import { defineConfig } from 'tsdown'

const id = 'dsh-plugin-image-ctx-menu'

/** Shell 种子表已提供的模块：bundle 中保持外部引用。 */
const EXTERNAL = new Set([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
])

export default defineConfig([
  // Node 半：Loader import 的入口（空 apply，占位）。
  {
    name: `${id}/lib`,
    entry: { index: 'lib/types/index.js' },
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    dts: false,
    sourcemap: false,
    clean: false,
  },
  // Browser 半：模块表加载的 factory 产物。
  {
    name: `${id}/client`,
    entry: { client: 'lib/types/client/index.js' },
    outDir: 'lib',
    format: ['cjs'],
    platform: 'browser',
    target: 'es2024',
    dts: false,
    sourcemap: true,
    clean: false,
    external: [...EXTERNAL],
    outputOptions: {
      entryFileNames: 'client.js',
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      footer: 'return module.exports; } });',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
    },
  },
])
