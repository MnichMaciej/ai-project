import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { authService } from "../services/auth.service.ts";
import { isTokenError, type ApiError } from "../utils/error.utils.ts";

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
      await authService.updatePassword({
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      // Success - show success message and redirect
      setIsSuccess(true);
      toast.success("Hasło zostało pomyślnie zaktualizowane");

      // Redirect to login after short delay
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);
    } catch (error) {
      const apiError = error as ApiError;

      // Check if token is expired or invalid
      if (isTokenError(apiError)) {
        toast.error(apiError.message);
        setTimeout(() => {
          window.location.href = "/auth/reset-password";
        }, 2000);
        return;
      }

      // Map error to form field if field is specified
      if (apiError.field) {
        form.setError(apiError.field as "password" | "confirmPassword", {
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
