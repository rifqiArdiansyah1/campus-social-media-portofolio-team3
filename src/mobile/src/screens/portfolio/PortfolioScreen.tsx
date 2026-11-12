import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Award, Plus, Filter, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import {
  PortfolioDetailResponse,
  SkpiSummaryResponse,
} from '../../api/types';
import { PortfolioItemCard } from '../../components/portfolio/PortfolioItemCard';
import { CreatePortfolioModal } from './CreatePortfolioModal';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';

export interface PortfolioScreenProps {
  onNavigateToDetail?: (portfolioId: number) => void;
}

type StatusFilter = 'all' | 'terverifikasi' | 'menunggu_review' | 'draft' | 'ditolak';

export function PortfolioScreen({ onNavigateToDetail }: PortfolioScreenProps) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch SKPI Summary
  const { data: skpiSummary, refetch: refetchSummary } = useQuery<SkpiSummaryResponse>({
    queryKey: ['portfolio', 'skpi-summary'],
    queryFn: async () => {
      const res = await apiClient.get<SkpiSummaryResponse>('/portfolio/skpi-summary');
      return res.data;
    },
    staleTime: 60 * 1000,
  });

  // 2. Fetch My Portfolio Items
  const {
    data: portfolioItems,
    isLoading,
    refetch: refetchItems,
    isRefetching,
  } = useQuery<PortfolioDetailResponse[]>({
    queryKey: ['portfolio', 'me', selectedStatus],
    queryFn: async () => {
      const params: any = { limit: 50 };
      if (selectedStatus !== 'all') {
        params.status_verifikasi = selectedStatus;
      }
      const res = await apiClient.get<PortfolioDetailResponse[]>('/portfolio/me', { params });
      return res.data;
    },
    staleTime: 30 * 1000,
  });

  // 3. Submit Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.post(`/portfolio/${id}/submit`);
    },
    onSuccess: () => {
      Alert.alert('Diajukan', 'Portofolio Anda telah diajukan ke Kaprodi untuk verifikasi SKPI.');
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
    onError: (err: any) => {
      Alert.alert('Gagal Mengajukan', err?.message || 'Terjadi kesalahan saat mengajukan portofolio.');
    },
  });

  const handleSubmitForReview = (id: number) => {
    Alert.alert(
      'Ajukan Verifikasi SKPI',
      'Apakah Anda yakin dokumen bukti sudah lengkap dan ingin diajukan ke Kaprodi?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ajukan Sekarang',
          onPress: () => submitReviewMutation.mutate(id),
        },
      ]
    );
  };

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Semua' },
    { key: 'terverifikasi', label: 'Terverifikasi' },
    { key: 'menunggu_review', label: 'Menunggu' },
    { key: 'draft', label: 'Draft' },
    { key: 'ditolak', label: 'Ditolak' },
  ];

  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      {/* SKPI Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <View style={styles.badgeCircle}>
            <Award size={24} color={colors.primary} />
          </View>
          <View style={styles.summaryTextGroup}>
            <Text style={styles.summaryLabel}>Total Poin SKPI Resmi</Text>
            <Text style={styles.totalPointsText}>{skpiSummary?.total_poin ?? 0}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <CheckCircle2 size={15} color={colors.matchEmeraldText} />
            <Text style={styles.statNumber}>
              {skpiSummary?.total_terverifikasi ?? 0}
            </Text>
            <Text style={styles.statLabel}>Terverifikasi</Text>
          </View>

          <View style={styles.statBox}>
            <Clock size={15} color={colors.warningText} />
            <Text style={styles.statNumber}>
              {skpiSummary?.menunggu_review ?? 0}
            </Text>
            <Text style={styles.statLabel}>Menunggu Review</Text>
          </View>
        </View>
      </View>

      {/* Action Add Button */}
      <Button
        title="+ Tambah Karya Portofolio"
        onPress={() => setIsModalOpen(true)}
        style={styles.addPortBtn}
      />

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {statusFilters.map((tab) => {
          const isActive = selectedStatus === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedStatus(tab.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={portfolioItems || []}
        keyExtractor={(item) => item.portfolio_id.toString()}
        renderItem={({ item }) => (
          <PortfolioItemCard
            item={item}
            onPress={() => onNavigateToDetail?.(item.portfolio_id)}
            onSubmitReview={handleSubmitForReview}
          />
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="Belum Ada Karya Portofolio"
              description="Catat prestasi lomba, sertifikasi keahlian, atau proyek aplikasi untuk mengumpulkan poin SKPI Anda!"
              actionTitle="Tambah Portofolio Sekarang"
              onAction={() => setIsModalOpen(true)}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetchItems();
              refetchSummary();
            }}
            tintColor={colors.primary}
          />
        }
      />

      {/* Modal Tambah Portofolio */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalOpen(false)}
      >
        <CreatePortfolioModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['portfolio'] });
          }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCanvas,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerWrapper: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTextGroup: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  totalPointsText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  statLabel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  addPortBtn: {
    marginBottom: 12,
  },
  filterScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
});
