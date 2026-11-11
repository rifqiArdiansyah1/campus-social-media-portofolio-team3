export type AppTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  PortfolioTab: undefined;
  ProfileTab: { userId?: number } | undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  CreatePost: undefined;
  ModerationQueue: undefined;
  UserProfile: { userId: number };
};
