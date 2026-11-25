import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ShieldAlert, UserCheck, RefreshCw } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import { getInitials } from '../../utils/formatting';
import { EmptyState } from '../common/EmptyState';
import { SOCIAL_QUERY_KEYS, invalidateSocialGraph } from '../../utils/socialSync';

export interface BlockedUserItem {
  block_id: number;
  blocked_id: number;
  nama: string;
  jurusan?: string | null;
  angkatan?: number | null;
  alasan?: string | null;
  created_at: string;
}

export interface BlockedListResponse {
  items: BlockedUserItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface BlockedUsersModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectUser?: (userId: number) => void;
}

export function BlockedUsersModal({
  visible,
  onClose,
  onSelectUser,
}: BlockedUsersModalProps) {
  const queryClient = useQueryClient();
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: SOCIAL_QUERY_KEYS.BLOCKS,
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get<BlockedListResponse>('/blocks', {
        params: { page: pageParam, limit: 20 },
      });
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: visible,
  });

  const unblockMutation = useMutation({
    mutationFn: async (blockedId: number) => {
      await apiClient.delete(`/blocks/${blockedId}`);
      return blockedId;
    },
    onSuccess: async (_, blockedId) => {
      setFeedbackMessage('Blokir berhasil dibuka.');
      setTimeout(() => setFeedbackMessage(null), 3500);
      await invalidateSocialGraph(queryClient, { targetUserId: blockedId });
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || err?.message || 'Gagal membuka blokir.';
      Alert.alert('Gagal Membuka Blokir', typeof detail === 'string' ? detail : 'Terjadi kesalahan sistem.');
    },
  });

  const handleConfirmUnblock = (user: BlockedUserItem) => {
    Alert.alert(
      `Buka Blokir ${user.nama}?`,
      'Pengguna ini akan dapat melihat linimasa karya dan profil publik Anda kembali (kecuali jika pengguna tersebut juga memblokir Anda).\n\nPertemanan tidak dipulihkan secara otomatis (Bukan Teman).\n\nPihak yang bersangkutan tidak akan menerima pemberitahuan.\n\nAnda dapat memblokir kembali kapan saja.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Buka Blokir',
          style: 'default',
          onPress: () => unblockMutation.mutate(user.blocked_id),
        },
      ]
    );
  };

  const allItems = data?.pages.flatMap((page) => page.items) || [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <ShieldAlert size={20} color={colors.primary} />
            <Text style={styles.headerTitle}>Pengguna yang Diblokir</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Tutup daftar blokir"
          >
            <X size={20} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Feedback Banner (Non-blocking Snackbar) */}
        {Boolean(feedbackMessage) && (
          <View style={styles.feedbackBanner} accessibilityLiveRegion="polite">
            <UserCheck size={16} color={colors.matchEmeraldText} />
            <Text style={styles.feedbackText}>{feedbackMessage}</Text>
          </View>
        )}

        {/* Body / List */}
        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Memuat daftar blokir...</Text>
          </View>
        ) : allItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={<ShieldAlert size={40} color={colors.onSurfaceVariant} />}
              title="Tidak Ada Akun Diblokir"
              description="Anda tidak sedang membatasi atau memblokir mahasiswa mana pun."
            />
          </View>
        ) : (
          <FlatList
            data={allItems}
            keyExtractor={(item) => String(item.block_id || item.blocked_id)}
            contentContainerStyle={styles.listContent}
            refreshing={isRefetching}
            onRefresh={refetch}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.3}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                <TouchableOpacity
                  style={styles.userInfoRow}
                  activeOpacity={onSelectUser ? 0.7 : 1}
                  onPress={() => onSelectUser && onSelectUser(item.blocked_id)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.nama)}</Text>
                  </View>
                  <View style={styles.userMeta}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {item.nama}
                    </Text>
                    {Boolean(item.jurusan) && (
                      <Text style={styles.userSub} numberOfLines={1}>
                        {item.jurusan}
                        {Boolean(item.angkatan) && ` • Angkatan ${item.angkatan}`}
                      </Text>
                    )}
                    {Boolean(item.alasan) && (
                      <Text style={styles.reasonText} numberOfLines={1}>
                        Alasan: {item.alasan}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.unblockBtn}
                  onPress={() => handleConfirmUnblock(item)}
                  disabled={unblockMutation.isPending}
                  accessibilityLabel={`Buka blokir untuk ${item.nama}`}
                >
                  <Text style={styles.unblockBtnText}>Buka Blokir</Text>
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : undefined
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surfaceCanvas,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: '#FFFFFF',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  feedbackText: {
    fontSize: 13,
    color: colors.matchEmeraldText,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  userSub: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#94A3B8',
    marginTop: 2,
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceCanvas,
  },
  unblockBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
