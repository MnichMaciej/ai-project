import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authService } from "../services/auth.service.ts";
import { type ApiError } from "../utils/error.utils.ts";

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
      await authService.resetPassword(data.email);

      // Success - show success message
      setIsSuccess(true);
      toast.success("Link do resetowania hasła został wysłany na podany adres e-mail");
    } catch (error) {
      const apiError = error as ApiError;

      // Map error to form field if field is specified
      if (apiError.field) {
        form.setError(apiError.field as "email", {
          type: "server",
          message: apiError.message,
        });
      }

      toast.error(apiError.message);
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
