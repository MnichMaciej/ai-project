import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Update password form validation schema (same as register)
export const updatePasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(8, "Hasło musi mieć co najmniej 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są identyczne",
    path: ["confirmPassword"],
  });

export type UpdatePasswordFormData = z.infer<typeof updatePasswordFormSchema>;

export interface UseUpdatePasswordFormReturn {
  form: ReturnType<typeof useForm<UpdatePasswordFormData>>;
  isSubmitting: boolean;
  onSubmit: (data: UpdatePasswordFormData) => Promise<void>;
  isSuccess: boolean;
}

/**
 * Custom hook for managing update password form state and submission
 * Handles form validation, API integration, and error handling
 * Reuses password validation logic from registration
 */
export function useUpdatePasswordForm(): UseUpdatePasswordFormReturn {
  const form = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validate on change for live feedback
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Nie udało się zaktualizować hasła";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;

          // Map specific errors to form fields
          if (errorData.error?.includes("hasło") || errorData.error?.includes("password")) {
            if (errorData.error?.includes("8 znaków")) {
              form.setError("password", {
                type: "server",
                message: errorMessage,
              });
            } else if (errorData.error?.includes("identyczne")) {
              form.setError("confirmPassword", {
                type: "server",
                message: errorMessage,
              });
            } else {
              form.setError("password", {
                type: "server",
                message: errorMessage,
              });
            }
          } else if (errorData.error?.includes("token") || errorData.error?.includes("wygasły")) {
            // Token expired or invalid - redirect to reset password page
            toast.error(errorMessage);
            setTimeout(() => {
              window.location.href = "/auth/reset-password";
            }, 2000);
            return;
          }
        } catch {
          // If parsing fails, use default error message
        }

        toast.error(errorMessage);
        return;
      }

      // Success - show success message and redirect
      setIsSuccess(true);
      toast.success("Hasło zostało pomyślnie zaktualizowane");

      // Redirect to login after short delay
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error) {
      console.error("Error updating password:", error);

      // Handle network errors
      if (error instanceof Error && error.message.includes("fetch")) {
        toast.error("Błąd połączenia z serwerem. Sprawdź połączenie internetowe.");
      } else {
        toast.error("Nie udało się zaktualizować hasła. Spróbuj ponownie.");
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
