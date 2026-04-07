import type { Writable } from 'node:stream'

interface HttpResponseStreamMetadata {
  statusCode: number
  headers: Record<string, string>
}

interface HttpResponseStreamStatic {
  from(stream: Writable, metadata: HttpResponseStreamMetadata): Writable
}

type StreamHandler = (
  event: Record<string, unknown>,
  responseStream: Writable,
  context: unknown
) => Promise<void>

interface AwsLambda {
  streamifyResponse(handler: StreamHandler): StreamHandler
  HttpResponseStream: HttpResponseStreamStatic
}

declare global {
  const awslambda: AwsLambda
}

export type { AwsLambda }
