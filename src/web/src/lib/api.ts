import axios from "axios";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface CandidateProfile {
  user_id: string;
  name: string;
  department: string;
  bio: string;
  skills: string[];
  interests: string[];
}

export interface RecommendationQuery {
  query_user_id: string;
  target_skills?: string[];
  project_description?: string;
  top_k?: number;
}

export const fetchRecommendations = async (query: RecommendationQuery) => {
  const response = await apiClient.post("/recommendations/match", query);
  return response.data;
};

export const checkModeration = async (postId: string, content: string) => {
  const response = await apiClient.post("/moderation/check", {
    post_id: postId,
    content: content,
  });
  return response.data;
};
