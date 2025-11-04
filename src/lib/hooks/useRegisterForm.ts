import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Register form validation schema
export const registerFormSchema = z
  .object({
    email: z
      .string()
      .min(1, "Adres e-mail jest wymagany")
      .email("Nieprawidłowy format e-mail")
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Nieprawidłowy format e-mail"),
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

export type RegisterFormData = z.infer<typeof registerFormSchema>;

export interface UseRegisterFormReturn {
  form: ReturnType<typeof useForm<RegisterFormData>>;
  isSubmitting: boolean;
  onSubmit: (data: RegisterFormData) => Promise<void>;
}

/**
 * Custom hook for managing register form state and submission
 * Handles form validation, API integration, and error handling
 */
export function useRegisterForm(): UseRegisterFormReturn {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange", // Validate on change for live feedback
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Nie udało się zarejestrować";

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

      // Success - show toast and redirect
      toast.success("Rejestracja zakończona pomyślnie");
      window.location.href = "/projects";
    } catch (error) {
      console.error("Error registering:", error);

      // Handle network errors
      if (error instanceof Error && error.message.includes("fetch")) {
        toast.error("Błąd połączenia z serwerem. Sprawdź połączenie internetowe.");
      } else {
        toast.error("Nie udało się zarejestrować. Spróbuj ponownie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit,
  };
}
