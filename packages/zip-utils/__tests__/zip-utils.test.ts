import { test, describe, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import * as fs from 'fs'
import { readFile as readFileAsync } from 'fs/promises'
import crc32 from 'buffer-crc32'
import {
  extractFilesMatching,
  extractZip,
  extractZipFromDisk,
  extractZipMetadataOnly,
  extractZipToDisk,
  extractZipWithMetadata,
  createZip,
  createZipName
} from '../src'

const indexName = 'index.html'
const indexContent = Buffer.from('<!doctype html><title>Sample html file</title>', 'utf-8')

const otherName = 'another-file.txt'
const otherContent = Buffer.from('hello world!', 'utf-8')

function doCreateZip() {
  return createZip([
    {
      name: indexName,
      content: indexContent
    },
    {
      name: otherName,
      content: otherContent
    }
  ])
}

function assertFile(path: string, size: number) {
  const stat = fs.statSync(path)
  assert.equal(stat.isFile(), true)
  assert.equal(stat.size, size, `File size for ${path} is not ${size}`)
}

function assertDir(path: string) {
  assert.equal(fs.statSync(path).isDirectory(), true)
}

describe('zip-test.js', () => {
  test('zips and unzips files', async () => {
    const zipBuffer = await doCreateZip()
    const extracted = await extractZip(zipBuffer)

    assert.deepEqual(extracted[indexName], indexContent)
    assert.deepEqual(extracted[otherName], otherContent)
  })

  test('extracts metadata from zip', async () => {
    const zipBuffer = await doCreateZip()
    const extracted = await extractZipWithMetadata(zipBuffer)

    assert.equal(extracted[indexName].uncompressedSize, indexContent.length)
    assert.equal(extracted[indexName].crc32, crc32.unsigned(indexContent))
    assert.equal(extracted[otherName].uncompressedSize, otherContent.length)
    assert.equal(extracted[otherName].crc32, crc32.unsigned(otherContent))
    assert.deepEqual(extracted[indexName].contents, indexContent)
    assert.deepEqual(extracted[otherName].contents, otherContent)
  })

  test('extracts only metadata from zip', async () => {
    const zipBuffer = await doCreateZip()
    const extracted = await extractZipMetadataOnly(zipBuffer)

    assert.equal(extracted[indexName].uncompressedSize, indexContent.length)
    assert.equal(extracted[indexName].crc32, crc32.unsigned(indexContent))
    assert.equal(extracted[otherName].uncompressedSize, otherContent.length)
    assert.equal(extracted[otherName].crc32, crc32.unsigned(otherContent))
    assert.equal(extracted[indexName].contents.toString('utf-8'), '')
    assert.equal(extracted[otherName].contents.toString('utf-8'), '')
  })

  test('extracts only requested file', async () => {
    const zipBuffer = await doCreateZip()
    const extracted = await extractFilesMatching(zipBuffer, '^index.*')

    assert.equal(extracted[indexName].uncompressedSize, indexContent.length)
    assert.equal(extracted[indexName].crc32, crc32.unsigned(indexContent))
    assert.equal(extracted[otherName].uncompressedSize, otherContent.length)
    assert.equal(extracted[otherName].crc32, crc32.unsigned(otherContent))
    assert.deepEqual(extracted[indexName].contents, indexContent)
    assert.equal(extracted[otherName].contents.toString('utf-8'), '')
  })

  test("throws if passed strings as content because they end up creating zip files with errors in uncompressedSize's", () =>
    assert.throws(
      //@ts-expect-error testing invalid parameter
      () => createZip([{ name: 'not-a-buffer.txt', content: 'just some string' }]),
      /Error: Content of not-a-buffer.txt is not a buffer/
    ))

  test('unzips empty file', async () => {
    const zipBuffer = await createZip([])
    const extracted = await extractZip(zipBuffer)

    assert.equal(Object.keys(extracted).length, 0)
  })

  test('zip suffix is med by default', () => {
    assert.equal('exported_mathexam.meb', createZipName('exported', 'mathexam'))
  })

  test('zip suffix can be changed', () => {
    assert.equal('exported_mathexam.zip', createZipName('exported', 'mathexam', 'zip'))
  })

  describe('extracts zip correctly', () => {
    const targetPath = `${__dirname}/temp`

    afterEach(async () => {
      await fs.promises.rm(targetPath, { recursive: true, force: true })
    })

    test('from file including empty dirs and files', async () => {
      await extractZipFromDisk(`${__dirname}/test.zip`, targetPath)
      assertExtractedZip()
    })

    test('from buffer including empty dirs and files', async () => {
      const zipBuffer = await readFileAsync(`${__dirname}/test.zip`)
      await extractZipToDisk(zipBuffer, targetPath)

      assertExtractedZip()
    })

    function assertExtractedZip() {
      assertFile(`${targetPath}/hello.txt`, 12)
      assertFile(`${targetPath}/.empty_file`, 0)
      assertDir(`${targetPath}/folder1`)
      assertFile(`${targetPath}/folder1/hello.txt`, 12)
      assertFile(`${targetPath}/folder1/.empty_file`, 0)
      assertDir(`${targetPath}/folder1/empty_folder`)
      assertDir(`${targetPath}/folder1/folder2`)
      assertFile(`${targetPath}/folder1/folder2/hello.txt`, 12)
      assertFile(`${targetPath}/folder1/folder2/.empty_file`, 0)
    }
  })
})
