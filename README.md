# dsh-plugin-image-ctx-menu（图片右键菜单）

[English](README.en.md) | 中文

会话图片右键增强：右键任意会话图片（缩略图 / 放大预览），弹出菜单提供两个操作：

- **复制图片**：原图字节写入剪贴板（非截图，无损），可在手势内同步调用 `clipboard.write`；非 PNG 自动转码。
- **图片另存为**：优先 `showSaveFilePicker` 弹出系统文件选择器；不支持时降级为 `a[download]` 下载。

文案走 `image-ctx-menu` locale 命名空间：仅简体中文环境用中文词典，其余语言一律默认英文（国际化兜底，避免第三语言用户面对看不懂的中文）。

## 安装

```sh
# 发布到 npm 后：
dsh plugin --profile <name> add dsh-plugin-image-ctx-menu

# 本地目录安装：
dsh plugin --profile <name> add ./dsh-plugin-image-ctx-menu

# 验证层并启动：
dsh --profile <name> --dump-config
dsh --profile <name>
```

需要 `dsh --profile demo` 之类的 Web profile（本插件是 browser 半，需要 Web 页面承载）。

## 使用

1. 在会话里右键任意图片（缩略图或点开的大图）。
2. 点「复制图片」→ 粘贴到其他应用；点「图片另存为」→ 选位置保存。
3. 若浏览器首次拦截剪贴板，按提示再点一次「复制图片」即可。

## 包结构

```
dsh-plugin-image-ctx-menu/
├── package.json        # dsh.bundle + dsh.client 双 manifest
├── cordis.patch.yml    # 自带 composition 层：插入 dsh-image-ctx-menu 行
├── src/
│   ├── index.ts        # node 半（空 apply 占位）
│   └── client/
│       ├── index.ts    # browser 半（右键菜单全部逻辑）
│       ├── locales.ts  # 中英双语词典（zh 为源头）
│       ├── blob.ts     # 图片字节读取（XHR / canvas 兜底）
│       ├── naming.ts   # 文件名清理与扩展名推断（纯函数）
│       └── styles.ts   # 内联样式（零依赖）
├── tests/
│   └── naming.spec.ts  # 纯函数 + 词典 key 一致性单测
├── lib/                # 构建产物（publish 时包含，不进 git）
│   ├── index.js        # node 半
│   ├── client.js       # browser 半（ModuleLoader factory）
│   └── types/          # tsc 类型声明
├── tsconfig.json
└── tsdown.config.ts
```

## 开发

```sh
npm install
npm run build    # tsc + tsdown：lib/index.js + lib/client.js
npm test         # vitest 纯函数单测
```

- 无需 `pluginId`：动态插件的 `imgctx-1` 这类 ID 只存在于内存态；npm 包形态下插件身份就是包名，`cordis.patch.yml` 的行 `id: dsh-image-ctx-menu` 引用它。
- 也没有 `plugin.json`：它的作用（备份元数据 + 恢复步骤）被 `package.json`（`dsh` manifest）+ `cordis.patch.yml`（composition 层）正式接管。
- 构建产物 `lib/` 由 `prepare` / `prepublishOnly` 生成：`npm publish` 带构建产物发布，`dsh plugin add` 到手即用，无需用户授权构建；`github:` 安装走源码，需要用户在 profile 的 `pnpm-workspace.yaml` 里 `allowBuilds` 授权（详见 harness 发布文档）。

## 已知限制

- 复制依赖 `navigator.clipboard.write` + `ClipboardItem`：不支持的环境会提示「当前环境不支持复制图片」。
- 另存为的文件选择器依赖 `showSaveFilePicker`（Chromium 系）：不支持时自动降级为下载。
