export interface ProfileActionResolutionInput {
  isOwnProfile: boolean;
  canFriendship: boolean;
  canFriend?: boolean;
  canBlock?: boolean;
  canUnblock?: boolean;
  isMutualBlocked?: boolean;
}

export interface ProfileActionResolution {
  showUnblockBanner: boolean;
  showAddFriendButton: boolean;
  showBlockButton: boolean;
  showNeutralUnavailable: boolean;
}

export function resolveProfileActions(input: ProfileActionResolutionInput): ProfileActionResolution {
  if (input.isMutualBlocked) {
    return {
      showUnblockBanner: false,
      showAddFriendButton: false,
      showBlockButton: false,
      showNeutralUnavailable: true,
    };
  }

  if (input.isOwnProfile) {
    return {
      showUnblockBanner: false,
      showAddFriendButton: false,
      showBlockButton: false,
      showNeutralUnavailable: false,
    };
  }

  if (input.canUnblock) {
    return {
      showUnblockBanner: true,
      showAddFriendButton: false,
      showBlockButton: false,
      showNeutralUnavailable: false,
    };
  }

  return {
    showUnblockBanner: false,
    showAddFriendButton: Boolean(input.canFriendship && input.canFriend),
    showBlockButton: Boolean(input.canFriendship && input.canBlock),
    showNeutralUnavailable: false,
  };
}
