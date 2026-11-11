import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Award, ChevronRight, Plus } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export interface StudentSkpiWidgetProps {
  totalPoints: number;
  totalVerified: number;
  pendingReview?: number;
  onPressView: () => void;
  onPressAdd: () => void;
}

export function StudentSkpiWidget({
  totalPoints,
  totalVerified,
  pendingReview = 0,
  onPressView,
  onPressAdd,
}: StudentSkpiWidgetProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPressView}
        style={styles.content}
      >
        <View style={styles.iconCircle}>
          <Award size={20} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Poin SKPI Resmi</Text>
            <ChevronRight size={16} color={colors.onSurfaceVariant} />
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.pointText}>{totalPoints} Poin</Text>
            <Text style={styles.subText}>
              • {totalVerified} karya terverifikasi
              {pendingReview > 0 ? ` (${pendingReview} review)` : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPressAdd}
        style={styles.addBtn}
      >
        <Plus size={16} color={colors.primary} />
        <Text style={styles.addBtnText}>Tambah Karya</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
  },
  pointText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  subText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
