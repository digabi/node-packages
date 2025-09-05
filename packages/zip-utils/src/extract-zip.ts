import * as fs from 'node:fs'
import * as path from 'node:path'
import { Readable } from 'node:stream'
import * as yauzl from 'yauzl'
import { DataError } from '@digabi/express-utils'

export type ExtractedZip = { [key: string]: ZipEntry }
export type ZipEntry = {
  open: () => Promise<Readable>
  readIntoBuffer: () => Promise<Buffer>
}

export type ExtractedZipWithMetadata = {
  [key: string]: ZipEntryWithMetadata
}
export type ZipEntryWithMetadata = ZipEntry & {
  uncompressedSize: number
  crc32: number
  mtime: Date
}

export const extractZip = (data: Buffer, maxEntrySize?: number) =>
  _extractZip({ data, maxEntrySize, includeMetaData: false }) as Promise<ExtractedZip>

export const extractZipWithMetadata = (data: Buffer, maxEntrySize?: number) =>
  _extractZip({ data, maxEntrySize, includeMetaData: true }) as Promise<ExtractedZipWithMetadata>

function _extractZip({
  data,
  maxEntrySize,
  includeMetaData
}: {
  data: Buffer
  maxEntrySize?: number
  includeMetaData: boolean
}): Promise<ExtractedZip | ExtractedZipWithMetadata> {
  return new Promise((resolve, reject) => {
    const entries: ExtractedZip | ExtractedZipWithMetadata = {}
    let entriesDone = 0

    yauzl.fromBuffer(data, { lazyEntries: true }, (err, zipFile) => {
      if (err) {
        return reject(new DataError(err.message))
      }
      if (zipFile.entryCount === 0) {
        return resolve(entries)
      }

      zipFile.readEntry()
      zipFile.on('entry', handleEntry)
      zipFile.on('error', (err: Error) => reject(new DataError(err.message)))

      function handleEntry(entry: yauzl.Entry) {
        if (maxEntrySize && entry.uncompressedSize > maxEntrySize) {
          return reject(new DataError(`Zip entry too large: ${entry.uncompressedSize} max allowed: ${maxEntrySize}`))
        }

        const contents: ZipEntry = zipEntryContents(zipFile, entry)
        entries[entry.fileName] = includeMetaData
          ? {
              uncompressedSize: entry.uncompressedSize,
              crc32: entry.crc32,
              mtime: entry.getLastModDate(),
              ...contents
            }
          : contents

        entriesDone++
        if (entriesDone === zipFile.entryCount) {
          return resolve(entries)
        }
        zipFile.readEntry()
      }
    })
  })
}

function zipEntryContents(zip: yauzl.ZipFile, entry: yauzl.Entry): ZipEntry {
  return {
    open() {
      return new Promise<Readable>((resolve, reject) => {
        zip.openReadStream(entry, (err, stream) => {
          if (err) {
            return reject(new DataError(err.message))
          }
          resolve(stream)
        })
      })
    },
    readIntoBuffer() {
      return new Promise<Buffer>((resolve, reject) => {
        zip.openReadStream(entry, (err, stream) => {
          if (err) {
            return reject(new DataError(err.message))
          }
          const chunks: Buffer[] = []
          stream.on('error', err => reject(new DataError(err.message)))
          stream.on('data', (chunk: Buffer) => chunks.push(chunk))
          stream.on('end', () => resolve(Buffer.concat(chunks)))
        })
      })
    }
  }
}

export function extractZipFromDisk(
  zipFilePath: string,
  targetPath: string,
  filterFunc?: (entry: yauzl.Entry) => boolean
): Promise<string[]> {
  const filter = filterFunc ? filterFunc : () => true
  const fileNames: string[] = []

  return new Promise((resolve, reject) => {
    yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipFile) => {
      if (err) {
        return reject(new DataError(err.message))
      }

      zipFile.readEntry()
      zipFile.on('entry', handleEntry)
      zipFile.on('error', err => {
        zipFile.close()
        return reject(new DataError(err as string))
      })
      zipFile.on('end', () => resolve(fileNames))

      function handleEntry(entry: yauzl.Entry) {
        if (filter(entry)) {
          if (/\/$/.test(entry.fileName)) {
            // eslint-disable-next-line promise/no-promise-in-callback
            fs.promises
              .mkdir(path.join(targetPath, entry.fileName), { recursive: true })
              .then(() => zipFile.readEntry())
              .catch(err => reject(new DataError(err as string)))
          } else {
            fileNames.push(entry.fileName)

            zipFile.openReadStream(entry, (err, readStream) => {
              if (err) {
                return reject(new DataError(err.message))
              }

              // eslint-disable-next-line promise/no-promise-in-callback
              fs.promises
                .mkdir(path.join(targetPath, path.dirname(entry.fileName)), { recursive: true })
                .then(() => {
                  const entryFilePath = path.join(targetPath, entry.fileName)
                  const out = fs.createWriteStream(entryFilePath)
                  out.on('finish', () => {
                    const mtime = entry.getLastModDate()
                    fs.utimesSync(entryFilePath, mtime, mtime)
                    return zipFile.readEntry()
                  })
                  readStream.pipe(out)
                  return
                })
                .catch(err => reject(new DataError(err as string)))
            })
          }
        } else {
          zipFile.readEntry()
        }
      }
    })
  })
}

export async function extractZipToDisk(zipBuffer: Buffer, targetPath: string, maxEntrySize?: number) {
  const zipObject = await extractZip(zipBuffer, maxEntrySize)
  const entries = Object.entries(zipObject).map(([name, content]) => ({ content, name }))

  if (entries.length > 0) {
    await fs.promises.mkdir(targetPath, { recursive: true })

    await Promise.all(
      entries.map(async entry => {
        const isDir = entry.name.endsWith('/')
        const entryPath = isDir ? entry.name : path.dirname(entry.name)

        await fs.promises.mkdir(path.join(targetPath, entryPath), { recursive: true })
        const fullPath = path.join(targetPath, entry.name)

        if (!isDir) {
          await fs.promises.writeFile(fullPath, await entry.content.open())
        }
      })
    )
  }
}
