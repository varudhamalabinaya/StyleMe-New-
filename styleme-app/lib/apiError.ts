import axios from 'axios'

type ApiErrorBody = {
  error?: string
}

export function parseApiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | undefined
    if (data?.error) {
      return data.error
    }
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Image generation can take several minutes — try again on a stable connection.'
    }
    if (error.message) {
      return error.message
    }
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return fallback
}
