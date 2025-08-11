import { createJsonExamContent } from '../src/test-data/json-exam'
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import defaultJsonExam from './resources/json-exam-default.json'
import complexJsonExam from './resources/json-exam-complex.json'

describe('createJsonExamContent', () => {
  test('generates json with default content', () => {
    const content = createJsonExamContent()
    assert.deepEqual(content, defaultJsonExam)
  })

  test('generates json with all content', () => {
    const complexConfig = {
      title: 'Monimutkainen generoitu otsikko',
      instruction: 'Monimutkaiset ohjeet tulisivat tähän',
      textQuestionCount: 2,
      subTextQuestionCount: 2,
      productiveTextQuestionCount: 2,
      productiveSubTextQuestionCount: 2,
      multichoiceQuestionCount: 2,
      multichoiceGapQuestionCount: 2,
      attachmentTextQuestionCount: 2,
      productiveAttachmentTextQuestionCount: 2,
      restrictedMediaTextQuestionCount: 2,
      transposeQuestions: false,
      customPoints: false,
      sectionCount: 2,
      casForbiddenSectionIndexes: [0]
    }

    const content = createJsonExamContent(complexConfig)
    assert.deepEqual(content, complexJsonExam)
  })
})
