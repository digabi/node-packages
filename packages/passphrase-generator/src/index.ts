import * as util from 'util'
import * as crypto from 'crypto'

export function generatePassphraseAsync(wordList: string[], numWords = 4) {
  const filteredWordList = filterWordList(wordList)
  return buildPassphrase(filteredWordList, numWords)
}

function filterWordList(wordList: string[]) {
  return wordList.filter(w => w.length <= 8 && w.length >= 5)
}

async function buildPassphrase(wordList: string[], numWords: number) {
  const passphrase = []
  for (let i = 0; i < numWords; i++) {
    passphrase.push(await getCryptoRandomElement(wordList))
  }
  return passphrase.join(' ')
}

async function getCryptoRandomElement<T>(array: T[]): Promise<T | undefined> {
  const getRandomInt: (max: number) => Promise<number> = util.promisify(crypto.randomInt)
  try {
    const cryptoRandomInt = await getRandomInt(array.length)
    return array[cryptoRandomInt]
  } catch (error) {
    console.error('Failed to get random int with crypto module', error)
  }
}
