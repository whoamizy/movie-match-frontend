import { isAxiosError } from 'axios'

interface BackendErrorResponse {
  message?: unknown
  path?: string
  statusCode?: number
}

export class ApiError extends Error {
  readonly path?: string
  readonly statusCode?: number

  constructor(
    message: string,
    options: {
      cause: unknown
      path?: string
      statusCode?: number
    },
  ) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.path = options.path
    this.statusCode = options.statusCode
  }
}

const resolveBackendMessage = (message: unknown) => {
  if (typeof message === 'string') {
    return message
  }

  if (
    Array.isArray(message) &&
    message.every((item) => typeof item === 'string')
  ) {
    return message.join('. ')
  }

  return null
}

export const normalizeApiError = (error: unknown, fallbackMessage: string) => {
  if (!isAxiosError<BackendErrorResponse>(error)) {
    return new ApiError(fallbackMessage, { cause: error })
  }

  const response = error.response?.data
  const message = resolveBackendMessage(response?.message) ?? fallbackMessage

  return new ApiError(message, {
    cause: error,
    path: response?.path,
    statusCode: response?.statusCode ?? error.response?.status,
  })
}
