import sanitizeHtml, { IFrame } from 'sanitize-html'
import { Logger } from 'winston'

const sanitizeOpts: sanitizeHtml.IOptions = {
  allowedTags: ['div', 'img', 'br'],
  allowedAttributes: {
    img: ['src', 'alt']
  },
  allowedSchemes: [],
  exclusiveFilter: (frame: IFrame) => frame.attribs['data-js'] === 'mathEditor'
}

const screenshotImageSrcRegExp = /^"\/screenshot\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/i
const mathImageSrcRegExp = /"\/math.svg\?latex/

export const screenshotImageRegexp =
  /img src="\/screenshot\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})"/gi

export function sanitizeAnswerContent(answerContent: string, additionalOptions: sanitizeHtml.IOptions = {}) {
  return sanitizeHtml(answerContent, { ...sanitizeOpts, ...additionalOptions })
}

export function containsInvalidImgTags(answerContent: string, logger?: Logger): boolean {
  const imageSources: string[] = []
  answerContent.replace(/img\s+src[^=]*=([^><]*)/gi, (_match, src: unknown[]) => {
    imageSources.push(src.toString())
    return ''
  })

  const invalidImages = imageSources.filter(src => !isScreenshotImage(src) && !isMathImage(src))
  if (invalidImages.length > 0) {
    const uniqueInvalidImages = [...new Set(invalidImages)]
    logger?.warn('Following image tags are invalid:', uniqueInvalidImages)
  }
  return invalidImages.length !== 0

  function isScreenshotImage(src: string) {
    return src.match(screenshotImageSrcRegExp) !== null
  }

  function isMathImage(src: string) {
    return src.match(mathImageSrcRegExp) !== null
  }
}
