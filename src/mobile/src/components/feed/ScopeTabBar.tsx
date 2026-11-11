import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export type FeedScope = 'all' | 'prodi' | 'friends' | 'recruiting';

export interface ScopeTabBarProps {
  activeScope: FeedScope;
  onChangeScope: (scope: FeedScope) => void;
  showProdi?: boolean;
  showFriends?: boolean;
}

export function ScopeTabBar({
  activeScope,
  onChangeScope,
  showProdi = true,
  showFriends = true,
}: ScopeTabBarProps) {
  const tabs: { key: FeedScope; label: string }[] = [
    { key: 'all', label: 'Semua' },
    ...(showProdi ? [{ key: 'prodi' as FeedScope, label: 'Prodi Saya' }] : []),
    ...(showFriends ? [{ key: 'friends' as FeedScope, label: 'Teman' }] : []),
    { key: 'recruiting', label: 'Rekrutmen' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeScope === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onChangeScope(tab.key)}
              activeOpacity={0.7}
              style={[styles.tab, isActive && styles.activeTab]}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerLow,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});
