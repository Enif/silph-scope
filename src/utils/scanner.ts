export interface ScanResult {
  atk: number
  def: number
  hp: number
  success: boolean
  message: string
  // Bounding boxes for visual debugging overlay
  debugInfo?: {
    barXStart: number
    barXEnd: number
    barYCoords: number[]
  }
}

// Convert RGB to HSL for easier color-range matching
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

// Check if a pixel color matches the filled IV bar color (red/orange/yellow)
function isFilledBarColor(h: number, s: number, l: number): boolean {
  // Orange/Red/Yellow ranges
  const isRedOrangeYellow = h >= 340 || h <= 55
  const hasGoodSaturation = s >= 35
  const hasGoodLightness = l >= 30 && l <= 85
  return isRedOrangeYellow && hasGoodSaturation && hasGoodLightness
}

// Check if a pixel color matches the empty IV bar background (light gray)
function isEmptyBarColor(s: number, l: number): boolean {
  // Light gray background of the empty bar
  const isGray = s <= 15
  const isLight = l >= 65 && l <= 95
  return isGray && isLight
}

// Scan the canvas for Pokémon GO appraisal bars
export function scanAppraisalScreenshot(canvas: HTMLCanvasElement): ScanResult {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return {
      success: false,
      atk: 0,
      def: 0,
      hp: 0,
      message: 'Could not get 2D context',
    }
  }

  const width = canvas.width
  const height = canvas.height

  // Get image pixels for the lower half (where the appraisal card is)
  const startY = Math.floor(height * 0.5)
  const scanHeight = Math.floor(height * 0.45) // scan from 50% to 95% of height
  const imageData = ctx.getImageData(0, startY, width, scanHeight)
  const data = imageData.data

  // Store information about rows that look like part of a bar
  // We want to find horizontal rows that contain a long stretch of filled/empty bar pixels
  const candidateRows: {
    yOffset: number
    startX: number
    endX: number
    len: number
  }[] = []

  const maxGap = Math.max(10, Math.ceil(width * 0.025))

  for (let y = 0; y < scanHeight; y += 2) {
    // step by 2 pixels for performance
    let inBar = false
    let longestRun = 0
    let longestStart = 0
    let longestEnd = 0
    let currentRun = 0
    let currentStart = 0
    let gapCount = 0

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      const { h, s, l } = rgbToHsl(r, g, b)

      const isBarPixel = isFilledBarColor(h, s, l) || isEmptyBarColor(s, l)

      if (isBarPixel) {
        if (!inBar) {
          inBar = true
          currentStart = x
        }
        currentRun += gapCount + 1
        gapCount = 0
      } else {
        if (inBar) {
          gapCount++
          if (gapCount > maxGap) {
            inBar = false
            if (currentRun > longestRun) {
              longestRun = currentRun
              longestStart = currentStart
              longestEnd = x - gapCount
            }
            currentRun = 0
            gapCount = 0
          }
        }
      }
    }

    if (inBar) {
      if (currentRun > longestRun) {
        longestRun = currentRun
        longestStart = currentStart
        longestEnd = width - 1 - gapCount
      }
    }

    // A bar is expected to be a substantial fraction of the width (e.g. 25% to 80%)
    const minBarWidth = width * 0.25
    const maxBarWidth = width * 0.8

    if (longestRun >= minBarWidth && longestRun <= maxBarWidth) {
      candidateRows.push({
        yOffset: y,
        startX: longestStart,
        endX: longestEnd,
        len: longestRun,
      })
    }
  }

  if (candidateRows.length === 0) {
    return {
      success: false,
      atk: 0,
      def: 0,
      hp: 0,
      message:
        'Could not find any appraisal bar candidates. Is this a Pokémon GO appraisal screenshot?',
    }
  }

  // Group candidate rows into clusters (since a single bar is several pixels tall)
  const clusters: {
    rows: typeof candidateRows
    avgYOffset: number
    avgStartX: number
    avgEndX: number
  }[] = []
  let currentCluster: typeof candidateRows = []

  for (let i = 0; i < candidateRows.length; i++) {
    const row = candidateRows[i]
    if (currentCluster.length === 0) {
      currentCluster.push(row)
    } else {
      const prevRow = currentCluster[currentCluster.length - 1]
      // If rows are vertically contiguous (within 5 pixels), group them
      if (row.yOffset - prevRow.yOffset <= 6) {
        currentCluster.push(row)
      } else {
        // End cluster
        clusters.push(createCluster(currentCluster))
        currentCluster = [row]
      }
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(createCluster(currentCluster))
  }

  function createCluster(rows: typeof candidateRows) {
    const sumY = rows.reduce((sum, r) => sum + r.yOffset, 0)
    const sumStart = rows.reduce((sum, r) => sum + r.startX, 0)
    const sumEnd = rows.reduce((sum, r) => sum + r.endX, 0)
    return {
      rows,
      avgYOffset: Math.round(sumY / rows.length),
      avgStartX: Math.round(sumStart / rows.length),
      avgEndX: Math.round(sumEnd / rows.length),
    }
  }

  // We expect exactly 3 clusters (Attack, Defense, HP)
  // Let's filter out clusters that have too few rows (noise) and sort them by Y coordinate (top to bottom)
  const validClusters = clusters
    .filter((c) => c.rows.length >= 3) // Need at least 3 rows to be a solid bar
    .sort((a, b) => a.avgYOffset - b.avgYOffset)

  if (validClusters.length < 3) {
    return {
      success: false,
      atk: 0,
      def: 0,
      hp: 0,
      message: `Detected only ${validClusters.length} bars instead of 3. Please try manually inputting or uploading a clearer screenshot.`,
    }
  }

  // If there are more than 3 clusters, find the 3 that are most evenly spaced and have similar widths
  let bestClusterTriple = validClusters.slice(0, 3)
  if (validClusters.length > 3) {
    // Try to find a consecutive triple that matches typical spacing
    let bestScore = Infinity
    for (let i = 0; i <= validClusters.length - 3; i++) {
      const triple = validClusters.slice(i, i + 3)
      const gap1 = triple[1].avgYOffset - triple[0].avgYOffset
      const gap2 = triple[2].avgYOffset - triple[1].avgYOffset
      // Spacing should be relatively even (e.g. gaps should be similar)
      const spacingDiff = Math.abs(gap1 - gap2)
      // Widths should be similar
      const w0 = triple[0].avgEndX - triple[0].avgStartX
      const w1 = triple[1].avgEndX - triple[1].avgStartX
      const w2 = triple[2].avgEndX - triple[2].avgStartX
      const widthVariance =
        Math.abs(w0 - w1) + Math.abs(w1 - w2) + Math.abs(w0 - w2)

      const score = spacingDiff + widthVariance * 0.5
      if (score < bestScore) {
        bestScore = score
        bestClusterTriple = triple
      }
    }
  }

  // The 3 clusters correspond to: Attack, Defense, HP
  const [atkCluster, defCluster, hpCluster] = bestClusterTriple

  // Determine the bounding horizontal limits (average of the three bars)
  const barXStart = Math.round(
    (atkCluster.avgStartX + defCluster.avgStartX + hpCluster.avgStartX) / 3,
  )
  const barXEnd = Math.round(
    (atkCluster.avgEndX + defCluster.avgEndX + hpCluster.avgEndX) / 3,
  )
  const barWidth = barXEnd - barXStart

  // Calculate IVs
  const ivs = [atkCluster, defCluster, hpCluster].map((cluster) => {
    const y = cluster.avgYOffset
    let filledCount = 0

    // Sample pixels along this bar's Y offset
    for (let x = barXStart; x <= barXEnd; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const { h, s, l } = rgbToHsl(r, g, b)

      if (isFilledBarColor(h, s, l)) {
        filledCount++
      }
    }

    const ratio = filledCount / barWidth
    // In Pokémon GO, IVs are integers from 0 to 15.
    // The bar is divided into three sections of 5.
    // The mapping is highly linear.
    let iv = Math.round(ratio * 15)

    // Boundaries correction for common values
    // Sometimes red is detected slightly short due to the grey border or vertical segment dividers.
    // Let's adjust slightly:
    if (ratio > 0.96) iv = 15
    if (ratio < 0.04) iv = 0

    return Math.max(0, Math.min(15, iv))
  })

  // Absolute Y coordinates on the canvas
  const barYCoords = [
    startY + atkCluster.avgYOffset,
    startY + defCluster.avgYOffset,
    startY + hpCluster.avgYOffset,
  ]

  return {
    success: true,
    atk: ivs[0],
    def: ivs[1],
    hp: ivs[2],
    message: 'Appraisal bars successfully scanned!',
    debugInfo: {
      barXStart,
      barXEnd,
      barYCoords,
    },
  }
}
