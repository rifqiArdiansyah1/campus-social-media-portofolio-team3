import { apiClient } from "@/lib/api";
import { components } from "@/types/api.generated";

export type DashboardSummaryResponse = components["schemas"]["DashboardSummaryResponse"];
export type StudentDashboardSummary = components["schemas"]["StudentDashboardSummary"];
export type ModeratorDashboardSummary = components["schemas"]["ModeratorDashboardSummary"];
export type AdminDashboardSummary = components["schemas"]["AdminDashboardSummary"];
export type RecentPortfolioItemSummary = components["schemas"]["RecentPortfolioItemSummary"];

export async function getDashboardSummary(): Promise<DashboardSummaryResponse["summary"] | null> {
  const res = await apiClient.get<DashboardSummaryResponse>("/dashboard/summary");
  return res.data?.summary ?? null;
}
