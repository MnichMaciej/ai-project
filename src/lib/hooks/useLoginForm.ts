import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authService } from "../services/auth.service.ts";
import { isAccountLockedError, type ApiError } from "../utils/error.utils.ts";

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
      const response = await authService.login({
        email: data.email,
        password: data.password,
      });

      // Success - reset failed attempts and synchronize with server
      setFailedAttempts(response.failedAttempts ?? 0);
      toast.success("Zalogowano pomyślnie");
      window.location.href = "/projects";
    } catch (error) {
      const apiError = error as ApiError;

      // Extract failedAttempts from error if available
      const serverFailedAttempts = apiError.failedAttempts ?? failedAttempts + 1;
      setFailedAttempts(serverFailedAttempts);

      // Check if account is locked
      if (isAccountLockedError(apiError)) {
        toast.error("Konto zablokowane, skontaktuj się z adminem");
        return;
      }

      // Map error to form field if field is specified
      if (apiError.field) {
        form.setError(apiError.field as "email" | "password", {
          type: "server",
          message: apiError.message,
        });
      }

      // Show appropriate error message
      if (serverFailedAttempts >= 5) {
        toast.error("Konto zablokowane po 5 nieudanych próbach. Skontaktuj się z adminem.");
      } else {
        toast.error(apiError.message);
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
