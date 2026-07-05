import React, { useState, useRef } from 'react'
import { createWorker } from 'tesseract.js'
import { scanAppraisalScreenshot } from '../utils/scanner'

interface ScreenshotScannerProps {
  onScanSuccess: (
    atk: number,
    def: number,
    hp: number,
    pokemonName?: string,
    cp?: number,
    hpMax?: number,
  ) => void
}

function cropCanvasToDataUrl(
  canvas: HTMLCanvasElement,
  xPercent: number,
  yPercent: number,
  wPercent: number,
  hPercent: number,
): string {
  const cropCanvas = document.createElement('canvas')
  const x = Math.round(canvas.width * xPercent)
  const y = Math.round(canvas.height * yPercent)
  const w = Math.round(canvas.width * wPercent)
  const h = Math.round(canvas.height * hPercent)

  cropCanvas.width = w
  cropCanvas.height = h
  const cropCtx = cropCanvas.getContext('2d')
  if (cropCtx) {
    cropCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h)
  }
  return cropCanvas.toDataURL('image/png')
}

export const ScreenshotScanner: React.FC<ScreenshotScannerProps> = ({
  onScanSuccess,
}) => {
  const [scanMessage, setScanMessage] = useState<{
    text: string
    isError: boolean
  } | null>(null)
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setScanMessage({ text: 'Processing image...', isError: false })

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setUploadedImageSrc(event.target?.result as string)
        const canvas = canvasRef.current
        if (!canvas) {
          setScanMessage({
            text: 'Error: Canvas elements are not loaded yet.',
            isError: true,
          })
          return
        }
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const result = scanAppraisalScreenshot(canvas)

        if (result.success) {
          // Immediately notify parent about IV values
          onScanSuccess(result.atk, result.def, result.hp)
          setScanMessage({
            text: `IVs scanned! Atk: ${result.atk}, Def: ${result.def}, HP: ${result.hp}. Running OCR for Name, CP, HP...`,
            isError: false,
          })

          if (result.debugInfo) {
            const { barXStart, barXEnd, barYCoords } = result.debugInfo
            ctx.strokeStyle = 'rgba(0, 255, 128, 0.8)'
            ctx.lineWidth = Math.max(3, Math.round(canvas.width * 0.005))

            barYCoords.forEach((y) => {
              ctx.beginPath()
              ctx.moveTo(barXStart, y)
              ctx.lineTo(barXEnd, y)
              ctx.stroke()
            })

            ctx.strokeStyle = 'rgba(0, 255, 128, 0.4)'
            ctx.strokeRect(
              barXStart - 20,
              barYCoords[0] - 20,
              barXEnd - barXStart + 40,
              barYCoords[2] - barYCoords[0] + 40,
            )
          }

          // Asynchronously perform OCR for CP, Name, and HP
          ;(async () => {
            try {
              // 1. Crop canvas to data URLs using relative dimensions derived from 589x1280 template
              const cpUrl = cropCanvasToDataUrl(
                canvas,
                150 / 589,
                60 / 1280,
                289 / 589,
                60 / 1280,
              )
              const nameUrl = cropCanvasToDataUrl(
                canvas,
                100 / 589,
                500 / 1280,
                389 / 589,
                70 / 1280,
              )
              const hpUrl = cropCanvasToDataUrl(
                canvas,
                150 / 589,
                575 / 1280,
                289 / 589,
                45 / 1280,
              )

              // 2. Initialize Tesseract worker with local assets (gzip: false for raw files)
              const worker = await createWorker('kor+eng', 1, {
                workerPath: `${window.location.origin}/tesseract-assets/worker.min.js`,
                corePath: `${window.location.origin}/tesseract-assets`,
                langPath: window.location.origin,
                gzip: false,
                logger: (m) => console.log('Tesseract:', m),
              })

              // 3. Recognize with dynamic whitelists to improve accuracy
              // For Name: no whitelist (supports Korean and English names)
              await worker.setParameters({ tessedit_char_whitelist: '' })
              const nameRes = await worker.recognize(nameUrl)

              // For CP: whitelist digits only (prevents "CP" letters from being misread as digits)
              await worker.setParameters({
                tessedit_char_whitelist: '0123456789',
              })
              const cpRes = await worker.recognize(cpUrl)

              // For HP: whitelist digits and slashes only (prevents "HP" letters from being misread)
              await worker.setParameters({
                tessedit_char_whitelist: '0123456789/',
              })
              const hpRes = await worker.recognize(hpUrl)

              await worker.terminate()

              // 4. Parse results
              const rawCpText = cpRes.data.text.trim()
              const rawNameText = nameRes.data.text.trim()
              const rawHpText = hpRes.data.text.trim()

              // Extract values
              const cpMatch = rawCpText.match(/\d+/)
              const cp = cpMatch ? parseInt(cpMatch[0]) : undefined

              // Extract HP value with smart fallbacks for merged digits (e.g. "103108" -> 108, "103103" -> 103)
              let hpMax: number | undefined = undefined
              const cleanedHpText = rawHpText.replace(/[^0-9/]/g, '')
              const hpSlashMatch = cleanedHpText.match(/(\d+)\s*\/\s*(\d+)/)
              if (hpSlashMatch) {
                hpMax = parseInt(hpSlashMatch[2])
              } else {
                const digitMatch = cleanedHpText.match(/\d+/)
                if (digitMatch) {
                  const digits = digitMatch[0]
                  if (digits.length >= 5) {
                    const val = parseInt(digits.slice(-3))
                    if (val >= 10 && val <= 500) hpMax = val
                  } else if (digits.length === 4) {
                    const last3 = parseInt(digits.slice(-3))
                    if (last3 >= 10 && last3 <= 500) {
                      hpMax = last3
                    } else {
                      const last2 = parseInt(digits.slice(-2))
                      if (last2 >= 10 && last2 <= 500) hpMax = last2
                    }
                  } else {
                    const val = parseInt(digits)
                    if (val >= 10 && val <= 500) hpMax = val
                  }
                }
              }

              const pokemonName = rawNameText || undefined

              // 5. Update parent states with OCR results
              onScanSuccess(
                result.atk,
                result.def,
                result.hp,
                pokemonName,
                cp,
                hpMax,
              )

              setScanMessage({
                text: `Successfully scanned! IVs: Atk: ${result.atk}, Def: ${result.def}, HP: ${result.hp}${
                  pokemonName ? `, Pokémon: ${pokemonName}` : ''
                }${cp ? `, CP: ${cp}` : ''}${hpMax ? `, HP: ${hpMax}` : ''}`,
                isError: false,
              })
            } catch (err) {
              console.error('OCR failed:', err)
              // We still have IVs, so don't treat it as a hard failure
              setScanMessage({
                text: `IVs detected: Atk: ${result.atk}, Def: ${result.def}, HP: ${result.hp}. (OCR failed to recognize Name/CP/HP)`,
                isError: false,
              })
            }
          })()
        } else {
          setScanMessage({
            text: `Scanning failed: ${result.message}`,
            isError: true,
          })
        }
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-3 font-sans">
      <h3 className="text-xs text-text-muted font-bold uppercase tracking-[1.5px]">
        📸 Quick Scan Screenshot
      </h3>
      <p className="text-[0.8rem] text-text-muted">
        Upload an appraisal screen to automatically extract IVs
      </p>
      <div className="relative border-2 border-dashed border-white/15 rounded-xl p-6 text-center cursor-pointer hover:border-accent-blue hover:bg-accent-blue/3 bg-black/15 transition-all duration-300">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          id="screenshot-input"
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
        <label
          htmlFor="screenshot-input"
          className="flex flex-col items-center gap-2 cursor-pointer"
        >
          <span className="text-[1.8rem]">📤</span>
          <span className="font-semibold text-[0.85rem]">
            Select Screenshot Image
          </span>
        </label>
      </div>

      {scanMessage && (
        <div
          className={`p-3 px-3.5 rounded-lg text-xs font-semibold ${
            scanMessage.isError
              ? 'bg-bar-red/10 border border-bar-red/20 text-bar-red'
              : 'bg-accent-green/10 border border-accent-green/20 text-accent-green'
          }`}
        >
          {scanMessage.text}
        </div>
      )}

      <div
        className="mt-2"
        style={{ display: uploadedImageSrc ? 'block' : 'none' }}
      >
        <span className="text-[0.8rem] text-text-muted block mb-1.5">
          Visual Scanner Scan Preview:
        </span>
        <canvas
          ref={canvasRef}
          className="w-full max-h-[400px] object-contain rounded-lg border border-border-light bg-black"
        />
      </div>
    </div>
  )
}
