import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserPlus, Sparkles, ThumbsDown } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { RecommendationItem } from '../../api/types';
import { formatMatchScore, getInitials } from '../../utils/formatting';
import { Button } from '../common/Button';

export interface RecommendationCardProps {
  item: RecommendationItem;
  onAddFriend: (userId: number) => void;
  onDismissFeedback?: (recId: number) => void;
  onPressProfile?: (userId: number) => void;
  isAddingFriend?: boolean;
}

export function RecommendationCard({
  item,
  onAddFriend,
  onDismissFeedback,
  onPressProfile,
  isAddingFriend = false,
}: RecommendationCardProps) {
  const userIdNum = parseInt(item.user_id, 10);
  const name = item.name || 'Mahasiswa Kampus';
  const department = item.department || 'Mahasiswa';
  const matchPct = formatMatchScore(item.score);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => !isNaN(userIdNum) && onPressProfile?.(userIdNum)}
          style={styles.profileSection}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(name)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            <Text style={styles.department} numberOfLines={1}>
              {department}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.matchBadge}>
          <Sparkles size={12} color={colors.matchEmeraldText} />
          <Text style={styles.matchText}>{matchPct} Match</Text>
        </View>
      </View>

      {/* Skills */}
      {Boolean(item.complementary_skills && item.complementary_skills.length > 0) && (
        <View style={styles.skillsSection}>
          <Text style={styles.skillsLabel}>Skill Komplementer:</Text>
          <View style={styles.skillList}>
            {item.complementary_skills!.slice(0, 4).map((skill, idx) => (
              <View key={idx} style={styles.skillChip}>
                <Text style={styles.skillChipText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Tambah Teman"
          size="sm"
          onPress={() => !isNaN(userIdNum) && onAddFriend(userIdNum)}
          loading={isAddingFriend}
          icon={<UserPlus size={14} color="#FFFFFF" />}
          style={styles.addBtn}
        />
        {Boolean(item.rec_id && onDismissFeedback) && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onDismissFeedback?.(item.rec_id!)}
            style={styles.dismissBtn}
          >
            <ThumbsDown size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.dismissText}>Kurang Relevan</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  department: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.matchEmeraldBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.matchEmeraldText,
  },
  skillsSection: {
    marginBottom: 12,
  },
  skillsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    marginBottom: 6,
  },
  skillList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillChip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  skillChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.primaryContainer,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addBtn: {
    flex: 1,
    marginRight: 8,
  },
  dismissBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dismissText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
});
