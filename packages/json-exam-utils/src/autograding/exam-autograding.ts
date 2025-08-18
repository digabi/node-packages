import { validateAutograding, validateProductiveAutograding } from './autograding-validator'
import {
  ExamAudioTest,
  ExamChoiceGroupQuestion,
  ExamContent,
  ExamMultiChoiceGapQuestion,
  ExamQuestion,
  ExamSubtextQuestion,
  ExamTextQuestion
} from '../exam-types'

const getTextCorrectAnswers = (question: ExamTextQuestion | ExamSubtextQuestion) => ({
  id: question.id,
  correctAnswers: question.correctAnswers?.map(answer => ({ text: answer, score: question.maxScore }))
})

const getMaxScoreChoiceGroupCorrectAnswers = (question: ExamChoiceGroupQuestion) => ({
  maxScore: question.maxScore,
  id: question.id,
  choices: question.choices.map(choice => ({ options: choice.options.map(({ id, correct }) => ({ id, correct })) }))
})

const getCustomScoreChoiceGroupCorrectAnswers = (question: ExamChoiceGroupQuestion) => ({
  id: question.id,
  choices: question.choices.map(choice => ({
    options: choice.options.map(({ id, correct, score }) => ({ id, correct, score }))
  }))
})

const getMultiChoiceGapCorrectAnswers = (question: ExamMultiChoiceGapQuestion) => ({
  id: question.id,
  maxScore: question.maxScore,
  choices: question.content
    .filter(x => x.type === 'gap')
    .map(partOfContent => ({
      options: partOfContent.options.map(({ correct, id }) => ({ correct, id }))
    }))
})

const getMultiChoiceCorrectAnswers = (question: ExamQuestion | ExamAudioTest) => {
  if (question.type === 'choicegroup' && question.maxScore) {
    return getMaxScoreChoiceGroupCorrectAnswers(question)
  }

  if (question.type === 'choicegroup') {
    return getCustomScoreChoiceGroupCorrectAnswers(question)
  }

  if (question.type === 'multichoicegap') {
    return getMultiChoiceGapCorrectAnswers(question)
  }

  return undefined
}

const getProductiveCorrectAnswers = (question: ExamQuestion | ExamAudioTest) => {
  if ((question.type === 'text' || question.type === 'subtext') && question.correctAnswers) {
    return getTextCorrectAnswers(question)
  }

  return undefined
}

export const generateProductiveAutogradingJson = (examContent: ExamContent, examUuid: string) => {
  const questions = examContent.sections.flatMap(x => x.questions)
  const result = { examUuid, questions: questions.map(getProductiveCorrectAnswers).filter(v => v !== undefined) }
  const validationResult = validateProductiveAutograding([result])

  if (validationResult !== undefined) {
    throw new Error(
      `Productive autograding.json was not generated correctly. Errors: ${JSON.stringify(validationResult, null, 2)}`
    )
  }

  return result
}

export const generateAutogradingJson = (examContent: ExamContent) => {
  const questions = examContent.sections.flatMap(x => x.questions)
  const result = questions.map(getMultiChoiceCorrectAnswers).filter(v => v !== undefined)
  const validationResult = validateAutograding(result)

  if (validationResult !== undefined) {
    throw new Error(
      `Autograding.json was not generated correctly. Errors: ${JSON.stringify(validationResult, null, 2)}`
    )
  }

  return result
}

export function removeCorrectAnswersAndScores<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => removeCorrectAnswersAndScores(item) as T) as T
  } else if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}

    for (const key in value) {
      if (key === 'correct' || key === 'score') {
        continue
      } else if (key === 'correctAnswers') {
        result[key] = []
      } else {
        result[key] = removeCorrectAnswersAndScores((value as Record<string, unknown>)[key])
      }
    }

    return result as T
  }

  return value
}
