import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Shield, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

// Change password form validation schema
const changePasswordFormSchema = z
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

type ChangePasswordFormData = z.infer<typeof changePasswordFormSchema>;

interface ChangePasswordFormProps {
  onSuccess: () => void;
}

/**
 * ChangePasswordForm - Form for changing password
 * Reuses password validation logic from UpdatePasswordForm
 */
export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
    reset,
  } = form;

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  // Check password strength (same logic as UpdatePasswordForm)
  const passwordStrength = React.useMemo(() => {
    if (!watchedPassword) return { strength: 0, label: "" };

    let strength = 0;
    if (watchedPassword.length >= 8) strength++;
    if (/[A-Z]/.test(watchedPassword)) strength++;
    if (/[a-z]/.test(watchedPassword)) strength++;
    if (/[0-9]/.test(watchedPassword)) strength++;

    const labels = ["", "Słabe", "Średnie", "Dobre", "Silne"];
    return { strength, label: labels[strength] };
  }, [watchedPassword]);

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);

    try {
      // Update password using API endpoint
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Nie udało się zaktualizować hasła";
        throw new Error(errorMessage);
      }

      // Success
      setIsSuccess(true);
      toast.success("Hasło zostało pomyślnie zmienione");
      reset();

      // Call onSuccess callback
      setTimeout(() => {
        onSuccess();
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się zmienić hasła";
      toast.error(errorMessage);
      form.setError("password", {
        type: "server",
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success message
  if (isSuccess) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Hasło zmienione</CardTitle>
          <CardDescription>Twoje hasło zostało pomyślnie zmienione</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default">
            <CheckCircle2 className="size-4" />
            <AlertDescription>Hasło zostało pomyślnie zaktualizowane.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Zmień hasło</CardTitle>
        <CardDescription>Zaktualizuj hasło do swojego konta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* New Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Nowe hasło <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
                placeholder="Minimum 8 znaków"
                className={`pl-10 ${touchedFields.password && !errors.password && passwordStrength.strength >= 4 ? "border-green-500 dark:border-green-600" : ""}`}
                autoComplete="new-password"
              />
            </div>
            {watchedPassword && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Siła hasła:</span>
                  <span
                    className={
                      passwordStrength.strength >= 4
                        ? "text-green-600 dark:text-green-500 font-medium"
                        : passwordStrength.strength >= 2
                          ? "text-yellow-600 dark:text-yellow-500 font-medium"
                          : "text-red-600 dark:text-red-500 font-medium"
                    }
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex gap-1 h-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`flex-1 rounded ${
                        passwordStrength.strength >= level
                          ? passwordStrength.strength >= 4
                            ? "bg-green-500 dark:bg-green-600"
                            : passwordStrength.strength >= 2
                              ? "bg-yellow-500 dark:bg-yellow-600"
                              : "bg-red-500 dark:bg-red-600"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            {errors.password && (
              <p id="password-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
                {errors.password.message}
              </p>
            )}
            {touchedFields.password && !errors.password && passwordStrength.strength >= 4 && (
              <p className="text-xs text-green-600 dark:text-green-500">✓ Hasło spełnia wymagania</p>
            )}
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              Potwierdź hasło <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                aria-invalid={errors.confirmPassword ? "true" : "false"}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                placeholder="Powtórz hasło"
                className={`pl-10 ${touchedFields.confirmPassword && !errors.confirmPassword && watchedConfirmPassword && watchedPassword === watchedConfirmPassword ? "border-green-500 dark:border-green-600" : ""}`}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="text-sm text-destructive animate-in slide-in-from-top-1"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
            {touchedFields.confirmPassword &&
              !errors.confirmPassword &&
              watchedConfirmPassword &&
              watchedPassword === watchedConfirmPassword && (
                <p className="text-xs text-green-600 dark:text-green-500">✓ Hasła są identyczne</p>
              )}
          </div>

          {/* Password Requirements Info */}
          <Alert variant="default">
            <AlertDescription className="text-xs">
              <strong>Wymagania dotyczące hasła:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li>Co najmniej 8 znaków</li>
                <li>Co najmniej jedna wielka litera</li>
                <li>Co najmniej jedna mała litera</li>
                <li>Co najmniej jedna cyfra</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 mt-4">
          <Button type="submit" disabled={isSubmitting} className="w-full min-h-[44px]">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Aktualizowanie...
              </>
            ) : (
              "Zmień hasło"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
