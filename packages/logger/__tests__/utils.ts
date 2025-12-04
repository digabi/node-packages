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

  return new Promise((resolve, reject) => {
    transport.once('logged', info => {
      try {
        assertFn(info)
        resolve(true)
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)))
      }
    })
  })
}
