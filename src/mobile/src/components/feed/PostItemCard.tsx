import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Flag, Users, Clock } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { PostDetailResponse } from '../../api/types';
import { formatRelativeTime, getInitials } from '../../utils/formatting';
import { Badge } from '../common/Badge';
import { SkillTagChip } from './SkillTagChip';

export interface PostItemCardProps {
  post: PostDetailResponse;
  onPressAuthor?: (userId: number) => void;
  onReport?: (postId: number) => void;
}

export function PostItemCard({ post, onPressAuthor, onReport }: PostItemCardProps) {
  const authorName = post.author?.nama || 'Pengguna Kampus';
  const authorProdi = post.author?.jurusan || 'Mahasiswa';
  const isRecruiting = post.tipe === 'cari_anggota';

  return (
    <View style={styles.card}>
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
      {Boolean(post.gambar_url) && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: post.gambar_url! }}
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

      {/* Card Footer: Moderation Report button */}
      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => onReport?.(post.post_id)}
          style={styles.reportBtn}
        >
          <Flag size={14} color="#94A3B8" />
          <Text style={styles.reportText}>Laporkan</Text>
        </TouchableOpacity>
      </View>
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
});
