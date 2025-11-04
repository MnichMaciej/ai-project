import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Reset password form validation schema
export const resetPasswordFormSchema = z.object({
  email: z
    .string()
    .min(1, "Adres e-mail jest wymagany")
    .email("Nieprawidłowy format e-mail")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Nieprawidłowy format e-mail"),
});

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;

export interface UseResetPasswordFormReturn {
  form: ReturnType<typeof useForm<ResetPasswordFormData>>;
  isSubmitting: boolean;
  onSubmit: (data: ResetPasswordFormData) => Promise<void>;
  isSuccess: boolean;
}

/**
 * Custom hook for managing reset password form state and submission
 * Handles form validation, API integration, and error handling
 */
export function useResetPasswordForm(): UseResetPasswordFormReturn {
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      email: "",
    },
    mode: "onChange", // Validate on change for live feedback
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Nie udało się wysłać linku resetującego hasło";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;

          // Map specific errors
          if (errorData.error?.includes("email") || errorData.error?.includes("e-mail")) {
            form.setError("email", {
              type: "server",
              message: errorMessage,
            });
          }
        } catch {
          // If parsing fails, use default error message
        }

        toast.error(errorMessage);
        return;
      }

      // Success - show success message
      setIsSuccess(true);
      toast.success("Link do resetowania hasła został wysłany na podany adres e-mail");
    } catch (error) {
      console.error("Error resetting password:", error);

      // Handle network errors
      if (error instanceof Error && error.message.includes("fetch")) {
        toast.error("Błąd połączenia z serwerem. Sprawdź połączenie internetowe.");
      } else {
        toast.error("Nie udało się wysłać linku resetującego hasło. Spróbuj ponownie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit,
    isSuccess,
  };
}
