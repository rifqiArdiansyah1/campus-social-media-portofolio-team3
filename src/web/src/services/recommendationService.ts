import { apiClient } from "@/lib/api";

export interface RecommendationItem {
  user_id: string;
  rec_id?: number | null;
  name?: string | null;
  department?: string | null;
  match_level?: string | null;
  score: number;
  matched_terms: string[];
  complementary_skills: string[];
  reason: string;
}

export interface RecommendationResponse {
  query_user_id: string;
  fallback: boolean;
  recommendations: RecommendationItem[];
}

export interface MatchRequestPayload {
  target_skills?: string[];
  target_skill_ids?: number[];
  project_description?: string;
  top_k?: number;
}

export interface FeedbackRequestPayload {
  umpan_balik: "relevan" | "tidak_relevan";
}

export async function getCollaboratorRecommendations(
  payload: MatchRequestPayload = {}
): Promise<RecommendationResponse> {
  const res = await apiClient.post<RecommendationResponse>("/recommendations/match", payload);
  return res.data;
}

export async function getRecommendationsForPost(
  postId: number,
  topK: number = 5
): Promise<RecommendationResponse> {
  const res = await apiClient.post<RecommendationResponse>(
    `/recommendations/for-post/${postId}`,
    {},
    { params: { top_k: topK } }
  );
  return res.data;
}

export async function submitRecommendationFeedback(
  recId: number,
  feedback: "relevan" | "tidak_relevan"
): Promise<{ detail: string; rec_id: number; umpan_balik: string }> {
  const res = await apiClient.post<{ detail: string; rec_id: number; umpan_balik: string }>(
    `/recommendations/${recId}/feedback`,
    { umpan_balik: feedback }
  );
  return res.data;
}
