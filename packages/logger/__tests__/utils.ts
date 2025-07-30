import { Logger } from 'winston'

export class MyError extends Error {
  customField: string
  message: string

  constructor(message: string, customField: string) {
    super()

    this.message = message
    this.customField = customField
  }
}

export function assertNextLogEvent(logger: Logger, assertFn: (x: any) => void) {
  const transport = logger.transports[0]

  return new Promise(resolve => {
    transport.once('logged', info => {
      assertFn(info)
      resolve(true)
    })
  })
}
