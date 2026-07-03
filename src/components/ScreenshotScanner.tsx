import React, { useState, useRef } from 'react'
import { scanAppraisalScreenshot } from '../utils/scanner'

interface ScreenshotScannerProps {
  onScanSuccess: (atk: number, def: number, hp: number) => void
}

export const ScreenshotScanner: React.FC<ScreenshotScannerProps> = ({ onScanSuccess }) => {
  const [scanMessage, setScanMessage] = useState<{ text: string; isError: boolean } | null>(null)
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
          setScanMessage({ text: 'Error: Canvas elements are not loaded yet.', isError: true })
          return
        }
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const result = scanAppraisalScreenshot(canvas)

        if (result.success) {
          onScanSuccess(result.atk, result.def, result.hp)
          setScanMessage({
            text: `Successfully scanned! IVs detected: Atk: ${result.atk}, Def: ${result.def}, HP: ${result.hp}`,
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
              (barXEnd - barXStart) + 40,
              (barYCoords[2] - barYCoords[0]) + 40
            )
          }
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
      <h3 className="text-xs text-text-muted font-bold uppercase tracking-[1.5px]">📸 Quick Scan Screenshot</h3>
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
        <label htmlFor="screenshot-input" className="flex flex-col items-center gap-2 cursor-pointer">
          <span className="text-[1.8rem]">📤</span>
          <span className="font-semibold text-[0.85rem]">Select Screenshot Image</span>
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

      <div className="mt-2" style={{ display: uploadedImageSrc ? 'block' : 'none' }}>
        <span className="text-[0.8rem] text-text-muted block mb-1.5">Visual Scanner Scan Preview:</span>
        <canvas ref={canvasRef} className="w-full max-h-[400px] object-contain rounded-lg border border-border-light bg-black" />
      </div>
    </div>
  )
}
