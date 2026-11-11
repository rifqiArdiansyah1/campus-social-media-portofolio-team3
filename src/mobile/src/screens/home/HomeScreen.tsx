import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Plus, Bell, Shield, MessageSquarePlus } from 'lucide-react-native';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import {
  PostDetailResponse,
  PostFeedResponse,
  DashboardSummaryResponse,
  SkpiSummaryResponse,
  ModeratorDashboardSummary,
  AdminDashboardSummary,
} from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatting';
import { ScopeTabBar, FeedScope } from '../../components/feed/ScopeTabBar';
import { PostItemCard } from '../../components/feed/PostItemCard';
import { DashboardReviewAlert } from '../../components/home/DashboardReviewAlert';
import { StudentSkpiWidget } from '../../components/home/StudentSkpiWidget';
import { EmptyState } from '../../components/common/EmptyState';

export interface HomeScreenProps {
  onNavigateToCreatePost: () => void;
  onNavigateToCreatePortfolio: () => void;
  onNavigateToPortfolioTab: () => void;
  onNavigateToStaffQueue: () => void;
  onNavigateToUserProfile: (userId: number) => void;
}

export function HomeScreen({
  onNavigateToCreatePost,
  onNavigateToCreatePortfolio,
  onNavigateToPortfolioTab,
  onNavigateToStaffQueue,
  onNavigateToUserProfile,
}: HomeScreenProps) {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [activeScope, setActiveScope] = useState<FeedScope>('all');

  const isStaff = role === 'moderator' || role === 'admin';
  const isStudent = role === 'mahasiswa';
  const hasProdi = Boolean(user?.jurusan);

  // 1. Fetch Staff Queue Summary if moderator/admin
  const { data: dashboardSummary } = useQuery<DashboardSummaryResponse>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const res = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
      return res.data;
    },
    enabled: isStaff,
    staleTime: 60 * 1000,
  });

  // 2. Fetch Student SKPI Summary if mahasiswa
  const { data: skpiSummary } = useQuery<SkpiSummaryResponse>({
    queryKey: ['portfolio', 'skpi-summary'],
    queryFn: async () => {
      const res = await apiClient.get<SkpiSummaryResponse>('/portfolio/skpi-summary');
      return res.data;
    },
    enabled: isStudent,
    staleTime: 2 * 60 * 1000,
  });

  // 3. Infinite Keyset Feed Query
  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingFeed,
    refetch: refetchFeed,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['posts', activeScope],
    queryFn: async ({ pageParam }) => {
      const res = await apiClient.get<PostFeedResponse>('/posts', {
        params: {
          scope: activeScope,
          cursor: pageParam || undefined,
          limit: 10,
        },
      });
      return res.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 30 * 1000,
  });

  // Flatten posts from pages
  const posts: PostDetailResponse[] =
    feedData?.pages.flatMap((page) => page.items) || [];

  // Report post mutation
  const reportMutation = useMutation({
    mutationFn: async ({ postId, category, reason }: { postId: number; category: any; reason: string }) => {
      await apiClient.post('/reports', {
        post_id: postId,
        kategori_laporan: category,
        alasan: reason,
      });
    },
    onSuccess: () => {
      Alert.alert('Laporan Terkirim', 'Terima kasih, laporan Anda telah diterima tim moderasi.');
    },
    onError: (err: any) => {
      Alert.alert('Gagal Melaporkan', err?.message || 'Terjadi kesalahan saat mengirim laporan.');
    },
  });

  const handleReportPost = (postId: number) => {
    Alert.alert(
      'Laporkan Postingan',
      'Pilih kategori pelanggaran konten:',
      [
        {
          text: 'Spam / Iklan',
          onPress: () =>
            reportMutation.mutate({
              postId,
              category: 'spam',
              reason: 'Konten spam / promosi tidak berizin.',
            }),
        },
        {
          text: 'Ujaran Kebencian',
          onPress: () =>
            reportMutation.mutate({
              postId,
              category: 'ujaran_kebencian',
              reason: 'Konten memuat ujaran kebencian atau pelecehan.',
            }),
        },
        {
          text: 'Konten Tidak Pantas',
          onPress: () =>
            reportMutation.mutate({
              postId,
              category: 'konten_tidak_pantas',
              reason: 'Konten melanggar norma komunitas kampus.',
            }),
        },
        { text: 'Batal', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Extract staff metrics
  const staffSummary = isStaff ? (dashboardSummary as ModeratorDashboardSummary | AdminDashboardSummary | undefined) : undefined;
  const pendingPosts = staffSummary?.pending_posts || 0;
  const pendingReports = staffSummary?.pending_reports || 0;
  const pendingPortfolios = staffSummary?.pending_portfolio_reviews || 0;

  const renderHeader = () => (
    <View>
      {/* Top Banner Greeting */}
      <View style={styles.greetingBar}>
        <View style={styles.userInfoRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarInitials}>{getInitials(user?.nama)}</Text>
          </View>
          <View>
            <Text style={styles.greetingSubtitle}>Selamat Datang,</Text>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.nama || 'Mahasiswa'}
            </Text>
          </View>
        </View>

        {isStaff && (
          <TouchableOpacity
            style={styles.staffBadgeBtn}
            onPress={onNavigateToStaffQueue}
            activeOpacity={0.8}
          >
            <Shield size={16} color="#FFFFFF" />
            <Text style={styles.staffBadgeText}>Moderasi</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Staff Alert Banner */}
      {isStaff && (
        <DashboardReviewAlert
          pendingPosts={pendingPosts}
          pendingReports={pendingReports}
          pendingPortfolios={pendingPortfolios}
          onPressAction={onNavigateToStaffQueue}
        />
      )}

      {/* Student SKPI Points Banner */}
      {isStudent && Boolean(skpiSummary) && (
        <StudentSkpiWidget
          totalPoints={skpiSummary!.total_poin}
          totalVerified={skpiSummary!.total_terverifikasi}
          pendingReview={skpiSummary!.menunggu_review || 0}
          onPressView={onNavigateToPortfolioTab}
          onPressAdd={onNavigateToCreatePortfolio}
        />
      )}

      {/* Scope Filter Tabs */}
      <ScopeTabBar
        activeScope={activeScope}
        onChangeScope={setActiveScope}
        showProdi={hasProdi}
        showFriends={isStudent}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.post_id.toString()}
        renderItem={({ item }) => (
          <PostItemCard
            post={item}
            onPressAuthor={onNavigateToUserProfile}
            onReport={handleReportPost}
          />
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          !isLoadingFeed ? (
            <EmptyState
              title="Belum Ada Postingan"
              description={
                activeScope === 'friends'
                  ? 'Belum ada postingan dari teman Anda. Tambahkan teman di tab Jelajah!'
                  : activeScope === 'prodi'
                  ? 'Belum ada postingan dari rekan satu program studi Anda.'
                  : 'Jadilah yang pertama membagikan karya atau proyek di kampus!'
              }
              actionTitle={isStudent ? 'Buat Postingan Baru' : undefined}
              onAction={isStudent ? onNavigateToCreatePost : undefined}
            />
          ) : (
            <View style={styles.feedLoadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : undefined
        }
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetchFeed();
              if (isStaff) queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
              if (isStudent) queryClient.invalidateQueries({ queryKey: ['portfolio', 'skpi-summary'] });
            }}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
      />

      {/* FAB: Buat Postingan Baru (Mahasiswa) */}
      {isStudent && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={onNavigateToCreatePost}
        >
          <MessageSquarePlus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCanvas,
  },
  greetingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  greetingSubtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
    maxWidth: 200,
  },
  staffBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  staffBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 80,
  },
  feedLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
});
