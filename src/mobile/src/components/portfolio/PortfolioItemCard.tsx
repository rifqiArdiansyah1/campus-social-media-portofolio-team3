import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FileText, ExternalLink, Calendar } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { PortfolioDetailResponse } from '../../api/types';
import { SkpiBadge } from './SkpiBadge';

export interface PortfolioItemCardProps {
  item: PortfolioDetailResponse;
  onPress?: () => void;
  onSubmitReview?: (id: number) => void;
}

export function PortfolioItemCard({
  item,
  onPress,
  onSubmitReview,
}: PortfolioItemCardProps) {
  const isDraft = item.status_verifikasi === 'draft';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.kategori.toUpperCase()}</Text>
        </View>
        <SkpiBadge status={item.status_verifikasi} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.judul}
      </Text>

      {Boolean(item.deskripsi) && (
        <Text style={styles.description} numberOfLines={2}>
          {item.deskripsi}
        </Text>
      )}

      <View style={styles.metaRow}>
        {Boolean(item.tanggal_terbit) && (
          <View style={styles.metaItem}>
            <Calendar size={13} color={colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{item.tanggal_terbit}</Text>
          </View>
        )}
        {item.has_file && (
          <View style={styles.metaItem}>
            <FileText size={13} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary }]}>Dokumen PDF</Text>
          </View>
        )}
      </View>

      {Boolean(item.catatan_verifikasi) && (
        <View style={styles.reviewNote}>
          <Text style={styles.reviewNoteLabel}>Catatan Review:</Text>
          <Text style={styles.reviewNoteText}>{item.catatan_verifikasi}</Text>
        </View>
      )}

      {isDraft && Boolean(onSubmitReview) && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => onSubmitReview?.(item.portfolio_id)}
          >
            <Text style={styles.submitBtnText}>Ajukan Verifikasi SKPI</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  reviewNote: {
    backgroundColor: colors.warningBg,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  reviewNoteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warningText,
  },
  reviewNoteText: {
    fontSize: 12,
    color: colors.warningText,
    marginTop: 2,
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
