import { AxiosError } from 'axios';
import { SIGNUP_RULES } from '@/lib/validation';

// The API validates with go-playground/validator and returns its raw output as
// the error string — one line per failed field, like:
//
//   Key: 'SignupInput.Password' Error:Field validation for 'Password' failed on the 'min' tag
//
// That names internal Go types and a struct tag. It tells a user nothing they
// can act on, and it leaks the server's field names, so it is translated here
// rather than shown. Anything that does not match this shape is passed through
// untouched, because the API's other messages are already written for people.
const VALIDATOR_LINE =
  /Key: '[^']*\.(\w+)' Error:Field validation for '\w+' failed on the '(\w+)' tag/g;

function label(field: string): string {
  // 'ConfirmPassword' -> 'Confirm password'
  const spaced = field.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function ruleMessage(field: string, tag: string): string {
  const name = field.toLowerCase();

  if (tag === 'required') return `${label(field)} is required.`;
  if (tag === 'email') return 'Enter a valid email address.';

  if (tag === 'min') {
    if (name === 'password') {
      return `Password must be at least ${SIGNUP_RULES.passwordMin} characters.`;
    }
    if (name === 'name') {
      return `Name must be at least ${SIGNUP_RULES.nameMin} characters.`;
    }
    return `${label(field)} is too short.`;
  }

  if (tag === 'max') return `${label(field)} is too long.`;

  return `${label(field)} is not valid.`;
}

export function humaniseValidationError(raw: string): string | null {
  const matches = [...raw.matchAll(VALIDATOR_LINE)];
  if (matches.length === 0) return null;

  // One message per field, de-duplicated — the same rule can be reported twice.
  const seen = new Set<string>();
  const messages: string[] = [];
  for (const [, field, tag] of matches) {
    const message = ruleMessage(field, tag);
    if (seen.has(message)) continue;
    seen.add(message);
    messages.push(message);
  }

  return messages.join(' ');
}

export function getApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    // Server sent a structured error
    const serverMessage = error.response?.data?.error;
    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      return humaniseValidationError(serverMessage) ?? serverMessage;
    }

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
