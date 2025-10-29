import type { APIRoute } from "astro";
import { AIService } from "../../../../lib/ai.service";
import { ProjectService } from "../../../../lib/project.service";
import { generateProjectAISchema } from "../../../../lib/validators/project.validators";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import type { GenerateProjectAIResponse } from "../../../../types";

export const POST: APIRoute = async ({ request, locals, params }) => {
  const MAX_QUERIES_PER_PROJECT = 5;

  try {
    const projectId = params.id;
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const parseResult = generateProjectAISchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
      return new Response(JSON.stringify({ error: "Invalid request", details: errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { fileLinks } = parseResult.data;

    const projectService = new ProjectService(locals.supabase);
    const aiService = new AIService();

    let project;
    try {
      // Fetch all projects and find the specific one
      const { projects } = await projectService.fetchUserProjects(DEFAULT_USER_ID, {});
      project = projects.find((p) => p.id === projectId);

      if (!project) {
        return new Response(JSON.stringify({ error: "Project not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch project" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      const { count } = await locals.supabase
        .from("ai_queries")
        .select("id", { count: "exact" })
        .eq("project_id", projectId)
        .is("deleted_at", null);

      if (count !== null && count >= MAX_QUERIES_PER_PROJECT) {
        return new Response(
          JSON.stringify({ error: `AI limit reached (${MAX_QUERIES_PER_PROJECT} queries per project)` }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } catch (error) {
      console.error("Error checking query limit:", error);
      return new Response(JSON.stringify({ error: "Failed to check query limit" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let filesContent: string[];
    try {
      filesContent = await aiService.fetchFilesFromGitHub(fileLinks);
    } catch (error) {
      console.error("Error fetching files:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(JSON.stringify({ error: `Failed to fetch files: ${errorMessage}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let aiResponse;
    try {
      aiResponse = await aiService.callOpenrouterAI(filesContent);
      const parsedResponse = aiService.parseAIResponse(aiResponse);
      aiResponse = parsedResponse;
    } catch (error) {
      console.error("Error calling AI service:", error);
      return new Response(JSON.stringify({ error: "Failed to generate AI response" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
        return new Response(JSON.stringify({ error: "Failed to log AI query" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      console.error("Error inserting ai_query:", error);
      return new Response(JSON.stringify({ error: "Failed to log AI query" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      await projectService.updateProject(
        projectId,
        {
          description: aiResponse.description,
          technologies: aiResponse.technologies,
        },
        DEFAULT_USER_ID
      );
    } catch (error) {
      console.error("Error updating project:", error);
      // Extract error code if it's a custom error
      if (error && typeof error === "object" && "code" in error) {
        const err = error as { code: number; message: string };
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.code,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to update project" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response: GenerateProjectAIResponse = {
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Ensure this route is not pre-rendered
export const prerender = false;
