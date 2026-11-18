import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Flag, Users, Clock, ShieldAlert, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { PostDetailResponse } from '../../api/types';
import { formatRelativeTime, getInitials, resolveMediaUrl } from '../../utils/formatting';
import { Badge } from '../common/Badge';
import { SkillTagChip } from './SkillTagChip';

export interface PostItemCardProps {
  post: PostDetailResponse;
  onPressAuthor?: (userId: number) => void;
  onReport?: (postId: number) => void;
}

export function PostItemCard({ post, onPressAuthor, onReport }: PostItemCardProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const authorName = post.author?.nama || 'Pengguna Kampus';
  const authorProdi = post.author?.jurusan || 'Mahasiswa';
  const isRecruiting = post.tipe === 'cari_anggota';
  const resolvedImageUrl = resolveMediaUrl(post.gambar_url);

  // Option A: Collapsed placeholder card if post was reported by current user and not revealed
  if (post.reported_by_me && !isRevealed) {
    return (
      <View style={styles.shieldedCard}>
        <View style={styles.shieldedHeader}>
          <ShieldAlert size={18} color="#D97706" />
          <Text style={styles.shieldedTitle}>Postingan telah Anda laporkan</Text>
        </View>
        <Text style={styles.shieldedDesc}>
          Postingan ini disembunyikan sementara dari linimasa Anda dan sedang menunggu antrean peninjauan oleh moderator prodi.
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsRevealed(true)}
          style={styles.revealBtn}
          accessibilityRole="button"
          accessibilityLabel="Buka tampilan postingan yang dilaporkan"
        >
          <Eye size={14} color="#D97706" />
          <Text style={styles.revealBtnText}>Buka tampilan</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {/* Banner if reported but revealed */}
      {post.reported_by_me && isRevealed && (
        <View style={styles.shieldedBanner}>
          <View style={styles.shieldedBannerLeft}>
            <ShieldAlert size={14} color="#D97706" />
            <Text style={styles.shieldedBannerText} numberOfLines={1}>
              Postingan yang Anda laporkan
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsRevealed(false)}
            style={styles.hideAgainBtn}
            accessibilityRole="button"
            accessibilityLabel="Sembunyikan kembali postingan"
          >
            <EyeOff size={13} color="#D97706" />
            <Text style={styles.hideAgainText}>Sembunyikan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header: Author info & Recruiting badge */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPressAuthor?.(post.user_id)}
          style={styles.authorSection}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(authorName)}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName} numberOfLines={1}>
              {authorName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.authorProdi} numberOfLines={1}>
                {authorProdi}
              </Text>
              <Text style={styles.metaDot}>•</Text>
              <View style={styles.timeRow}>
                <Clock size={11} color={colors.onSurfaceVariant} />
                <Text style={styles.timeText}>{formatRelativeTime(post.created_at)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {isRecruiting && (
          <Badge
            label="Rekrutmen Tim"
            variant="recruiting"
            icon={<Users size={12} color={colors.recruitingCoralText} />}
          />
        )}
      </View>

      {/* Content text */}
      <Text style={styles.content}>{post.isi}</Text>

      {/* Media Image if present */}
      {Boolean(resolvedImageUrl) && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: resolvedImageUrl! }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        </View>
      )}

      {/* Skill Tags */}
      {Boolean(post.skills && post.skills.length > 0) && (
        <View style={styles.skillsWrapper}>
          {post.skills!.map((skill) => (
            <SkillTagChip key={skill.skill_id} skill={skill} />
          ))}
        </View>
      )}

      {/* Card Footer: Moderation Report button (only if can_report !== false) */}
      {(post.reported_by_me || post.can_report !== false) && (
        <View style={styles.footer}>
          {post.reported_by_me ? (
            <View style={styles.reportedBadge}>
              <ShieldAlert size={13} color="#D97706" />
              <Text style={styles.reportedBadgeText}>Dilaporkan</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => onReport?.(post.post_id)}
              style={styles.reportBtn}
              accessibilityRole="button"
              accessibilityLabel="Laporkan postingan ini"
            >
              <Flag size={14} color="#94A3B8" />
              <Text style={styles.reportText}>Laporkan</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 8,
    borderBottomColor: colors.surfaceCanvas,
    padding: 16,
  },
  shieldedCard: {
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 8,
    borderBottomColor: colors.surfaceCanvas,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  shieldedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  shieldedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  shieldedDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#B45309',
    marginBottom: 12,
  },
  revealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  revealBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  shieldedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  shieldedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  shieldedBannerText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  hideAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  hideAgainText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  authorProdi: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    maxWidth: 130,
  },
  metaDot: {
    marginHorizontal: 5,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  content: {
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.onSurface,
    marginBottom: 12,
  },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  reportText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  reportedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  reportedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
});
