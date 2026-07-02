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
    <div className="screenshot-upload-zone">
      <h3 className="section-subtitle">📸 Quick Scan Screenshot</h3>
      <p className="scan-instructions">
        Upload an appraisal screen to automatically extract IVs
      </p>
      <div className="file-drop-area">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          id="screenshot-input"
        />
        <label htmlFor="screenshot-input" className="file-label">
          <span className="upload-icon">📤</span>
          <span>Select Screenshot Image</span>
        </label>
      </div>

      {scanMessage && (
        <div className={`scan-message ${scanMessage.isError ? 'error' : 'success'}`}>
          {scanMessage.text}
        </div>
      )}

      <div className="scan-preview-wrapper" style={{ display: uploadedImageSrc ? 'block' : 'none' }}>
        <span className="preview-label">Visual Scanner Scan Preview:</span>
        <canvas ref={canvasRef} className="scan-canvas" />
      </div>
    </div>
  )
}
