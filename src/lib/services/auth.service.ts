import type {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  LoginResponseDto,
  RegisterResponseDto,
  ResetPasswordResponseDto,
  UpdatePasswordResponseDto,
  AuthErrorResponseDto,
} from "../../types.ts";
import {
  parseApiError,
  createNetworkError,
  createGenericError,
  isNetworkError,
  type ApiError,
} from "../utils/error.utils.ts";

/**
 * Authentication API service
 * Centralized service for all authentication-related API calls
 * Provides type-safe methods with consistent error handling
 */
export class AuthService {
  private readonly baseUrl: string;

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Makes a typed API request with error handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}, defaultError: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const abortController = new AbortController();

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: abortController.signal,
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          // If parsing fails, create generic error
          throw createGenericError(defaultError);
        }

        const apiError = parseApiError(response, errorData, defaultError);
        throw apiError;
      }

      // Parse successful response
      return await response.json();
    } catch (error) {
      // Re-throw ApiError instances
      if (error && typeof error === "object" && "type" in error) {
        throw error;
      }

      // Handle network errors
      if (isNetworkError(error)) {
        throw createNetworkError();
      }

      // Handle unexpected errors
      throw createGenericError(defaultError);
    }
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginDto): Promise<LoginResponseDto> {
    return this.request<LoginResponseDto>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      "Nieprawidłowe dane logowania"
    );
  }

  /**
   * Register new user
   */
  async register(data: RegisterDto): Promise<RegisterResponseDto> {
    return this.request<RegisterResponseDto>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "Nie udało się zarejestrować"
    );
  }

  /**
   * Request password reset email
   */
  async resetPassword(email: string): Promise<ResetPasswordResponseDto> {
    const dto: ResetPasswordDto = { email };
    return this.request<ResetPasswordResponseDto>(
      "/api/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify(dto),
      },
      "Nie udało się wysłać linku resetującego hasło"
    );
  }

  /**
   * Update password after reset link click
   */
  async updatePassword(data: UpdatePasswordDto): Promise<UpdatePasswordResponseDto> {
    return this.request<UpdatePasswordResponseDto>(
      "/api/auth/update-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "Nie udało się zaktualizować hasła"
    );
  }

  /**
   * Exchange recovery token/code for session
   */
  async exchangeRecoveryToken(code: string | null, token: string | null, type: string): Promise<void> {
    return this.request<void>(
      "/api/auth/exchange-recovery-token",
      {
        method: "POST",
        body: JSON.stringify({ code, token, type }),
      },
      "Nieprawidłowy lub wygasły link resetujący hasło. Spróbuj ponownie."
    );
  }

  /**
   * Check if user has active session
   */
  async checkSession(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/check-session`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
