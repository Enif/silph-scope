import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import jpeg from 'jpeg-js'
import { scanAppraisalScreenshot } from './scanner'

describe('Image Scanner Core Tests', () => {
  it('should scan test/image_1.jpeg and correctly extract IVs 2/8/13', () => {
    const imgPath = path.resolve('test/image_1.jpeg')
    expect(fs.existsSync(imgPath)).toBe(true)

    const fileBuffer = fs.readFileSync(imgPath)
    const rawImageData = jpeg.decode(fileBuffer, { useTops: true })

    const mockCanvas = {
      width: rawImageData.width,
      height: rawImageData.height,
      getContext: (type: string) => {
        if (type !== '2d') return null
        return {
          getImageData: (x: number, y: number, w: number, h: number) => {
            const startOffset = (y * rawImageData.width + x) * 4
            const endOffset = ((y + h) * rawImageData.width + x) * 4
            const slicedData = Uint8ClampedArray.from(
              rawImageData.data.slice(startOffset, endOffset),
            )
            return {
              data: slicedData,
              width: w,
              height: h,
            }
          },
        }
      },
    } as unknown as HTMLCanvasElement

    const result = scanAppraisalScreenshot(mockCanvas)
    expect(result.success).toBe(true)
    expect(result.atk).toBe(2)
    expect(result.def).toBe(8)
    expect(result.hp).toBe(13)
  })
})
