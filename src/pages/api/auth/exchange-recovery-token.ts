import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";
import type { AuthErrorResponseDto } from "../../../types.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { code, token, type } = body;

    if (!code && !token) {
      return new Response(
        JSON.stringify({
          error: "Brak tokenu lub kodu do wymiany",
        } as AuthErrorResponseDto),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    let session = null;

    if (code && type === "recovery") {
      // Exchange code for session using PKCE flow
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("Error exchanging recovery code:", error);
        return new Response(
          JSON.stringify({
            error: "Nieprawidłowy lub wygasły link resetujący hasło. Spróbuj ponownie.",
          } as AuthErrorResponseDto),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      session = data.session;
    } else if (token && type === "recovery") {
      // Handle token_hash (non-PKCE flow)
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "recovery",
      });

      if (error) {
        console.error("Error verifying recovery token:", error);
        return new Response(
          JSON.stringify({
            error: "Nieprawidłowy lub wygasły link resetujący hasło. Spróbuj ponownie.",
          } as AuthErrorResponseDto),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      session = data.session;
    }

    if (!session) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się wymienić tokenu na sesję",
        } as AuthErrorResponseDto),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - session is now stored in cookies
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: session.user.id,
          email: session.user.email ?? "",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Exchange recovery token error:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas przetwarzania linku resetującego hasło.",
      } as AuthErrorResponseDto),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
