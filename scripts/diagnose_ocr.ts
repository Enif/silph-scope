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

    // Copy row
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
  console.log('Loading image:', imagePath)
  const fileBuffer = fs.readFileSync(imagePath)
  const img = jpeg.decode(fileBuffer, { useTops: true })
  console.log(`Dimensions: ${img.width}x${img.height}`)

  // We crop the top 35% of the image (y from 40 to 450)
  // Let's divide it into three vertical bands:
  // 1. CP band: y=40 to y=150
  // 2. Name band: y=140 to y=250
  // 3. HP band: y=240 to y=360

  const cpRect = { x: 20, y: 40, w: img.width - 40, h: 100 }
  const nameRect = { x: 20, y: 130, w: img.width - 40, h: 100 }
  const hpRect = { x: 20, y: 220, w: img.width - 40, h: 110 }

  const cpRaw = cropRawImage(img, cpRect)
  const nameRaw = cropRawImage(img, nameRect)
  const hpRaw = cropRawImage(img, hpRect)

  // Encode back to JPEG buffers
  const cpJpg = jpeg.encode(cpRaw, 90).data
  const nameJpg = jpeg.encode(nameRaw, 90).data
  const hpJpg = jpeg.encode(hpRaw, 90).data

  console.log('Initializing Tesseract worker...')
  const worker = await createWorker('eng+kor')

  console.log('Recognizing CP Region...')
  const cpRes = await worker.recognize(cpJpg)
  console.log('--- CP Raw Result ---')
  console.log(cpRes.data.text.trim())

  console.log('Recognizing Name Region...')
  const nameRes = await worker.recognize(nameJpg)
  console.log('--- Name Raw Result ---')
  console.log(nameRes.data.text.trim())

  console.log('Recognizing HP Region...')
  const hpRes = await worker.recognize(hpJpg)
  console.log('--- HP Raw Result ---')
  console.log(hpRes.data.text.trim())

  await worker.terminate()
}

run().catch(console.error)
