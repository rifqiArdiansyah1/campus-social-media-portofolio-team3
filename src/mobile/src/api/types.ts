import { components } from './types.generated';

export type Schemas = components['schemas'];

// Auth & Users
export type LoginRequest = Schemas['LoginRequest'];
export type RegisterRequest = Schemas['RegisterRequest'];
export type TokenResponse = Schemas['TokenResponse'];
export type MyProfileResponse = Schemas['MyProfileResponse'];
export type UserProfileResponse = Schemas['UserProfileResponse'];
export type PublicProfileResponse = Schemas['PublicProfileResponse'];
export type UpdateProfileRequest = Schemas['UpdateProfileRequest'];
export type UserRole = 'mahasiswa' | 'moderator' | 'admin';

// Posts & Feeds
export type PostFeedResponse = Schemas['PostFeedResponse'];
export type PostDetailResponse = Schemas['PostDetailResponse'];
export type PostCreate = Schemas['PostCreate'];
export type PostSkillTagResponse = Schemas['PostSkillTagResponse'];

// Portfolio & SKPI
export type PortfolioPublicResponse = Schemas['PortfolioPublicResponse'];
export type PortfolioDetailResponse = Schemas['PortfolioDetailResponse'];
export type PortfolioCreate = Schemas['PortfolioCreate'];
export type SkpiSummaryResponse = Schemas['SkpiSummaryResponse'];
export type PortfolioReviewRequest = Schemas['PortfolioReviewRequest'];

// Search & Recommendations
export type SearchResponse = Schemas['SearchResponse'];
export type StudentSearchResult = Schemas['StudentSearchResult'];
export type PostSearchResult = Schemas['PostSearchResult'];
export type PortfolioSearchResult = Schemas['PortfolioSearchResult'];
export type RecommendationResponse = Schemas['RecommendationResponse'];
export type RecommendationItem = Schemas['RecommendationItem'];

// Dashboard
export type DashboardSummaryResponse = Schemas['DashboardSummaryResponse'];
export type StudentDashboardSummary = Schemas['StudentDashboardSummary'];
export type ModeratorDashboardSummary = Schemas['ModeratorDashboardSummary'];
export type AdminDashboardSummary = Schemas['AdminDashboardSummary'];

// Moderation & Review
export type ModerationQueueItemResponse = Schemas['ModerationQueueItemResponse'];
export type ReviewQueueItemResponse = Schemas['ReviewQueueItemResponse'];
export type ReviewQueueListResponse = Schemas['ReviewQueueListResponse'];
export type ReportResponse = Schemas['ReportResponse'];

// Friendships & Blocks
export type FriendshipResponse = Schemas['FriendshipResponse'];
export type FriendListResponse = Schemas['FriendListResponse'];
export type UserBlockResponse = Schemas['UserBlockResponse'];

// Notifications
export type NotificationResponse = Schemas['NotificationResponse'];
export type UnreadCountResponse = Schemas['UnreadCountResponse'];
