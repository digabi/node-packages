function getRandomInt(intMin: number, intMax: number) {
  const min = Math.ceil(intMin)
  const max = Math.floor(intMax)
  // The maximum is exclusive and the minimum is inclusive
  return Math.floor(Math.random() * (max - min)) + min
}

function doCreateRandomHetu() {
  const pad = (integer: number, width: number) => (Array(width + 1).join('0') + integer).slice(-width)
  const randomInt = getRandomInt
  const checkCodes: Record<number, string> = {
    0: '0',
    1: '1',
    2: '2',
    3: '3',
    4: '4',
    5: '5',
    6: '6',
    7: '7',
    8: '8',
    9: '9',
    10: 'A',
    11: 'B',
    12: 'C',
    13: 'D',
    14: 'E',
    15: 'F',
    16: 'H',
    17: 'J',
    18: 'K',
    19: 'L',
    20: 'M',
    21: 'N',
    22: 'P',
    23: 'R',
    24: 'S',
    25: 'T',
    26: 'U',
    27: 'V',
    28: 'W',
    29: 'X',
    30: 'Y'
  }

  const year = randomInt(0, 100)
  const date = pad(randomInt(1, 32), 2) + pad(randomInt(1, 13), 2) + pad(year, 2)
  const currentYear = Number(new Date().getFullYear().toString().slice(-2))

  const separator = year < currentYear ? 'A' : '-'
  const uniq = pad(randomInt(2, 900), 3)
  const checkCode = parseInt(date.concat(uniq), 10) % 31
  return date + separator + uniq + checkCodes[checkCode]
}

const alreadyGeneratedHetus: Record<string, boolean> = {}

export function createRandomHetu() {
  const candidateHetu = doCreateRandomHetu()

  if (!alreadyGeneratedHetus[candidateHetu]) {
    alreadyGeneratedHetus[candidateHetu] = true
    return candidateHetu
  }

  return createRandomHetu()
}
