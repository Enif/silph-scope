import fs from 'fs'
import path from 'path'
import jpeg from 'jpeg-js'
import { createWorker } from 'tesseract.js'

function cropRawImage(
  src: { data: Buffer | Uint8Array; width: number; height: number },
  rect: { x: number; y: number; w: number; h: number },
) {
  const destData = Buffer.alloc(rect.w * rect.h * 4)
  for (let dy = 0; dy < rect.h; dy++) {
    const sy = rect.y + dy
    const srcOffset = (sy * src.width + rect.x) * 4
    const destOffset = dy * rect.w * 4
    const rowBytes = rect.w * 4
    for (let i = 0; i < rowBytes; i++) {
      destData[destOffset + i] = src.data[srcOffset + i]
    }
  }
  return {
    data: destData,
    width: rect.w,
    height: rect.h,
  }
}

async function run() {
  const imagePath = path.resolve('test/image_1.jpeg')
  const fileBuffer = fs.readFileSync(imagePath)
  const img = jpeg.decode(fileBuffer, { useTops: true })
  console.log(`Dimensions: ${img.width}x${img.height}`)

  // High-precision crops based on visual inspection
  const crops = [
    {
      name: 'CP Text',
      rect: { x: 150, y: 60, w: img.width - 300, h: 60 },
      lang: 'eng',
    },
    {
      name: 'Pokemon Name',
      rect: { x: 100, y: 500, w: img.width - 200, h: 70 },
      lang: 'kor+eng',
    },
    {
      name: 'HP Text',
      rect: { x: 150, y: 580, w: img.width - 300, h: 35 },
      lang: 'eng',
    },
    {
      name: 'Appraisal Bubble Text',
      rect: { x: 20, y: 1140, w: img.width - 40, h: 120 },
      lang: 'kor+eng',
    },
  ]

  for (const crop of crops) {
    console.log(`Running Tesseract for ${crop.name} using [${crop.lang}]...`)
    const cropped = cropRawImage(img, crop.rect)
    const jpgBuffer = jpeg.encode(cropped, 95).data

    // Save the crops to verify they look correct visually
    const filename = `test_crop_v2_${crop.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`
    fs.writeFileSync(path.resolve('test', filename), jpgBuffer)

    const worker = await createWorker(crop.lang)
    const res = await worker.recognize(jpgBuffer)
    console.log(`[Result: ${crop.name}]`)
    console.log(res.data.text.trim())
    console.log('---------------------------------------------')
    await worker.terminate()
  }
}

run().catch(console.error)
