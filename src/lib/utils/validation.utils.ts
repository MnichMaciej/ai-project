/**
 * Password strength calculation result
 */
export interface PasswordStrength {
  strength: number; // 0-4
  label: string; // Empty, "Słabe", "Średnie", "Dobre", "Silne"
}

/**
 * Calculates password strength based on common criteria
 * Returns strength level (0-4) and label
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { strength: 0, label: "" };
  }

  let strength = 0;

  // Length check (minimum 8 characters)
  if (password.length >= 8) strength++;

  // Uppercase letter check
  if (/[A-Z]/.test(password)) strength++;

  // Lowercase letter check
  if (/[a-z]/.test(password)) strength++;

  // Number check
  if (/[0-9]/.test(password)) strength++;

  const labels = ["", "Słabe", "Średnie", "Dobre", "Silne"];
  return { strength, label: labels[strength] };
}

/**
 * Validation feedback state for form fields
 */
export interface ValidationFeedback {
  isValid: boolean;
  isTouched: boolean;
  hasValue: boolean;
  showSuccess: boolean;
}

/**
 * Gets validation className for form inputs
 * Returns green border class when field is valid, touched, and has value
 */
export function getValidationClassName(feedback: ValidationFeedback): string {
  if (feedback.isTouched && feedback.isValid && feedback.hasValue) {
    return "border-green-500 dark:border-green-600";
  }
  return "";
}

/**
 * Gets validation className for email fields
 */
export function getEmailValidationClassName(isTouched: boolean, isValid: boolean, hasValue: boolean): string {
  return getValidationClassName({ isTouched, isValid, hasValue, showSuccess: isValid });
}

/**
 * Gets validation className for password fields
 * For password, we also check strength level
 */
export function getPasswordValidationClassName(
  isTouched: boolean,
  isValid: boolean,
  hasValue: boolean,
  strength?: number
): string {
  const isValidAndStrong = isValid && (strength === undefined || strength >= 4);
  return getValidationClassName({
    isTouched,
    isValid: isValidAndStrong,
    hasValue,
    showSuccess: isValidAndStrong,
  });
}

/**
 * Gets validation className for confirm password fields
 */
export function getConfirmPasswordValidationClassName(
  isTouched: boolean,
  isValid: boolean,
  hasValue: boolean,
  passwordsMatch: boolean
): string {
  const isValidAndMatching = isValid && passwordsMatch;
  return getValidationClassName({
    isTouched,
    isValid: isValidAndMatching,
    hasValue,
    showSuccess: isValidAndMatching,
  });
}
