import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import type { ResetPasswordDto, ResetPasswordResponseDto, AuthErrorResponseDto } from "../../../types.ts";

// Zod schema for reset password validation
const resetPasswordSchema = z.object({
  email: z.string().min(1, "Adres e-mail jest wymagany").email("Nieprawidłowy format e-mail"),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: validationResult.error.errors[0]?.message ?? "Nieprawidłowe dane wejściowe",
        } as AuthErrorResponseDto),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email }: ResetPasswordDto = validationResult.data;

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Check if account is locked before allowing password reset
    try {
      // Use RPC function to check if account is locked
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lockStatus, error: rpcError } = await (supabase.rpc as any)("check_account_locked", {
        user_email: email,
      });

      if (!rpcError && lockStatus) {
        const isLocked = lockStatus.locked === true;

        if (isLocked) {
          return new Response(
            JSON.stringify({
              error:
                "Konto zostało zablokowane. Skontaktuj się z administratorem, aby odblokować konto przed resetowaniem hasła.",
            } as AuthErrorResponseDto),
            {
              status: 403,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      } else if (rpcError) {
        // Log RPC error but continue (don't block reset for technical issues)
        console.error("Error checking account lock status:", rpcError);
      }
    } catch (checkError) {
      // If check fails, log but continue (don't block reset for technical issues)
      console.error("Error checking account lock status:", checkError);
    }

    // Get the base URL from the request to construct redirect URL
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const redirectTo = `${baseUrl}/auth/update-password`;

    // Send password reset email using Supabase
    // Always return success for security (don't reveal if email exists)
    console.log(redirectTo);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      // Log error but still return success for security
      console.error("Error sending reset password email:", error);
    }

    // Always return success to prevent email enumeration attacks
    return new Response(
      JSON.stringify({
        success: true,
      } as ResetPasswordResponseDto),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas wysyłania linku resetującego hasło. Spróbuj ponownie.",
      } as AuthErrorResponseDto),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
