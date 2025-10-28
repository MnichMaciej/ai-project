import type { APIRoute } from "astro";
import { ProjectService } from "../../lib/project.service";
import { projectsQuerySchema, createProjectSchema } from "../../lib/validators/project.validators";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryResult = projectsQuerySchema.safeParse({
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
      sort: url.searchParams.get("sort"),
    });

    if (!queryResult.success) {
      return new Response(JSON.stringify({ error: "Invalid query parameters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize service and fetch projects
    const projectService = new ProjectService(locals.supabase);
    const response = await projectService.fetchUserProjects(DEFAULT_USER_ID, queryResult.data);

    return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error in GET /api/projects:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch projects" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST handler for creating a new project
 * Validates request body, creates project via service, and returns 201 Created
 * on success or appropriate error response on failure
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    // Validate request body against schema
    const parseResult = createProjectSchema.safeParse(body);
    if (!parseResult.success) {
      // Extract validation error messages
      const errors = parseResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
      return new Response(JSON.stringify({ error: "Invalid request body", details: errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize service and create project
    const projectService = new ProjectService(locals.supabase);
    const createdProject = await projectService.createProject(parseResult.data, DEFAULT_USER_ID);

    // Return 201 Created with the created project
    return new Response(JSON.stringify(createdProject), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/projects:", error);
    return new Response(JSON.stringify({ error: "Failed to create project" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
