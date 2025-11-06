import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, Shield, CheckCircle2 } from "lucide-react";
import { useUpdatePasswordForm } from "@/lib/hooks/useUpdatePasswordForm";
import { toast } from "sonner";

/**
 * UpdatePasswordForm - Component for updating password after reset link click
 * Handles form fields, validation, and submission
 * Reuses password validation logic from registration
 */
export function UpdatePasswordForm() {
  const { form, isSubmitting, onSubmit, isSuccess } = useUpdatePasswordForm();
  const [isVerifyingToken, setIsVerifyingToken] = React.useState(true);

  // All hooks must be called before any early returns
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
    watch,
  } = form;

  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  // Check password strength (same logic as RegisterForm)
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

  // Handle recovery token from URL hash (PKCE flow) via API endpoint
  React.useEffect(() => {
    const handleRecoveryToken = async () => {
      try {
        // Check for code in URL hash (PKCE flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const code = hashParams.get("code");
        const type = hashParams.get("type");

        // Also check query params as fallback
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");
        const tokenType = urlParams.get("type");
        console.log(hashParams, urlParams);
        if ((code && type === "recovery") || (token && tokenType === "recovery")) {
          // Exchange token/code for session via API endpoint (server-side)
          const response = await fetch("/api/auth/exchange-recovery-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: code || null,
              token: token || null,
              type: type || tokenType || "recovery",
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage =
              errorData.error || "Nieprawidłowy lub wygasły link resetujący hasło. Spróbuj ponownie.";
            toast.error(errorMessage);
            setTimeout(() => {
              window.location.href = "/auth/reset-password";
            }, 2000);
            return;
          }

          // Token exchanged successfully, remove hash/token from URL
          window.history.replaceState(null, "", window.location.pathname);
          setIsVerifyingToken(false);
          return;
        }

        // No token found - check if user already has session via API
        const sessionResponse = await fetch("/api/auth/check-session", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (sessionResponse.ok) {
          setIsVerifyingToken(false);
          return;
        }

        // No session found
        toast.error("Brak aktywnej sesji. Spróbuj ponownie zresetować hasło.");
        setTimeout(() => {
          window.location.href = "/auth/reset-password";
        }, 2000);
      } catch (error) {
        console.error("Error handling recovery token:", error);
        toast.error("Wystąpił błąd podczas przetwarzania linku resetującego hasło.");
        setTimeout(() => {
          window.location.href = "/auth/reset-password";
        }, 2000);
      }
    };

    handleRecoveryToken();
  }, []);

  // Show loading state while verifying token
  if (isVerifyingToken) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
          <p className="text-center text-sm text-muted-foreground">Weryfikowanie linku resetującego hasło...</p>
        </CardContent>
      </Card>
    );
  }

  // Show success message instead of form
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Hasło zaktualizowane</CardTitle>
          <CardDescription>Twoje hasło zostało pomyślnie zmienione</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="default">
            <CheckCircle2 className="size-4" />
            <AlertDescription>Hasło zostało pomyślnie zaktualizowane.</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/projects")}>
            Przejdź do strony głównej
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Ustaw nowe hasło</CardTitle>
        <CardDescription>Wprowadź nowe hasło dla swojego konta</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Password Input */}
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
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Aktualizowanie...
              </>
            ) : (
              "Zaktualizuj hasło"
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
