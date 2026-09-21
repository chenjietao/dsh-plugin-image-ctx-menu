# dsh-plugin-image-ctx-menu (Image Context Menu)

English | [中文](README.md)

Right-click enhancement for session images: right-click any session image (thumbnail / enlarged preview) to open a menu with two actions:

- **Copy image**: writes the original image bytes to the clipboard (lossless, not a screenshot) via `clipboard.write` inside the click gesture; non-PNG images are transcoded automatically.
- **Save image as…**: prefers the `showSaveFilePicker` system file picker; falls back to `a[download]` where unsupported.

Copy lives in the `image-ctx-menu` locale namespace with Chinese and English dictionaries that follow the DSH app language.

## Install

```sh
# After publishing to npm:
dsh plugin --profile <name> add dsh-plugin-image-ctx-menu

# From a local directory:
dsh plugin --profile <name> add ./dsh-plugin-image-ctx-menu

# Verify the layer, then start:
dsh --profile <name> --dump-config
dsh --profile <name>
```

Requires a Web profile such as `dsh --profile demo` (this plugin has a browser half that needs the Web page).

## Usage

1. Right-click any image in the session (thumbnail or enlarged preview).
2. Click “Copy image” then paste elsewhere, or “Save image as…” to pick a location.
3. If the browser blocks clipboard access the first time, click “Copy image” once more as prompted.

## Known limitations

- Copying requires `navigator.clipboard.write` + `ClipboardItem`; unsupported environments show a notice.
- The save picker requires `showSaveFilePicker` (Chromium-based); other browsers fall back to download.
