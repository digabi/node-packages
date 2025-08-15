import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  generateAutogradingJson,
  generateProductiveAutogradingJson,
  removeCorrectAnswersAndScores
} from '../src/autograding/exam-autograding'

describe('exam-autograding-test.js', () => {
  test('should not mutate exam object', () => {
    const exam = {
      title: 'Title',
      instruction: 'test',
      sections: [
        {
          questions: [
            {
              text: 'asd',
              displayNumber: '2',
              id: 1,
              type: 'choicegroup',
              level: 1,
              maxScore: 2,
              choices: [
                {
                  id: 2,
                  text: 'asd',
                  displayNumber: '1',
                  type: 'choice',
                  breakAfter: true,
                  options: [{ id: 3, text: 'They strictly control their manner of speaking', correct: false, score: 1 }]
                }
              ]
            }
          ]
        }
      ]
    }

    const examCopy = JSON.parse(JSON.stringify(exam)) as unknown

    const res = removeCorrectAnswersAndScores(exam)

    const expected = {
      title: 'Title',
      instruction: 'test',
      sections: [
        {
          questions: [
            {
              text: 'asd',
              displayNumber: '2',
              id: 1,
              type: 'choicegroup',
              level: 1,
              maxScore: 2,
              choices: [
                {
                  id: 2,
                  text: 'asd',
                  displayNumber: '1',
                  type: 'choice',
                  breakAfter: true,
                  options: [{ id: 3, text: 'They strictly control their manner of speaking' }]
                }
              ]
            }
          ]
        }
      ]
    }

    assert.deepEqual(res, expected)
    assert.deepEqual(examCopy, exam)
  })

  test('removes correct answers in choicegroup', () => {
    const res = removeCorrectAnswersAndScores({
      title: 'Title',
      instruction: 'test',
      sections: [
        {
          questions: [
            {
              text: 'asd',
              displayNumber: '2',
              id: 1,
              type: 'choicegroup',
              level: 1,
              maxScore: 2,
              choices: [
                {
                  id: 2,
                  text: 'asd',
                  displayNumber: '1',
                  type: 'choice',
                  breakAfter: true,
                  options: [{ id: 3, text: 'They strictly control their manner of speaking', correct: false, score: 1 }]
                }
              ]
            }
          ]
        }
      ]
    })

    const expected = {
      title: 'Title',
      instruction: 'test',
      sections: [
        {
          questions: [
            {
              text: 'asd',
              displayNumber: '2',
              id: 1,
              type: 'choicegroup',
              level: 1,
              maxScore: 2,
              choices: [
                {
                  id: 2,
                  text: 'asd',
                  displayNumber: '1',
                  type: 'choice',
                  breakAfter: true,
                  options: [{ id: 3, text: 'They strictly control their manner of speaking' }]
                }
              ]
            }
          ]
        }
      ]
    }

    assert.deepEqual(res, expected)
  })

  test('removes correct text answers, but leaves the field correctAnswers (used to determine the type of productive autograding-field)', () => {
    const res = removeCorrectAnswersAndScores({
      title: 'Productive',
      instruction: 'test',
      sections: [
        {
          questions: [
            { text: 'Gap', displayNumber: '0', id: 0, type: 'text', level: 1, correctAnswers: ['foo'] },
            { text: 'Gap', displayNumber: '1', id: 1, type: 'subtext', level: 1, correctAnswers: [] }
          ]
        }
      ]
    })

    const expected = {
      title: 'Productive',
      instruction: 'test',
      sections: [
        {
          questions: [
            { text: 'Gap', displayNumber: '0', id: 0, type: 'text', level: 1, correctAnswers: [] },
            { text: 'Gap', displayNumber: '1', id: 1, type: 'subtext', level: 1, correctAnswers: [] }
          ]
        }
      ]
    }

    assert.deepEqual(res, expected)
  })

  test('should include answers from a choice group with max score in the autograding.json', () => {
    const res = generateAutogradingJson({
      title: 'Title',
      instruction: 'test',
      sections: [
        {
          questions: [
            {
              id: 1,
              type: 'choicegroup',
              maxScore: 2,
              text: 'a',
              displayNumber: '1',
              level: 1,
              choices: [
                {
                  id: 2,
                  type: 'choice',
                  text: 'a',
                  displayNumber: '1',
                  options: [
                    { id: 3, correct: false, text: 'b' },
                    { id: 5, correct: true, text: 'b' }
                  ]
                },
                {
                  id: 6,
                  type: 'choice',
                  text: 'a',
                  displayNumber: '2',
                  options: [
                    { id: 7, correct: false, text: 'b' },
                    { id: 9, correct: true, text: 'b' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })

    const expected = [
      {
        id: 1,
        maxScore: 2,
        choices: [
          {
            options: [
              { id: 3, correct: false },
              { id: 5, correct: true }
            ]
          },
          {
            options: [
              { id: 7, correct: false },
              { id: 9, correct: true }
            ]
          }
        ]
      }
    ]

    assert.deepEqual(res, expected)
  })

  test('should include answers from a choice group with individual scores in the autograding.json', () => {
    const res = generateAutogradingJson({
      title: 'Title',
      instruction: 'test',
      sections: [
        {
          questions: [
            {
              id: 1,
              type: 'choicegroup',
              text: 'a',
              displayNumber: '1',
              level: 1,
              choices: [
                {
                  id: 2,
                  type: 'choice',
                  text: 'a',
                  displayNumber: '1',
                  options: [
                    { id: 3, correct: false, score: 1, text: 'a' },
                    { id: 5, correct: true, score: 5, text: 'a' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    })

    const expected = [
      {
        id: 1,
        choices: [
          {
            options: [
              { id: 3, correct: false, score: 1 },
              { id: 5, correct: true, score: 5 }
            ]
          }
        ]
      }
    ]

    assert.deepEqual(res, expected)
  })

  test('should include correct answers from a productive questions in autograding.json', () => {
    const res = generateProductiveAutogradingJson(
      {
        title: 'Productive',
        instruction: 'test',
        sections: [
          {
            questions: [
              { text: 'Q1', maxScore: 1, displayNumber: '0', id: 0, type: 'text', level: 1, correctAnswers: ['foo'] },
              { text: 'Q2', maxScore: 1, displayNumber: '1', id: 1, type: 'subtext', level: 1, correctAnswers: [] },
              { text: 'Q3', maxScore: 1, displayNumber: '2', id: 2, type: 'subtext', level: 1 }
            ]
          }
        ]
      },
      'cb0e1d96-783f-4b3d-915e-acacb8ba52dd'
    )

    const expected = {
      examUuid: 'cb0e1d96-783f-4b3d-915e-acacb8ba52dd',
      questions: [
        { id: 0, correctAnswers: [{ score: 1, text: 'foo' }] },
        { id: 1, correctAnswers: [] }
      ]
    }

    assert.deepEqual(res, expected)
  })

  test('should include answers from a multiple choice gap question', () => {
    const res = generateAutogradingJson({
      title: 'Title',
      instruction: 'test',
      sections: [
        {
          questions: [
            {
              id: 30700,
              text: '',
              displayNumber: '0',
              level: 1,
              type: 'multichoicegap',
              maxScore: 16,
              content: [
                { type: 'text', text: 'text' },
                {
                  type: 'gap',
                  options: [
                    { id: 30701, correct: true, text: 'do not include me' },
                    { id: 30702, correct: false, text: '' },
                    { id: 30703, correct: false, text: '' }
                  ],
                  id: 30704
                },
                { type: 'text', text: 'text' },
                {
                  type: 'gap',
                  options: [
                    { id: 30705, correct: false, text: '' },
                    { id: 30706, correct: false, text: '' },
                    { id: 30707, correct: false, text: '' },
                    { id: 30708, correct: true, text: '' }
                  ],
                  id: 30709
                }
              ]
            }
          ]
        }
      ]
    })

    const expected = [
      {
        id: 30700,
        maxScore: 16,
        choices: [
          {
            options: [
              { id: 30701, correct: true },
              { id: 30702, correct: false },
              { id: 30703, correct: false }
            ]
          },
          {
            options: [
              { id: 30705, correct: false },
              { id: 30706, correct: false },
              { id: 30707, correct: false },
              { id: 30708, correct: true }
            ]
          }
        ]
      }
    ]

    assert.deepEqual(res, expected)
  })
})
