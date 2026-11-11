import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ShieldCheck, ShieldAlert, Check, X, ArrowLeft, FileCheck, MessageSquare } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import {
  ModerationQueueItemResponse,
  ReportResponse,
  ReviewQueueItemResponse,
  ReviewQueueListResponse,
} from '../../api/types';
import { formatRelativeTime } from '../../utils/formatting';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';

export interface ModerationQueueScreenProps {
  onBack: () => void;
}

type StaffTab = 'posts' | 'reports' | 'portfolio';

export function ModerationQueueScreen({ onBack }: ModerationQueueScreenProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<StaffTab>('posts');

  // 1. Fetch Pending Posts
  const {
    data: pendingPosts,
    isLoading: isLoadingPosts,
    refetch: refetchPosts,
    isRefetching: isRefetchingPosts,
  } = useQuery<ModerationQueueItemResponse[]>({
    queryKey: ['moderation', 'queue'],
    queryFn: async () => {
      const res = await apiClient.get<ModerationQueueItemResponse[]>('/moderation/queue');
      return res.data;
    },
    enabled: activeTab === 'posts',
    staleTime: 15 * 1000,
  });

  // 2. Fetch Incoming Reports
  const {
    data: reports,
    isLoading: isLoadingReports,
    refetch: refetchReports,
    isRefetching: isRefetchingReports,
  } = useQuery<ReportResponse[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      const res = await apiClient.get<ReportResponse[]>('/reports');
      return res.data;
    },
    enabled: activeTab === 'reports',
    staleTime: 15 * 1000,
  });

  // 3. Fetch Portfolio Review Queue
  const {
    data: portfolioReviews,
    isLoading: isLoadingPortfolio,
    refetch: refetchPortfolio,
    isRefetching: isRefetchingPortfolio,
  } = useQuery<ReviewQueueListResponse>({
    queryKey: ['portfolio', 'review-queue'],
    queryFn: async () => {
      const res = await apiClient.get<ReviewQueueListResponse>('/portfolio/review-queue');
      return res.data;
    },
    enabled: activeTab === 'portfolio',
    staleTime: 15 * 1000,
  });

  // 4. Decision Mutation on Post
  const postDecisionMutation = useMutation({
    mutationFn: async ({ postId, decision, note }: { postId: number; decision: any; note?: string }) => {
      await apiClient.post(`/moderation/${postId}/decision`, {
        keputusan: decision,
        catatan: note || (decision === 'setujui' ? 'Disetujui oleh staf' : 'Ditolak melanggar pedoman'),
      });
    },
    onSuccess: () => {
      Alert.alert('Keputusan Diterapkan', 'Status postingan berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['moderation'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
    onError: (err: any) => {
      Alert.alert('Gagal Memproses', err?.message || 'Terjadi kesalahan sistem.');
    },
  });

  // 5. Portfolio Review Decision Mutation
  const portfolioReviewMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: 'terverifikasi' | 'ditolak'; note?: string }) => {
      await apiClient.post(`/portfolio/${id}/review`, {
        status_verifikasi: status,
        catatan_verifikasi: note || (status === 'terverifikasi' ? 'Dokumen bukti valid' : 'Dokumen tidak sesuai'),
      });
    },
    onSuccess: () => {
      Alert.alert('Verifikasi Selesai', 'Portofolio mahasiswa telah diproses.');
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
    },
    onError: (err: any) => {
      Alert.alert('Gagal Memproses', err?.message || 'Terjadi kesalahan sistem.');
    },
  });

  const renderPostItem = ({ item }: { item: ModerationQueueItemResponse }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.authorName}>{item.author_name || 'Mahasiswa'}</Text>
          <Text style={styles.prodiText}>{item.author_jurusan || 'Prodi'}</Text>
        </View>
        <Badge
          label={item.label_ai || item.status}
          variant={item.label_ai === 'aman' ? 'success' : 'warning'}
        />
      </View>

      <Text style={styles.contentText}>{item.isi}</Text>

      <View style={styles.actionButtonsRow}>
        <Button
          title="Tolak Konten"
          variant="outline"
          size="sm"
          onPress={() =>
            postDecisionMutation.mutate({
              postId: item.post_id,
              decision: 'tolak',
              note: 'Konten tidak memenuhi etika akademik kampus',
            })
          }
          icon={<X size={14} color={colors.primary} />}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button
          title="Setujui Tayang"
          size="sm"
          onPress={() =>
            postDecisionMutation.mutate({
              postId: item.post_id,
              decision: 'setujui',
            })
          }
          icon={<Check size={14} color="#FFFFFF" />}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  const renderReportItem = ({ item }: { item: ReportResponse }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Badge label={item.kategori_laporan.toUpperCase()} variant="danger" />
        <Text style={styles.timeText}>{formatRelativeTime(item.created_at)}</Text>
      </View>

      <Text style={styles.reportReason}>Alasan: {item.alasan}</Text>
      <Text style={styles.reportPostSnippet}>Post ID: #{item.post_id}</Text>

      <View style={styles.actionButtonsRow}>
        <Button
          title="Takedown Post"
          variant="danger"
          size="sm"
          onPress={() =>
            postDecisionMutation.mutate({
              postId: item.post_id,
              decision: 'hapus_konten',
              note: `Dihapus berdasarkan laporan: ${item.alasan}`,
            })
          }
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  const renderPortfolioItem = ({ item }: { item: ReviewQueueItemResponse }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.authorName}>{item.author_nama}</Text>
          <Text style={styles.prodiText}>{item.author_jurusan || 'Mahasiswa'}</Text>
        </View>
        <Badge label={item.kategori.toUpperCase()} variant="info" />
      </View>

      <Text style={styles.portfolioTitle}>{item.judul}</Text>
      {Boolean(item.deskripsi) && (
        <Text style={styles.contentText}>{item.deskripsi}</Text>
      )}

      <View style={styles.actionButtonsRow}>
        <Button
          title="Tolak"
          variant="outline"
          size="sm"
          onPress={() =>
            portfolioReviewMutation.mutate({
              id: item.portfolio_id,
              status: 'ditolak',
              note: 'Dokumen bukti tidak terbaca / tidak lengkap',
            })
          }
          icon={<X size={14} color={colors.primary} />}
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button
          title="Verifikasi SKPI"
          size="sm"
          onPress={() =>
            portfolioReviewMutation.mutate({
              id: item.portfolio_id,
              status: 'terverifikasi',
            })
          }
          icon={<Check size={14} color="#FFFFFF" />}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel Moderasi & SKPI Staf</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'posts' && styles.tabItemActive]}
          onPress={() => setActiveTab('posts')}
        >
          <MessageSquare size={16} color={activeTab === 'posts' ? colors.primary : colors.onSurfaceVariant} />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
            Post Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'reports' && styles.tabItemActive]}
          onPress={() => setActiveTab('reports')}
        >
          <ShieldAlert size={16} color={activeTab === 'reports' ? colors.danger : colors.onSurfaceVariant} />
          <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
            Laporan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'portfolio' && styles.tabItemActive]}
          onPress={() => setActiveTab('portfolio')}
        >
          <FileCheck size={16} color={activeTab === 'portfolio' ? colors.primary : colors.onSurfaceVariant} />
          <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
            Review SKPI
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content List */}
      {activeTab === 'posts' && (
        <FlatList
          data={pendingPosts || []}
          keyExtractor={(item) => item.post_id.toString()}
          renderItem={renderPostItem}
          ListEmptyComponent={
            !isLoadingPosts ? (
              <EmptyState
                title="Tidak Ada Antrean Postingan"
                description="Seluruh postingan mahasiswa program studi Anda telah diverifikasi."
              />
            ) : (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            )
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingPosts}
              onRefresh={() => {
                refetchPosts();
              }}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {activeTab === 'reports' && (
        <FlatList
          data={reports || []}
          keyExtractor={(item) => item.report_id.toString()}
          renderItem={renderReportItem}
          ListEmptyComponent={
            !isLoadingReports ? (
              <EmptyState
                title="Tidak Ada Laporan Masuk"
                description="Komunitas aman. Belum ada konten yang dilaporkan pengguna."
              />
            ) : (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            )
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingReports}
              onRefresh={() => {
                refetchReports();
              }}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {activeTab === 'portfolio' && (
        <FlatList
          data={portfolioReviews?.items || []}
          keyExtractor={(item) => item.portfolio_id.toString()}
          renderItem={renderPortfolioItem}
          ListEmptyComponent={
            !isLoadingPortfolio ? (
              <EmptyState
                title="Tidak Ada Antrean Portofolio"
                description="Semua pengajuan dokumen SKPI mahasiswa program studi Anda telah dinilai."
              />
            ) : (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            )
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingPortfolio}
              onRefresh={() => {
                refetchPortfolio();
              }}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCanvas,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  prodiText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  contentText: {
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 20,
    marginBottom: 12,
  },
  portfolioTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 6,
  },
  reportReason: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dangerText,
    marginBottom: 4,
  },
  reportPostSnippet: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
});
