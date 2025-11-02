/**
 * Helper function to fetch queryCount for a project
 * Fetches the count of active AI queries from the database
 */
export async function fetchProjectQueryCount(projectId: string): Promise<number> {
  try {
    const response = await fetch(`/api/projects/${projectId}/ai-queries/count`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      // If endpoint doesn't exist or error, return 0
      if (response.status === 404) {
        return 0;
      }
      console.warn("Failed to fetch query count, defaulting to 0");
      return 0;
    }

    const data = await response.json();
    return data.queryCount || 0;
  } catch (error) {
    console.error("Error fetching query count:", error);
    return 0;
  }
}
