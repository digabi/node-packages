import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import autogradingWithChoiceGroupWithIndividualScores from './resources/autograding-choice-group-individual-scores'
import autogradingWithChoiceGroupWithMaxScore from './resources/autograding-choice-group-max-score'
import invalidAutograding from './resources/autograding-choice-group-individual-scores-invalid'
import autogradingWithMultiChoiceGapGroup from './resources/autograding-multi-choice-grap-group'
import productiveAutogradingPerfectExample from './resources/productive-autograding-perfect-example'
import { validateAutograding, validateProductiveAutograding } from '../src/autograding/autograding-validator'

const productiveAutogradingTrimFaulty = (faultyText: string) => [
  {
    examUuid: 'db0e1d96-783f-4b3d-915e-acacb8ba52dd',
    questions: [
      {
        id: 21,
        correctAnswers: [
          { score: 30701, text: faultyText },
          { score: 30702, text: 'false' },
          { score: 30703, text: 'false' }
        ]
      }
    ]
  }
]

const prodAutogradingTrimFaultyError = [
  { questions: [{ correctAnswers: [{ text: 'Correct answers must be trimmed' }, null, null] }] }
]

const productiveAutogradingMissingId = [
  {
    examUuid: 'db0e1d96-783f-4b3d-915e-acacb8ba52dd',
    questions: [
      {
        correctAnswers: [
          { score: 30701, text: 'true' },
          { score: 30702, text: 'false' },
          { score: 30703, text: 'false' }
        ]
      }
    ]
  }
]

const prodAutogradingMissingIdError = [{ questions: [{ id: 'Question ID must be a positive integer' }] }]

describe('autograding-validator-test.js', () => {
  test('validates autograding of choice group with individual scores', () => {
    assert.equal(validateAutograding(autogradingWithChoiceGroupWithIndividualScores), undefined)
  })

  test('validates autograding of choice group with max score', () => {
    assert.equal(validateAutograding(autogradingWithChoiceGroupWithMaxScore), undefined)
  })

  test('fails validation on invalid autograding', () => {
    const result = validateAutograding(invalidAutograding)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    assert.equal((result as any)[0].choices[0].options[0].score, 'Score must be a positive integer')
  })

  test('validates autograding of multi choice gap group', () => {
    assert.equal(validateAutograding(autogradingWithMultiChoiceGapGroup), undefined)
  })

  test('validates productive autograding', () => {
    assert.equal(validateProductiveAutograding(productiveAutogradingPerfectExample), undefined)
  })

  test('prod. AG fails with trim failure', () => {
    assert.deepEqual(
      validateProductiveAutograding(productiveAutogradingTrimFaulty(' true ')),
      prodAutogradingTrimFaultyError
    )

    assert.deepEqual(
      validateProductiveAutograding(productiveAutogradingTrimFaulty(' true')),
      prodAutogradingTrimFaultyError
    )

    assert.deepEqual(
      validateProductiveAutograding(productiveAutogradingTrimFaulty('true ')),
      prodAutogradingTrimFaultyError
    )
  })

  test('prod. AG fails with missing ID', () => {
    assert.deepEqual(validateProductiveAutograding(productiveAutogradingMissingId), prodAutogradingMissingIdError)
  })
})
