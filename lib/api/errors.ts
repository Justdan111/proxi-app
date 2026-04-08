import { AxiosError } from 'axios';

export function getApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    // Server sent a structured error
    const serverMessage = error.response?.data?.error;
    if (serverMessage) return serverMessage;

    // Network issues
    if (error.code === 'ECONNABORTED') return 'Request timed out. Check your connection.';
    if (!error.response) return 'No internet connection.';

    // HTTP status fallbacks
    switch (error.response.status) {
      case 400: return 'Invalid request. Please check your input.';
      case 401: return 'Session expired. Please log in again.';
      case 403: return 'You don\'t have permission to do that.';
      case 404: return 'Not found.';
      case 409: return 'This already exists.';
      case 500: return 'Server error. Please try again later.';
    }
  }
  return 'Something went wrong. Please try again.';
}