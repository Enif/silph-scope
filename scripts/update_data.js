import fs from 'fs'
import path from 'path'

const CPM_URL = 'https://raw.githubusercontent.com/Mygod/ohbem/master/cpm.json'
const POKEMON_URL =
  'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster.json'
const TRANSLATION_KO_URL =
  'https://raw.githubusercontent.com/sindresorhus/pokemon/main/data/ko.json'
const TRANSLATION_EN_URL =
  'https://raw.githubusercontent.com/sindresorhus/pokemon/main/data/en.json'

const DATA_DIR = path.resolve('src/data')

// Ensure target data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

async function updateCpm() {
  console.log('1/3: Fetching CPM multipliers...')
  const res = await fetch(CPM_URL)
  if (!res.ok) throw new Error(`CPM fetch failed: ${res.status}`)
  const data = await res.json()

  let cpmList = []
  if (Array.isArray(data)) {
    cpmList = data
  } else if (typeof data === 'object') {
    const sortedKeys = Object.keys(data).sort((a, b) => Number(a) - Number(b))
    cpmList = sortedKeys.map((k) => data[k])
  } else {
    throw new Error('Unexpected CPM data format')
  }

  const outputPath = path.join(DATA_DIR, 'cpm.json')
  fs.writeFileSync(outputPath, JSON.stringify(cpmList, null, 2))
  console.log(
    `✓ CPM multipliers saved to ${outputPath} (${cpmList.length} levels)`,
  )
}

async function updatePokemonData() {
  console.log('2/3: Fetching Pokémon stats & family data...')
  const res = await fetch(POKEMON_URL)
  if (!res.ok) throw new Error(`Pokémon data fetch failed: ${res.status}`)
  const data = await res.json()

  if (!data.pokemon || !Array.isArray(data.pokemon)) {
    throw new Error('Invalid GameMaster format')
  }

  const cleanedPokemon = data.pokemon.map((p) => {
    const atk = p.baseStats?.atk || 0
    const def = p.baseStats?.def || 0
    const hp = p.baseStats?.hp || 0
    return {
      speciesId: p.speciesId,
      speciesName: p.speciesName,
      atk,
      def,
      hp,
      types: p.types || [],
      family: p.family || null,
    }
  })

  const outputPath = path.join(DATA_DIR, 'pokemon.json')
  fs.writeFileSync(outputPath, JSON.stringify(cleanedPokemon, null, 2))
  console.log(
    `✓ Pokémon base stats saved to ${outputPath} (${cleanedPokemon.length} entries)`,
  )
}

async function updateTranslations() {
  console.log('3/3: Fetching Pokémon name translations...')
  const [koRes, enRes] = await Promise.all([
    fetch(TRANSLATION_KO_URL),
    fetch(TRANSLATION_EN_URL),
  ])

  if (!koRes.ok || !enRes.ok) {
    throw new Error(
      `Translation fetch failed: ko=${koRes.status}, en=${enRes.status}`,
    )
  }

  const koData = await koRes.json()
  const enData = await enRes.json()

  const translationMap = {}
  const length = Math.min(enData.length, koData.length)
  for (let i = 0; i < length; i++) {
    translationMap[enData[i].toLowerCase()] = koData[i]
  }

  const suffixMap = {
    shadow: '그림자',
    purified: '정화',
    alolan: '알로라',
    alola: '알로라',
    galarian: '가라르',
    galar: '가라르',
    hisuian: '히스이',
    hisui: '히스이',
    paldean: '팔데아',
    paldea: '팔데아',
    origin: '오리진',
    altered: '어나더',
    defense: '디펜스',
    attack: '어택',
    speed: '스피드',
    therian: '영물',
    incarnate: '화신',
    pirouette: '스텝',
    aria: '보이스',
    sunny: '태양',
    rainy: '빗방울',
    snowy: '설운',
    normal: '노멀',
    plant: '초목',
    sandy: '모래땅',
    trash: '쓰레기',
    sunshine: '포지티브',
    overcast: '네거티브',
    female: '암컷',
    male: '수컷',
    armored: '아머드',
    black: '블랙',
    white: '화이트',
    dusk: '황혼의 갈기',
    dawn: '새벽의 날개',
    ultra: '울트라',
  }

  const result = {
    base: translationMap,
    suffixes: suffixMap,
  }

  const outputPath = path.join(DATA_DIR, 'pokemon_ko.json')
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2))
  console.log(`✓ Translations saved to ${outputPath}`)
}

async function run() {
  try {
    console.log('🔄 Starting data sync update...')
    await updateCpm()
    await updatePokemonData()
    await updateTranslations()
    console.log('✨ Data sync completed successfully!')
  } catch (error) {
    console.error('❌ Data update failed:', error)
    process.exit(1)
  }
}

run()
