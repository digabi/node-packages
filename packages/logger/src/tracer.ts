import tracer from 'cls-rtracer'

export function getRequestId(): string | undefined {
  return tracer.id() as string | undefined
}

export function tracerExpressMiddleware() {
  return tracer.expressMiddleware({ headerName: 'X-Amzn-Trace-Id', useHeader: true })
}
