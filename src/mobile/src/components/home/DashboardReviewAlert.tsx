import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertCircle, ChevronRight, ShieldAlert, FileCheck, MessageSquare } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export interface DashboardReviewAlertProps {
  pendingPosts: number;
  pendingReports: number;
  pendingPortfolios: number;
  onPressAction: () => void;
}

export function DashboardReviewAlert({
  pendingPosts,
  pendingReports,
  pendingPortfolios,
  onPressAction,
}: DashboardReviewAlertProps) {
  const totalAlerts = pendingPosts + pendingReports + pendingPortfolios;

  if (totalAlerts === 0) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPressAction}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AlertCircle size={18} color={colors.warningText} />
          <Text style={styles.title}>Perhatian Staf: {totalAlerts} Antrean Menunggu</Text>
        </View>
        <ChevronRight size={18} color={colors.warningText} />
      </View>

      <View style={styles.chipsRow}>
        {pendingPosts > 0 && (
          <View style={styles.chip}>
            <MessageSquare size={12} color={colors.warningText} />
            <Text style={styles.chipText}>{pendingPosts} Post Pending</Text>
          </View>
        )}
        {pendingReports > 0 && (
          <View style={styles.chip}>
            <ShieldAlert size={12} color={colors.dangerText} />
            <Text style={[styles.chipText, { color: colors.dangerText }]}>
              {pendingReports} Laporan
            </Text>
          </View>
        )}
        {pendingPortfolios > 0 && (
          <View style={styles.chip}>
            <FileCheck size={12} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>
              {pendingPortfolios} SKPI
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.warningText,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.warningText,
  },
});
