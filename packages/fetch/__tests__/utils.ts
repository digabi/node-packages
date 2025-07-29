import fs from 'fs'
import path from 'path'

export function loadSomeFileToBuffer() {
  const filename = 'image.png'
  const filePath = `./${filename}`

  return {
    buffer: fs.readFileSync(path.join(__dirname, filePath)),
    filename
  }
}
