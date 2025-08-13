import {
  removeCorrectAnswersAndScores,
  generateAutogradingJson,
  generateProductiveAutogradingJson
} from './autograding/exam-autograding'
import { validateAutograding, validateProductiveAutograding } from './autograding/autograding-validator'

export * from './exam-types'
export {
  removeCorrectAnswersAndScores,
  generateAutogradingJson,
  generateProductiveAutogradingJson,
  validateAutograding,
  validateProductiveAutograding
}
