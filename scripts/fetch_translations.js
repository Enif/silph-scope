import fs from 'fs'
import path from 'path'

const koUrl = 'https://raw.githubusercontent.com/sindresorhus/pokemon/main/data/ko.json'
const enUrl = 'https://raw.githubusercontent.com/sindresorhus/pokemon/main/data/en.json'
const outputPath = path.resolve('src/data/pokemon_ko.json')

async function run() {
  try {
    console.log('Fetching English names...')
    const enRes = await fetch(enUrl)
    const enData = await enRes.json()

    console.log('Fetching Korean names...')
    const koRes = await fetch(koUrl)
    const koData = await koRes.json()

    console.log('Processing translation map...')
    const translationMap = {}

    // Map English name to Korean name (1-to-1 based on index)
    const length = Math.min(enData.length, koData.length)
    for (let i = 0; i < length; i++) {
      const enName = enData[i]
      const koName = koData[i]
      translationMap[enName.toLowerCase()] = koName
    }

    // Add manual translations for common forms and suffixes
    const suffixMap = {
      'shadow': '그림자',
      'purified': '정화',
      'alolan': '알로라',
      'alola': '알로라',
      'galarian': '가라르',
      'galar': '가라르',
      'hisuian': '히스이',
      'hisui': '히스이',
      'paldean': '팔데아',
      'paldea': '팔데아',
      'origin': '오리진',
      'altered': '어나더',
      'defense': '디펜스',
      'attack': '어택',
      'speed': '스피드',
      'therian': '영물',
      'incarnate': '화신',
      'pirouette': '스텝',
      'aria': '보이스',
      'sunny': '태양',
      'rainy': '빗방울',
      'snowy': '설운',
      'normal': '노멀',
      'plant': '초목',
      'sandy': '모래땅',
      'trash': '쓰레기',
      'sunshine': '포지티브',
      'overcast': '네거티브',
      'female': '암컷',
      'male': '수컷',
      'armored': '아머드',
      'black': '블랙',
      'white': '화이트',
      'dusk': '황혼의 갈기',
      'dawn': '새벽의 날개',
      'ultra': '울트라',
    }

    const result = {
      base: translationMap,
      suffixes: suffixMap
    }

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
    console.log(`Saved translation map to ${outputPath}`)
  } catch (error) {
    console.error('Error fetching translations:', error)
    process.exit(1)
  }
}

run()
