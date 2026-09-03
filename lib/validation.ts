// The API's own signup rules, mirrored here.
//
// Duplicating them is deliberate: the client cannot ask the server what they
// are, and letting the request fail instead means the only feedback a user gets
// is a go-playground/validator dump naming internal Go fields. Checking here
// means the common mistakes never reach the network. `lib/api/errors.ts` reads
// the same constants when it has to translate a rule the server rejected.
//
// Verified against the running API on 31 August 2026 by probing each boundary.
// If the server's rules change, these are the numbers to change with them.
export const SIGNUP_RULES = {
  nameMin: 2,
  passwordMin: 6,
} as const;

export type SignupFields = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignupErrors = Partial<Record<keyof SignupFields, string>>;

// Deliberately permissive: something@something.something. Anything stricter
// rejects addresses that are actually valid, and the server is the real
// authority on whether an address exists.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only reports a field the user has started filling in, so the form does not
// accuse someone of an empty password before they have reached it. Emptiness is
// handled by keeping the submit button disabled.
export function validateSignup(fields: SignupFields): SignupErrors {
  const errors: SignupErrors = {};
  const name = fields.name.trim();
  const email = fields.email.trim();

  if (name.length > 0 && name.length < SIGNUP_RULES.nameMin) {
    errors.name = `Name must be at least ${SIGNUP_RULES.nameMin} characters.`;
  }

  if (email.length > 0 && !EMAIL.test(email)) {
    errors.email = 'Enter a valid email address, like you@example.com.';
  }

  if (fields.password.length > 0 && fields.password.length < SIGNUP_RULES.passwordMin) {
    errors.password = `Password must be at least ${SIGNUP_RULES.passwordMin} characters.`;
  }

  if (fields.confirmPassword.length > 0 && fields.password !== fields.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

export function isSignupComplete(fields: SignupFields): boolean {
  return (
    fields.name.trim().length > 0 &&
    fields.email.trim().length > 0 &&
    fields.password.length > 0 &&
    fields.confirmPassword.length > 0
  );
}
