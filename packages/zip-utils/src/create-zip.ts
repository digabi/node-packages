import * as yazl from 'yazl'

const MAX_ZIP_NAME_LENGTH = 72

type FilenameAndContent = {
  content?: Buffer
  contentStream?: NodeJS.ReadableStream
  name: string
  options?: {
    mtime?: Date
    mode?: number
    compress?: boolean
    forceZip64Format?: boolean
    fileComment?: string
  }
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

export function createZip(filenamesAndContents: FilenameAndContent[]): Promise<Buffer> {
  filenamesAndContents.forEach(nameAndContent => {
    if (nameAndContent.content && !Buffer.isBuffer(nameAndContent.content)) {
      throw new Error(`Content of ${nameAndContent.name} is not a buffer`)
    }
  })

  const zip = new yazl.ZipFile()
  filenamesAndContents.forEach(nameAndContent => {
    if (nameAndContent.content) {
      zip.addBuffer(nameAndContent.content, nameAndContent.name, nameAndContent.options)
    } else if (nameAndContent.contentStream) {
      zip.addReadStream(nameAndContent.contentStream, nameAndContent.name, nameAndContent.options)
    } else {
      throw new Error(`No content buffer or stream for: ${nameAndContent.name}`)
    }
  })
  zip.end()

  return streamToBuffer(zip.outputStream)
}

export function createZipName(prefix: string, name: string, suffix?: string) {
  const suff = suffix || 'meb'
  return `${`${prefix}_${name}`.replace(/[^a-zA-Z0-9.-]+/g, '_').substring(0, MAX_ZIP_NAME_LENGTH)}.${suff}`
}
