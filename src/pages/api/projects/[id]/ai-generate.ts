import type { APIRoute } from "astro";
import { AIService } from "../../../../lib/ai.service";
import { ProjectService } from "../../../../lib/project.service";
import { generateProjectAISchema } from "../../../../lib/validators/project.validators";
import type { GenerateProjectAIResponse } from "../../../../types";
import {
  OpenRouterError,
  ValidationError,
  FallbackExhaustedError,
  LimitExceededError,
} from "../../../../lib/openrouter.service";
import { checkFeatureFlagDirectly, FeatureFlags } from "@/features";

export const POST: APIRoute = async ({ request, locals, params }) => {
  const MAX_QUERIES_PER_PROJECT = 5;

  // Sprawdź flagę bezpośrednio z bazy (za każdym razem) - API zawsze sprawdza aktualną wartość
  const isAIEnabled = await checkFeatureFlagDirectly(locals.supabase, FeatureFlags.AI_GENERATION);
  if (!isAIEnabled) {
    return new Response(
      JSON.stringify({
        success: false,
        description: "",
        technologies: [],
        error: "AI generation not available",
        queryCount: 0,
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Check if user is authenticated
    if (!locals.user?.id) {
      return new Response(
        JSON.stringify({
          success: false,
          description: "",
          technologies: [],
          error: "Unauthorized",
          queryCount: 0,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const projectId = params.id;
    if (!projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          description: "",
          technologies: [],
          error: "Project ID is required",
          queryCount: 0,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          description: "",
          technologies: [],
          error: "Invalid JSON in request body",
          queryCount: 0,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const parseResult = generateProjectAISchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
      return new Response(
        JSON.stringify({
          success: false,
          description: "",
          technologies: [],
          error: `Invalid request: ${errors.join(", ")}`,
          queryCount: 0,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { fileLinks, modelFallback = true } = parseResult.data;

    const projectService = new ProjectService(locals.supabase);
    const aiService = new AIService();

    let project;
    try {
      // Fetch all projects and find the specific one
      const { projects } = await projectService.fetchUserProjects(locals.user.id, {});
      project = projects.find((p) => p.id === projectId);

      if (!project) {
        return new Response(
          JSON.stringify({
            success: false,
            description: "",
            technologies: [],
            error: "Project not found",
            queryCount: 0,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      return new Response(
        JSON.stringify({
          success: false,
          description: "",
          technologies: [],
          error: "Failed to fetch project",
          queryCount: 0,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    try {
      const { count } = await locals.supabase
        .from("ai_queries")
        .select("id", { count: "exact" })
        .eq("project_id", projectId)
        .is("deleted_at", null);

      if (count !== null && count >= MAX_QUERIES_PER_PROJECT) {
        return new Response(
          JSON.stringify({
            success: false,
            description: "",
            technologies: [],
            error: `AI limit reached (${MAX_QUERIES_PER_PROJECT} queries per project)`,
            queryCount: count,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (error) {
      console.error("Error checking query limit:", error);
      return new Response(
        JSON.stringify({
          success: false,
          description: "",
          technologies: [],
          error: "Failed to check query limit",
          queryCount: 0,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let aiResponse: { description: string; technologies: string[] };
    try {
      // Use generateWithFallback instead of callOpenrouterAI
      aiResponse = await aiService.generateWithFallback(fileLinks, projectId, modelFallback);
    } catch (error) {
      console.error("Error calling AI service:", error);

      // Handle specific error types
      if (error instanceof FallbackExhaustedError) {
        return new Response(
          JSON.stringify({
            success: false,
            description: "",
            technologies: [],
            error: error.message,
            queryCount: 0,
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error instanceof LimitExceededError) {
        return new Response(
          JSON.stringify({
            success: false,
            description: "",
            technologies: [],
            error: error.message,
            queryCount: 0,
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error instanceof OpenRouterError) {
        const statusCode = error.statusCode || 500;
        const errorMessage =
          statusCode === 401
            ? "Invalid API key"
            : statusCode === 429
              ? "Rate limit exceeded. Please try again later."
              : statusCode >= 500
                ? "AI service is temporarily unavailable. Please try again later."
                : error.message || "Failed to generate AI response";

        return new Response(
          JSON.stringify({
            success: false,
            description: "",
            technologies: [],
            error: errorMessage,
            queryCount: 0,
          }),
          {
            status: statusCode === 429 ? 429 : statusCode >= 500 ? 503 : 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (error instanceof ValidationError) {
        return new Response(
          JSON.stringify({
            success: false,
            description: "",
            technologies: [],
            error: `Validation error: ${error.message}`,
            queryCount: 0,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Generic error handling
      const errorMessage = error instanceof Error ? error.message : "Failed to generate AI response";
      return new Response(
        JSON.stringify({
          success: false,
          description: "",
          technologies: [],
          error: errorMessage,
          queryCount: 0,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    let nextQueryNumber = 1;
    try {
      const { data: maxQueryRow } = await locals.supabase
        .from("ai_queries")
        .select("query_number")
        .eq("project_id", projectId)
        .is("deleted_at", null)
        .order("query_number", { ascending: false })
        .limit(1)
        .single();

      if (maxQueryRow) {
        nextQueryNumber = maxQueryRow.query_number + 1;
      }
    } catch (error) {
      // No existing queries is fine, query_number will be 1
      console.log("No existing queries found, starting with query_number=1");
    }

    try {
      const { error: insertError } = await locals.supabase.from("ai_queries").insert({
        project_id: projectId,
        query_number: nextQueryNumber,
        file_links: fileLinks,
        generated_description: aiResponse.description,
        generated_technologies: aiResponse.technologies,
      });

      if (insertError) {
        console.error("Database error inserting ai_query:", insertError);
        return new Response(
          JSON.stringify({
            success: false,
            description: "",
            technologies: [],
            error: "Failed to log AI query",
            queryCount: 0,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (error) {
      console.error("Error inserting ai_query:", error);
      return new Response(
        JSON.stringify({
          success: false,
          description: "",
          technologies: [],
          error: "Failed to log AI query",
          queryCount: 0,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      await projectService.updateProject(
        projectId,
        {
          description: aiResponse.description,
          technologies: aiResponse.technologies,
        },
        locals.user.id
      );
    } catch (error) {
      console.error("Error updating project:", error);
      // Extract error code if it's a custom error
      if (error && typeof error === "object" && "code" in error) {
        const err = error as { code: number; message: string };
        return new Response(
          JSON.stringify({
            success: false,
            description: "",
            technologies: [],
            error: err.message,
            queryCount: 0,
          }),
          {
            status: err.code,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return new Response(
        JSON.stringify({
          success: false,
          description: "",
          technologies: [],
          error: "Failed to update project",
          queryCount: 0,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    const response: GenerateProjectAIResponse = {
      success: true,
      description: aiResponse.description,
      technologies: aiResponse.technologies,
      queryCount: nextQueryNumber,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/projects/[id]/ai-generate:", error);
    return new Response(
      JSON.stringify({
        success: false,
        description: "",
        technologies: [],
        error: "Internal server error",
        queryCount: 0,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Ensure this route is not pre-rendered
export const prerender = false;
