import { describe, it, expect } from 'vitest';
import { resolveProfileActions } from '../utils/resolveProfileActions';

describe('resolveProfileActions Pure Function Tests', () => {
  it('renders unblock banner and hides add friend & block buttons when canUnblock is true', () => {
    const res = resolveProfileActions({
      isOwnProfile: false,
      canFriendship: true,
      canFriend: false,
      canBlock: false,
      canUnblock: true,
    });

    expect(res.showUnblockBanner).toBe(true);
    expect(res.showAddFriendButton).toBe(false);
    expect(res.showBlockButton).toBe(false);
    expect(res.showNeutralUnavailable).toBe(false);
  });

  it('renders Add Friend and Block buttons for normal unblocked peer student', () => {
    const res = resolveProfileActions({
      isOwnProfile: false,
      canFriendship: true,
      canFriend: true,
      canBlock: true,
      canUnblock: false,
    });

    expect(res.showUnblockBanner).toBe(false);
    expect(res.showAddFriendButton).toBe(true);
    expect(res.showBlockButton).toBe(true);
    expect(res.showNeutralUnavailable).toBe(false);
  });

  it('hides Add Friend button when canFriend is false (e.g. cooldown active or pending)', () => {
    const res = resolveProfileActions({
      isOwnProfile: false,
      canFriendship: true,
      canFriend: false,
      canBlock: true,
      canUnblock: false,
    });

    expect(res.showUnblockBanner).toBe(false);
    expect(res.showAddFriendButton).toBe(false);
    expect(res.showBlockButton).toBe(true);
  });

  it('renders neutral unavailable view on mutual block (HTTP 404)', () => {
    const res = resolveProfileActions({
      isOwnProfile: false,
      canFriendship: true,
      isMutualBlocked: true,
    });

    expect(res.showNeutralUnavailable).toBe(true);
    expect(res.showUnblockBanner).toBe(false);
    expect(res.showAddFriendButton).toBe(false);
    expect(res.showBlockButton).toBe(false);
  });

  it('hides all peer action buttons on own profile', () => {
    const res = resolveProfileActions({
      isOwnProfile: true,
      canFriendship: false,
    });

    expect(res.showUnblockBanner).toBe(false);
    expect(res.showAddFriendButton).toBe(false);
    expect(res.showBlockButton).toBe(false);
    expect(res.showNeutralUnavailable).toBe(false);
  });
});
