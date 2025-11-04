import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { useResetPasswordForm } from "@/lib/hooks/useResetPasswordForm";

/**
 * ResetPasswordForm - Component for password reset
 * Handles form fields, validation, and submission
 */
export function ResetPasswordForm() {
  const { form, isSubmitting, onSubmit, isSuccess } = useResetPasswordForm();

  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
  } = form;

  const watchedEmail = watch("email");

  // Show success message instead of form
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Link wysłany</CardTitle>
          <CardDescription>Sprawdź swoją skrzynkę pocztową</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="default">
            <CheckCircle2 className="size-4" />
            <AlertDescription>
              Link do resetowania hasła został wysłany na adres <strong>{watchedEmail}</strong>. Sprawdź swoją skrzynkę
              pocztową i kliknij link, aby zresetować hasło.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/auth/login")}>
            Powrót do logowania
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Resetuj hasło</CardTitle>
        <CardDescription>Wprowadź adres e-mail, aby otrzymać link do resetowania hasła</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Adres e-mail <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="twoj@email.pl"
                className={`pl-10 ${touchedFields.email && !errors.email && watchedEmail ? "border-green-500 dark:border-green-600" : ""}`}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
                {errors.email.message}
              </p>
            )}
            {touchedFields.email && !errors.email && watchedEmail && (
              <p className="text-xs text-green-600 dark:text-green-500">✓ Poprawny format e-mail</p>
            )}
          </div>

          {/* Info Alert */}
          <Alert variant="default">
            <AlertDescription className="text-xs">
              Po wysłaniu formularza otrzymasz e-mail z linkiem do resetowania hasła. Link będzie ważny przez określony
              czas.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              "Wyślij link resetujący"
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Pamiętasz hasło?{" "}
            <a href="/auth/login" className="text-primary hover:underline">
              Zaloguj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
