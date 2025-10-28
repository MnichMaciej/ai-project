import type { APIRoute } from "astro";
import { ProjectService } from "../../../lib/project.service";
import { updateProjectSchema } from "../../../lib/validators/project.validators";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

/**
 * GET handler for fetching a single project by ID
 * Returns 200 with project data or 404 if not found
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const projectId = params.id;
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectService = new ProjectService(locals.supabase);
    const { projects } = await projectService.fetchUserProjects(DEFAULT_USER_ID, {});

    const project = projects.find((p) => p.id === projectId);

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(project), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/projects/[id]:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch project" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * PATCH handler for updating an existing project by ID
 * Validates request body (partial update), verifies ownership, and returns 200 OK
 * with updated project on success or appropriate error response on failure
 */
export const PATCH: APIRoute = async ({ request, locals, params }) => {
  try {
    // Extract and validate project ID from URL parameter
    const projectId = params.id;
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body against update schema
    const parseResult = updateProjectSchema.safeParse(body);
    if (!parseResult.success) {
      // Extract validation error messages
      const errors = parseResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
      return new Response(JSON.stringify({ error: "Invalid update", details: errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize service and update project
    const projectService = new ProjectService(locals.supabase);
    const updatedProject = await projectService.updateProject(projectId, parseResult.data, DEFAULT_USER_ID);

    // Return 200 OK with updated project and meta information
    return new Response(
      JSON.stringify({
        ...updatedProject,
        meta: { message: "Project updated" },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Handle specific error types from service
    if (error && typeof error === "object" && "code" in error && "message" in error) {
      const err = error as { code: number; message: string };
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.code,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Error in PATCH /api/projects/[id]:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
