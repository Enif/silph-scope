import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createWorker } from 'tesseract.js'
import type { Worker } from 'tesseract.js'
import { scanAppraisalScreenshot } from '../utils/scanner'

export interface ScanResult {
  atk: number
  def: number
  hp: number
  pokemonName?: string
  cp?: number
  hpMax?: number
}

export interface ScanFeedback {
  /** Korean name of the Pokémon that was matched from the OCR text, if any */
  matchedNameKo?: string
  /** HP value after smart correction */
  finalHp?: number
}

interface ScreenshotScannerProps {
  onScanSuccess: (result: ScanResult) => ScanFeedback
}

// Reference template the crop regions were measured on
const TEMPLATE_WIDTH = 589
const TEMPLATE_HEIGHT = 1280
const TEMPLATE_RATIO = TEMPLATE_WIDTH / TEMPLATE_HEIGHT

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

/** Extract max HP from OCR text, with fallbacks for merged digits (e.g. "103108" -> 108) */
function parseHpMax(rawHpText: string): number | undefined {
  const cleanedHpText = rawHpText.replace(/[^0-9/]/g, '')
  const hpSlashMatch = cleanedHpText.match(/(\d+)\s*\/\s*(\d+)/)
  if (hpSlashMatch) return parseInt(hpSlashMatch[2])

  const digitMatch = cleanedHpText.match(/\d+/)
  if (!digitMatch) return undefined
  const digits = digitMatch[0]
  const inRange = (v: number) => v >= 10 && v <= 500

  if (digits.length >= 5) {
    const val = parseInt(digits.slice(-3))
    return inRange(val) ? val : undefined
  }
  if (digits.length === 4) {
    const last3 = parseInt(digits.slice(-3))
    if (inRange(last3)) return last3
    const last2 = parseInt(digits.slice(-2))
    return inRange(last2) ? last2 : undefined
  }
  const val = parseInt(digits)
  return inRange(val) ? val : undefined
}

// Shared Tesseract worker: language data (~7MB) is loaded only once per session
let workerPromise: Promise<Worker> | null = null
let progressListener: ((status: string, progress: number) => void) | null = null

function getOcrWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('kor+eng', 1, {
      workerPath: `${window.location.origin}/tesseract-assets/worker.min.js`,
      corePath: `${window.location.origin}/tesseract-assets`,
      langPath: window.location.origin,
      gzip: false,
      logger: (m) => progressListener?.(m.status, m.progress),
    }).catch((err) => {
      workerPromise = null
      throw err
    })
  }
  return workerPromise
}

const statusLabels: Record<string, string> = {
  'loading tesseract core': 'OCR 엔진 불러오는 중',
  'initializing tesseract': 'OCR 엔진 초기화 중',
  'loading language traineddata': '언어 데이터 불러오는 중 (최초 1회)',
  'initializing api': 'OCR 준비 중',
  'recognizing text': '글자 인식 중',
}

type Phase = 'idle' | 'ocr' | 'done' | 'error'

interface Summary {
  ivs: { atk: number; def: number; hp: number }
  ocrText?: string
  matchedNameKo?: string
  cp?: number
  hp?: number
  ocrFailed?: boolean
}

export const ScreenshotScanner: React.FC<ScreenshotScannerProps> = ({
  onScanSuccess,
}) => {
  const [phase, setPhase] = useState<Phase>('idle')
  const [errorText, setErrorText] = useState<string | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [progress, setProgress] = useState<{ label: string; value: number }>({
    label: '',
    value: 0,
  })
  const [ratioWarning, setRatioWarning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [hasPreview, setHasPreview] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const runOcr = useCallback(
    async (
      canvas: HTMLCanvasElement,
      ivs: { atk: number; def: number; hp: number },
    ) => {
      setPhase('ocr')
      setProgress({ label: 'OCR 준비 중', value: 0 })
      progressListener = (status, value) =>
        setProgress({ label: statusLabels[status] ?? status, value })

      try {
        const cpUrl = cropCanvasToDataUrl(
          canvas,
          150 / TEMPLATE_WIDTH,
          60 / TEMPLATE_HEIGHT,
          289 / TEMPLATE_WIDTH,
          60 / TEMPLATE_HEIGHT,
        )
        const nameUrl = cropCanvasToDataUrl(
          canvas,
          100 / TEMPLATE_WIDTH,
          500 / TEMPLATE_HEIGHT,
          389 / TEMPLATE_WIDTH,
          70 / TEMPLATE_HEIGHT,
        )
        const hpUrl = cropCanvasToDataUrl(
          canvas,
          150 / TEMPLATE_WIDTH,
          575 / TEMPLATE_HEIGHT,
          289 / TEMPLATE_WIDTH,
          45 / TEMPLATE_HEIGHT,
        )

        const worker = await getOcrWorker()

        // Name: no whitelist (supports Korean and English names)
        await worker.setParameters({ tessedit_char_whitelist: '' })
        const nameRes = await worker.recognize(nameUrl)
        // CP: digits only (prevents "CP" letters from being misread)
        await worker.setParameters({ tessedit_char_whitelist: '0123456789' })
        const cpRes = await worker.recognize(cpUrl)
        // HP: digits and slash only
        await worker.setParameters({ tessedit_char_whitelist: '0123456789/' })
        const hpRes = await worker.recognize(hpUrl)

        const cpMatch = cpRes.data.text.trim().match(/\d+/)
        const cp = cpMatch ? parseInt(cpMatch[0]) : undefined
        const hpMax = parseHpMax(hpRes.data.text.trim())
        const pokemonName = nameRes.data.text.trim() || undefined

        const feedback = onScanSuccess({ ...ivs, pokemonName, cp, hpMax })

        setSummary({
          ivs,
          ocrText: pokemonName,
          matchedNameKo: feedback.matchedNameKo,
          cp,
          hp: feedback.finalHp ?? hpMax,
        })
        setPhase('done')
      } catch (err) {
        console.error('OCR failed:', err)
        setSummary({ ivs, ocrFailed: true })
        setPhase('done')
      } finally {
        progressListener = null
      }
    },
    [onScanSuccess],
  )

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        setPhase('error')
        setErrorText('이미지 파일만 업로드할 수 있습니다.')
        return
      }
      if (phase === 'ocr') return

      setErrorText(null)
      setSummary(null)
      setPhase('ocr')
      setProgress({ label: '이미지 분석 중', value: 0 })

      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!canvas || !ctx) {
          setPhase('error')
          setErrorText('캔버스를 초기화하지 못했습니다. 다시 시도해 주세요.')
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        setHasPreview(true)
        setRatioWarning(
          Math.abs(img.width / img.height - TEMPLATE_RATIO) / TEMPLATE_RATIO >
            0.08,
        )

        const result = scanAppraisalScreenshot(canvas)
        if (!result.success) {
          setPhase('error')
          setErrorText(
            `IV 막대를 찾지 못했습니다. 포켓몬 GO 감정 화면 전체가 보이는 스크린샷인지 확인해 주세요. (${result.message})`,
          )
          return
        }

        const ivs = { atk: result.atk, def: result.def, hp: result.hp }
        // Apply IVs immediately so the dashboard updates while OCR runs
        onScanSuccess(ivs)

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

        void runOcr(canvas, ivs)
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        setPhase('error')
        setErrorText('이미지를 불러오지 못했습니다.')
      }
      img.src = url
    },
    [onScanSuccess, runOcr, phase],
  )

  // Paste screenshot from clipboard anywhere on the page (Ctrl/⌘+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      )
        return
      const file = Array.from(e.clipboardData?.files ?? []).find((f) =>
        f.type.startsWith('image/'),
      )
      if (file) {
        e.preventDefault()
        processFile(file)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [processFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset so selecting the same file again still triggers onChange
    e.target.value = ''
    if (file) processFile(file)
  }

  const isBusy = phase === 'ocr'

  return (
    <div className="flex flex-col gap-3 font-sans">
      <h3 className="text-xs text-text-muted font-bold uppercase tracking-[1.5px]">
        📸 스크린샷으로 빠르게 입력
      </h3>
      <p className="text-[0.8rem] text-text-muted">
        감정 화면 스크린샷을 올리면 IV, 포켓몬 이름, CP, HP를 자동으로
        읽어옵니다.
      </p>

      <div
        role="button"
        tabIndex={0}
        aria-busy={isBusy}
        onClick={() => !isBusy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isBusy) {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files?.[0]
          if (file) processFile(file)
        }}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 outline-none focus-visible:border-accent-blue ${
          isBusy ? 'cursor-wait opacity-70' : 'cursor-pointer'
        } ${
          isDragging
            ? 'border-accent-blue bg-accent-blue/10'
            : 'border-white/15 bg-black/15 hover:border-accent-blue hover:bg-accent-blue/3'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <span className="text-[1.8rem]">{isBusy ? '⏳' : '📤'}</span>
          <span className="font-semibold text-[0.85rem]">
            {isBusy ? '분석 중...' : '스크린샷 선택'}
          </span>
          <span className="text-[0.7rem] text-text-muted">
            클릭 · 드래그 앤 드롭 · 붙여넣기(Ctrl/⌘+V)
          </span>
        </div>
      </div>

      {isBusy && (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <div className="flex justify-between text-[0.7rem] text-text-muted font-semibold">
            <span>{progress.label}</span>
            <span>{Math.round(progress.value * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-blue transition-all duration-300"
              style={{ width: `${Math.max(4, progress.value * 100)}%` }}
            />
          </div>
        </div>
      )}

      {phase === 'error' && errorText && (
        <div
          role="alert"
          className="p-3 px-3.5 rounded-lg text-xs font-semibold bg-bar-red/10 border border-bar-red/20 text-bar-red"
        >
          {errorText}
        </div>
      )}

      {ratioWarning && phase !== 'error' && (
        <div className="p-3 px-3.5 rounded-lg text-xs font-semibold bg-bar-yellow/10 border border-bar-yellow/25 text-bar-yellow">
          ⚠️ 화면 비율이 기준과 달라 이름·CP·HP 인식이 부정확할 수 있습니다.
          결과를 꼭 확인해 주세요.
        </div>
      )}

      {phase === 'done' && summary && (
        <div
          aria-live="polite"
          className="p-3 px-3.5 rounded-lg text-xs bg-accent-green/8 border border-accent-green/20 flex flex-col gap-2"
        >
          <span className="font-bold text-accent-green">
            ✓ 스캔 완료 — 아래 값이 맞는지 확인해 주세요
          </span>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-text-main">
            <span className="text-text-muted">IV</span>
            <span className="font-bold">
              {summary.ivs.atk} / {summary.ivs.def} / {summary.ivs.hp}
            </span>
            {!summary.ocrFailed && (
              <>
                <span className="text-text-muted">포켓몬</span>
                {summary.matchedNameKo ? (
                  <span className="font-bold">{summary.matchedNameKo}</span>
                ) : (
                  <span className="font-bold text-bar-yellow">
                    인식 실패{summary.ocrText ? ` ("${summary.ocrText}")` : ''}{' '}
                    — 위 검색창에서 직접 선택해 주세요
                  </span>
                )}
                <span className="text-text-muted">CP</span>
                <span className={summary.cp ? 'font-bold' : 'text-bar-yellow'}>
                  {summary.cp ?? '인식 실패'}
                </span>
                <span className="text-text-muted">HP</span>
                <span className={summary.hp ? 'font-bold' : 'text-bar-yellow'}>
                  {summary.hp ?? '인식 실패'}
                </span>
              </>
            )}
          </div>
          {summary.ocrFailed && (
            <span className="text-bar-yellow font-semibold">
              이름·CP·HP 인식에 실패했습니다. IV만 적용되었으니 나머지는 직접
              입력해 주세요.
            </span>
          )}
          <span className="text-[0.7rem] text-text-muted">
            틀린 값은 IV 슬라이더나 아래 CP/HP 입력란에서 수정할 수 있습니다.
          </span>
        </div>
      )}

      <div className="mt-1" style={{ display: hasPreview ? 'block' : 'none' }}>
        <span className="text-[0.8rem] text-text-muted block mb-1.5">
          스캔 미리보기 (초록 선: 인식된 IV 막대)
        </span>
        <canvas
          ref={canvasRef}
          className="w-full max-h-[400px] object-contain rounded-lg border border-border-light bg-black"
        />
      </div>
    </div>
  )
}
