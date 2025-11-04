import type { APIRoute } from "astro";

/**
 * GET handler for fetching query count for a project
 * Returns the count of active AI queries for the project
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Check if user is authenticated
    if (!locals.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectId = params.id;
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if project exists and belongs to user
    const { data: projectData, error: projectError } = await locals.supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", locals.user.id)
      .single();

    if (projectError || !projectData) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Count active AI queries for the project
    const { count, error: countError } = await locals.supabase
      .from("ai_queries")
      .select("id", { count: "exact" })
      .eq("project_id", projectId)
      .is("deleted_at", null);

    if (countError) {
      console.error("Error counting AI queries:", countError);
      return new Response(JSON.stringify({ error: "Failed to fetch query count" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        queryCount: count || 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/projects/[id]/ai-queries/count:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Ensure this route is not pre-rendered
export const prerender = false;
