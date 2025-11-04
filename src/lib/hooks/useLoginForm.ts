import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { AuthErrorResponseDto, LoginResponseDto } from "../../types.ts";

// Login form validation schema
export const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, "Adres e-mail jest wymagany")
    .email("Nieprawidłowy format e-mail")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Nieprawidłowy format e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export interface UseLoginFormReturn {
  form: ReturnType<typeof useForm<LoginFormData>>;
  isSubmitting: boolean;
  onSubmit: (data: LoginFormData) => Promise<void>;
  failedAttempts: number;
}

/**
 * Custom hook for managing login form state and submission
 * Handles form validation, API integration, error handling, and failed login attempts tracking
 * Synchronizes failedAttempts with server response
 */
export function useLoginForm(): UseLoginFormReturn {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange", // Validate on change for live feedback
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [failedAttempts, setFailedAttempts] = React.useState(0);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Extract failedAttempts from error response if available
        const errorData = responseData as AuthErrorResponseDto;
        const serverFailedAttempts = errorData.failedAttempts ?? failedAttempts + 1;

        // Synchronize with server
        setFailedAttempts(serverFailedAttempts);

        const errorMessage = errorData.error || "Nieprawidłowe dane logowania";

        // Check if account is locked (US-003)
        if (errorMessage.includes("zablokowane") || errorMessage.includes("locked") || response.status === 403) {
          toast.error("Konto zablokowane, skontaktuj się z adminem");
          return;
        }

        // Map specific errors
        if (errorData.error?.includes("email") || errorData.error?.includes("e-mail")) {
          form.setError("email", {
            type: "server",
            message: errorMessage,
          });
        } else {
          form.setError("password", {
            type: "server",
            message: errorMessage,
          });
        }

        if (serverFailedAttempts >= 5) {
          toast.error("Konto zablokowane po 5 nieudanych próbach. Skontaktuj się z adminem.");
        } else {
          toast.error(errorMessage);
        }

        return;
      }

      // Success - reset failed attempts and synchronize with server
      const successData = responseData as LoginResponseDto;
      setFailedAttempts(successData.failedAttempts ?? 0);
      toast.success("Zalogowano pomyślnie");
      window.location.href = "/projects";
    } catch (error) {
      console.error("Error logging in:", error);

      // Handle network errors
      if (error instanceof Error && error.message.includes("fetch")) {
        toast.error("Błąd połączenia z serwerem. Sprawdź połączenie internetowe.");
      } else {
        toast.error("Nie udało się zalogować. Spróbuj ponownie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit,
    failedAttempts,
  };
}
