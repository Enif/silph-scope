import fs from 'fs'
import path from 'path'

const url = 'https://raw.githubusercontent.com/Mygod/ohbem/master/cpm.json'
const outputPath = path.resolve('src/data/cpm.json')

async function run() {
  try {
    console.log('Fetching CPM data from Mygod/ohbem...')
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
    const data = await res.json()

    // The data could be a key-value object (e.g. { "1": 0.094, "1.5": 0.1351... }) or an array
    console.log('Successfully fetched CPM data. Processing...')

    let cpmList = []
    if (Array.isArray(data)) {
      cpmList = data
    } else if (typeof data === 'object') {
      // Sort keys numerically to ensure order (1, 1.5, 2, 2.5...)
      const sortedKeys = Object.keys(data).sort((a, b) => Number(a) - Number(b))
      cpmList = sortedKeys.map(k => data[k])
    } else {
      throw new Error('Unexpected CPM data format')
    }

    console.log(`Extracted ${cpmList.length} CPM values. (Level 1 to Level ${(cpmList.length + 1) / 2})`)

    // Ensure output directory exists
    const dir = path.dirname(outputPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    fs.writeFileSync(outputPath, JSON.stringify(cpmList, null, 2))
    console.log(`Saved CPM list to ${outputPath}`)
  } catch (error) {
    console.error('Error processing CPM data:', error)
    process.exit(1)
  }
}

run()
