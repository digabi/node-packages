/* eslint-disable @typescript-eslint/no-unsafe-return */
import _ from 'lodash'

/**
 * @deprecated generator for legacy json exams. Remove after json exams are no longer supported.
 */
export function createExamContent(overrides?: unknown) {
  const defaults = {
    title: 'Generoitu otsikko',
    instruction: 'Ohjeet tulisivat tähän',
    textQuestionCount: 4,
    subTextQuestionCount: 0,
    productiveTextQuestionCount: 0,
    productiveSubTextQuestionCount: 0,
    multichoiceQuestionCount: 0,
    multichoiceGapQuestionCount: 0,
    attachmentTextQuestionCount: 0,
    productiveAttachmentTextQuestionCount: 0,
    restrictedMediaTextQuestionCount: 0,
    transposeQuestions: false,
    customPoints: false,
    sectionCount: 1,
    casForbiddenSectionIndexes: []
  } as const

  type ExamFields = typeof defaults & {
    multichoiceQuestionsWithCustomPointsCount?: number
    multichoiceQuestionCount: number
  }

  const examFields: ExamFields = _.assign(defaults, overrides)
  examFields.multichoiceQuestionsWithCustomPointsCount =
    examFields.customPoints && examFields.multichoiceQuestionCount > 0 ? 1 : 0
  examFields.multichoiceQuestionCount -= examFields.multichoiceQuestionsWithCustomPointsCount

  // These are function global mutable variables
  let questionId = 1
  let displayNumber = 1

  return {
    title: examFields.title,
    instruction: examFields.instruction,
    sections: _.times(examFields.sectionCount, i => {
      const questions = [
        _.times(examFields.textQuestionCount, () => addTextQuestion('text')),
        _.times(examFields.subTextQuestionCount, () => addTextQuestion('subtext')),
        _.times(examFields.productiveTextQuestionCount, () => addProductiveTextQuestion('text')),
        _.times(examFields.productiveSubTextQuestionCount, () => addProductiveTextQuestion('subtext')),
        _.times(examFields.attachmentTextQuestionCount, addAttachmentTextQuestion),
        _.times(examFields.multichoiceQuestionsWithCustomPointsCount!, addMultichoiceQuestionWithCustomPoints),
        _.times(examFields.multichoiceQuestionCount, addMultichoiceQuestion),
        _.times(examFields.multichoiceGapQuestionCount, addMultichoiceGapQuestion),
        _.times(examFields.restrictedMediaTextQuestionCount, addTextQuestionWithRestrictedMedia)
      ]

      return {
        questions: examFields.transposeQuestions
          ? // eslint-disable-next-line prefer-spread
            _.union(_.compact(_.flatten(_.zip.apply(_, questions))))
          : _.union(_.flatten(questions)),
        //@ts-expect-error incomplete types
        ...(examFields.casForbiddenSectionIndexes.includes(i) ? { casForbidden: true } : undefined)
      }
    })
  }

  function addTextQuestion(questionType: string) {
    return {
      maxScore: 6,
      text: 'Test-serverin luoma <b>koekysymys</b> jossa ei ole juuri lainkaan tekstiä.',
      displayNumber: `${displayNumber++}`,
      id: questionId++,
      type: questionType,
      level: 1
    }
  }

  function addProductiveTextQuestion(questionType: string) {
    return { ...addTextQuestion(questionType), correctAnswers: ['lol'] }
  }

  function addAttachmentTextQuestion() {
    return _.assign(addTextQuestion('text'), { screenshotExpected: true })
  }

  function addMultichoiceQuestionWithCustomPoints() {
    return generateChoiceGroup(true)
  }

  function addMultichoiceQuestion() {
    return generateChoiceGroup(false)
  }

  function addMultichoiceGapQuestion() {
    return {
      maxScore: 8,
      text: 'Test-serverin luoma <i>multichoicegap</i> jossa pari aukkoa.',
      displayNumber: `${displayNumber++}`,
      id: questionId++,
      type: 'multichoicegap',
      level: 1,
      content: [
        {
          type: 'text',
          text: 'Ensimmäisen aukon edeltävä teksti '
        },
        generateGap(),
        {
          type: 'text',
          text: ', välissä oleva teksti \\(x^2\\)'
        },
        generateGap(),
        {
          type: 'text',
          text: ' ja lopetus.'
        }
      ]
    }

    function generateGap() {
      return {
        id: questionId++,
        type: 'gap',
        options: generateOptions()
      }
    }
  }

  function addTextQuestionWithRestrictedMedia(textQuestionId: number) {
    return _.assign(addTextQuestion('text'), {
      restrictedMedia: _.times(textQuestionId + 1, rmIndex => ({
        file: `${textQuestionId}-${rmIndex}`,
        text: `kysymys ${textQuestionId} media ${rmIndex}`
      }))
    })
  }

  function generateChoiceGroup(useCustomPoints: boolean) {
    const common: any = {
      text: useCustomPoints
        ? 'Test-serverin luoma <i>choice group</i> jossa valintakohtaiset scoret.'
        : 'Test-serverin luoma <i>choice group</i> jossa pari kysymystä.',
      displayNumber: `${displayNumber}`,
      id: questionId++,
      type: 'choicegroup',
      level: 1,
      choices: _.map(_.range(2), choiceIndex => ({
        id: questionId++,
        text: useCustomPoints ? 'Choice valintakohtaisilla scoreilla' : 'Choice jossa muutama vaihtoehto',
        displayNumber: `${displayNumber}.${choiceIndex + 1}`,
        type: 'choice',
        breakAfter: choiceIndex === 0,
        options: generateOptions({ addChoiceScore: useCustomPoints, hasImage: true })
      }))
    }
    if (!useCustomPoints) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      common.maxScore = 4
    }

    displayNumber++

    return common
  }

  function generateOptions(options: { addChoiceScore?: boolean; hasImage?: boolean } = {}) {
    return _.map(_.range(3), optionIndex => {
      const option: any = {
        id: questionId++,
        text: `${options.hasImage ? '<img src="attachments/choice.png" /> ' : ''}Tässä vaihtoehto numero ${
          optionIndex + 1
        }`,
        correct: optionIndex === 0
      }
      if (options.addChoiceScore) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        option.score = -2 * (optionIndex - 1) // start from 2, then 0, -2, ...
      }
      return option
    })
  }
}
