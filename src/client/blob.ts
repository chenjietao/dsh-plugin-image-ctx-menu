/**
 * 图片字节读取：data: URL 直接解码，其余先 XHR 取 blob，
 * 失败时回退到 canvas 重绘（可绕过部分跨域限制）。
 */

/** data: URL 解码为 Blob。 */
export function dataURLToBlob(src: string): Blob {
  const comma = src.indexOf(',')
  const head = src.slice(0, comma)
  const body = src.slice(comma + 1)
  let mime = 'image/png'
  const match = /^data:([^;,]+)?(;base64)?/iu.exec(head)
  if (match?.[1]) mime = match[1]
  const isBase64 = /;base64/iu.test(head)
  let bytes: Uint8Array
  if (isBase64) {
    const bin = atob(body)
    bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  } else {
    const decoded = decodeURIComponent(body)
    bytes = new Uint8Array(decoded.length)
    for (let j = 0; j < decoded.length; j++) bytes[j] = decoded.charCodeAt(j)
  }
  return new Blob([bytes as BlobPart], { type: mime })
}

/** XHR 读取图片为 Blob（保留原始字节与 MIME）。 */
function getBlobViaXHR(src: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', src, true)
      xhr.responseType = 'blob'
      xhr.onload = () => {
        if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) resolve(xhr.response as Blob)
        else reject(new Error(`load failed (${xhr.status})`))
      }
      xhr.onerror = () => { reject(new Error('load failed')) }
      xhr.send()
    } catch (error) {
      reject(error)
    }
  })
}

/** canvas 重绘图片为 PNG Blob（XHR 失败时的兜底）。 */
function getBlobViaCanvas(src: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const image = new Image()
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = image.naturalWidth || image.width
          canvas.height = image.naturalHeight || image.height
          const graphics = canvas.getContext('2d')
          if (!graphics) {
            reject(new Error('encode failed'))
            return
          }
          graphics.drawImage(image, 0, 0)
          if (canvas.toBlob) {
            canvas.toBlob(blob => {
              if (blob) resolve(blob)
              else reject(new Error('encode failed'))
            }, 'image/png')
          } else {
            reject(new Error('encode failed'))
          }
        } catch (error) {
          reject(error)
        }
      }
      image.onerror = () => { reject(new Error('load failed')) }
      image.src = src
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 读取一张图片的原始字节。
 * @param src - 图片 URL（blob:/data:/http(s):）。
 * @returns 图片 Blob（尽量保留原始 MIME）。
 */
export function loadBlob(src: string): Promise<Blob> {
  if (src.startsWith('data:')) {
    try {
      return Promise.resolve(dataURLToBlob(src))
    } catch (error) {
      return Promise.reject(error)
    }
  }
  return getBlobViaXHR(src).catch(() => getBlobViaCanvas(src))
}

/** 非 PNG 的 Blob 经 canvas 转码为 PNG（剪贴板兼容性）。 */
export function blobToPngBlob(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      if (blob.type === 'image/png') {
        resolve(blob)
        return
      }
      const url = URL.createObjectURL(blob)
      const cleanup = (): void => {
        try {
          URL.revokeObjectURL(url)
        } catch {
          // 释放失败不影响结果。
        }
      }
      const viaCanvas = (width: number, height: number, draw: (graphics: CanvasRenderingContext2D) => void): void => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const graphics = canvas.getContext('2d')
          if (!graphics) {
            cleanup()
            reject(new Error('encode failed'))
            return
          }
          draw(graphics)
          cleanup()
          if (canvas.toBlob) {
            canvas.toBlob(result => {
              if (result) resolve(result)
              else reject(new Error('encode failed'))
            }, 'image/png')
          } else {
            reject(new Error('encode failed'))
          }
        } catch (error) {
          cleanup()
          reject(error)
        }
      }
      const viaImage = (): void => {
        const image = new Image()
        image.onload = () => {
          viaCanvas(image.naturalWidth || image.width, image.naturalHeight || image.height, graphics => {
            graphics.drawImage(image, 0, 0)
          })
        }
        image.onerror = () => {
          cleanup()
          reject(new Error('load failed'))
        }
        image.src = url
      }
      if (window.createImageBitmap) {
        window.createImageBitmap(blob).then(bitmap => {
          viaCanvas(bitmap.width, bitmap.height, graphics => {
            graphics.drawImage(bitmap, 0, 0)
            try {
              bitmap.close()
            } catch {
              // 关闭失败不影响结果。
            }
          })
        }).catch(viaImage)
      } else {
        viaImage()
      }
    } catch (error) {
      reject(error)
    }
  })
}
