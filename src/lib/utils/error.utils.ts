import type { AuthErrorResponseDto } from "../../types.ts";

/**
 * Error types for API error handling
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  SERVER = "SERVER",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
}

/**
 * Structured API error with type, message, and optional field mapping
 */
export interface ApiError {
  type: ErrorType;
  message: string;
  field?: string; // For field-specific errors
  statusCode?: number;
  failedAttempts?: number; // For login errors
}

/**
 * Detects if an error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }
  if (error instanceof Error) {
    return (
      error.message.includes("network") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Failed to fetch")
    );
  }
  return false;
}

/**
 * Parses an API error response into a structured ApiError
 */
export function parseApiError(response: Response, errorData: unknown, defaultMessage: string): ApiError {
  const statusCode = response.status;
  const errorResponse = errorData as AuthErrorResponseDto;

  // Determine error type based on status code
  let errorType: ErrorType;
  if (statusCode === 401) {
    errorType = ErrorType.AUTHENTICATION;
  } else if (statusCode === 403) {
    errorType = ErrorType.AUTHORIZATION;
  } else if (statusCode >= 400 && statusCode < 500) {
    errorType = ErrorType.VALIDATION;
  } else {
    errorType = ErrorType.SERVER;
  }

  const message = errorResponse?.error || defaultMessage;

  // Extract field from error message if it contains field indicators
  let field: string | undefined;
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("email") || lowerMessage.includes("e-mail")) {
    field = "email";
  } else if (lowerMessage.includes("password") || lowerMessage.includes("hasło")) {
    // Check for specific password field indicators
    if (lowerMessage.includes("confirm") || lowerMessage.includes("potwierdź") || lowerMessage.includes("identyczne")) {
      field = "confirmPassword";
    } else {
      field = "password";
    }
  }

  return {
    type: errorType,
    message,
    field,
    statusCode,
    failedAttempts: errorResponse?.failedAttempts,
  };
}

/**
 * Creates a network error
 */
export function createNetworkError(message = "Błąd połączenia z serwerem. Sprawdź połączenie internetowe."): ApiError {
  return {
    type: ErrorType.NETWORK,
    message,
  };
}

/**
 * Creates a generic error for unexpected failures
 */
export function createGenericError(message: string): ApiError {
  return {
    type: ErrorType.SERVER,
    message,
  };
}

/**
 * Checks if error indicates account is locked
 */
export function isAccountLockedError(error: ApiError): boolean {
  const lowerMessage = error.message.toLowerCase();
  return (
    error.statusCode === 403 ||
    lowerMessage.includes("zablokowane") ||
    lowerMessage.includes("locked") ||
    (error.failedAttempts !== undefined && error.failedAttempts >= 5)
  );
}

/**
 * Checks if error indicates token is expired or invalid
 */
export function isTokenError(error: ApiError): boolean {
  const lowerMessage = error.message.toLowerCase();
  return (
    lowerMessage.includes("token") ||
    lowerMessage.includes("wygasły") ||
    lowerMessage.includes("expired") ||
    lowerMessage.includes("invalid")
  );
}
