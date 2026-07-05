import fs from 'fs'
import path from 'path'
import jpeg from 'jpeg-js'

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  }
}

const fileBuffer = fs.readFileSync(path.resolve('test/image_1.jpeg'))
const img = jpeg.decode(fileBuffer, { useTops: true })

const asciiWidth = 85
const asciiHeight = 70
const scanHeight = 500

console.log(
  `Mapping top half of ${img.width}x${img.height} to ASCII grid ${asciiWidth}x${asciiHeight}`,
)

let output = ''
for (let ay = 0; ay < asciiHeight; ay++) {
  const y = Math.floor((ay / asciiHeight) * scanHeight)
  let line = `${String(y).padStart(4, ' ')}: `
  for (let ax = 0; ax < asciiWidth; ax++) {
    const x = Math.floor((ax / asciiWidth) * img.width)

    const idx = (y * img.width + x) * 4
    const r = img.data[idx]
    const g = img.data[idx + 1]
    const b = img.data[idx + 2]
    const { l } = rgbToHsl(r, g, b)

    // Since text is white, we look for very bright pixels (lightness > 85)
    // Dark background text is usually extremely bright
    if (l > 85) {
      line += '#'
    } else if (l > 60) {
      line += '.'
    } else {
      line += ' '
    }
  }
  output += line + '\n'
}

console.log(output)
