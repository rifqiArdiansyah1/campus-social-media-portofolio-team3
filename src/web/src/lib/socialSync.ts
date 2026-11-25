import { QueryClient } from "@tanstack/react-query";

export const SOCIAL_QUERY_KEYS = {
  BLOCKS: ["blocks"] as const,
  POSTS: ["posts"] as const,
  SEARCH: ["search"] as const,
  RECOMMENDATIONS: ["recommendations"] as const,
  DASHBOARD: ["dashboard", "summary"] as const,
  FRIENDSHIPS: ["friendships"] as const,
  NOTIFICATIONS: ["notifications"] as const,
  COMMENTS: ["comments"] as const,
  USER_PROFILE: (userId?: number) =>
    typeof userId === "number" && Number.isFinite(userId)
      ? (["user", userId] as const)
      : (["user"] as const),
};

export async function invalidateSocialGraph(
  queryClient: QueryClient,
  options?: { targetUserId?: number }
): Promise<void> {
  const promises: Promise<void>[] = [
    queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.BLOCKS }),
    queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.POSTS }),
    queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.SEARCH }),
    queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.RECOMMENDATIONS }),
    queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.DASHBOARD }),
    queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.FRIENDSHIPS }),
    queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.NOTIFICATIONS }),
    queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEYS.COMMENTS }),
  ];

  if (options?.targetUserId && Number.isFinite(options.targetUserId)) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: SOCIAL_QUERY_KEYS.USER_PROFILE(options.targetUserId),
      })
    );
  }

  await Promise.all(promises);
}
