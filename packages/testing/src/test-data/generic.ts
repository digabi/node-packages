export function randomString(length?: number): string {
  const usedLength = length || 12
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let text = ''

  for (let i = 0; i < usedLength; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

export function createRandomOid() {
  function createRandomOidDigit() {
    return Math.floor(Math.random() * 256)
  }

  return `${createRandomOidDigit()}.${createRandomOidDigit()}.${createRandomOidDigit()}.${createRandomOidDigit()}`
}
