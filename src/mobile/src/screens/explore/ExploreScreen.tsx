import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Sparkles, FileText, UserPlus, Users } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import {
  SearchResponse,
  RecommendationResponse,
  StudentSearchResult,
  PostSearchResult,
  PortfolioSearchResult,
} from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/formatting';
import { SearchBar } from '../../components/explore/SearchBar';
import { RecommendationCard } from '../../components/explore/RecommendationCard';
import { EmptyState } from '../../components/common/EmptyState';

export interface ExploreScreenProps {
  onNavigateToUserProfile: (userId: number) => void;
}

type SearchCategory = 'mahasiswa' | 'postingan' | 'portofolio';

export function ExploreScreen({ onNavigateToUserProfile }: ExploreScreenProps) {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('mahasiswa');
  const [pendingAddFriendIds, setPendingAddFriendIds] = useState<number[]>([]);

  const isStudent = role === 'mahasiswa';

  // 1. Search Query
  const { data: searchResults, isFetching: isSearching } = useQuery<SearchResponse>({
    queryKey: ['search', searchQuery, searchCategory],
    queryFn: async () => {
      const res = await apiClient.get<SearchResponse>('/search', {
        params: {
          q: searchQuery,
          tipe: searchCategory,
        },
      });
      return res.data;
    },
    enabled: searchQuery.trim().length >= 2,
    staleTime: 30 * 1000,
  });

  // 2. AI Collaborator Matchmaker Query (for students)
  const {
    data: recommendations,
    isLoading: isLoadingRecs,
    refetch: refetchRecs,
  } = useQuery<RecommendationResponse>({
    queryKey: ['recommendations', 'match'],
    queryFn: async () => {
      const res = await apiClient.post<RecommendationResponse>('/recommendations/match', {
        top_k: 5,
      });
      return res.data;
    },
    enabled: isStudent,
    staleTime: 5 * 60 * 1000,
  });

  // 3. Friendship Request Mutation
  const addFriendMutation = useMutation({
    mutationFn: async (targetUserId: number) => {
      await apiClient.post('/friendships', {
        addressee_id: targetUserId,
      });
      return targetUserId;
    },
    onMutate: (targetUserId) => {
      setPendingAddFriendIds((prev) => [...prev, targetUserId]);
    },
    onSuccess: () => {
      Alert.alert('Permintaan Terkirim', 'Permintaan pertemanan berhasil dikirimkan.');
      queryClient.invalidateQueries({ queryKey: ['recommendations', 'match'] });
    },
    onError: (err: any) => {
      Alert.alert('Gagal Mengirim Permintaan', err?.message || 'Terjadi kesalahan.');
    },
    onSettled: (_, __, targetUserId) => {
      setPendingAddFriendIds((prev) => prev.filter((id) => id !== targetUserId));
    },
  });

  // 4. Recommendation Feedback Mutation ("Kurang Relevan")
  const feedbackMutation = useMutation({
    mutationFn: async (recId: number) => {
      await apiClient.post(`/recommendations/${recId}/feedback`, {
        umpan_balik: 'tidak_relevan',
      });
    },
    onSuccess: () => {
      Alert.alert('Umpan Balik Dicatat', 'Rekomendasi kolaborator telah diperbarui.');
      refetchRecs();
    },
    onError: (err: any) => {
      Alert.alert('Gagal Mengirim Feedback', err?.message || 'Terjadi kesalahan.');
    },
  });

  const isSearchActive = searchQuery.trim().length >= 2;
  const searchItems = searchResults?.items || [];

  return (
    <View style={styles.container}>
      {/* Top Search Header */}
      <View style={styles.searchHeader}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Cari rekan, keahlian, karya..."
        />

        {isSearchActive && (
          <View style={styles.categoryTabs}>
            {(['mahasiswa', 'postingan', 'portofolio'] as SearchCategory[]).map((cat) => {
              const isActive = searchCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                  onPress={() => setSearchCategory(cat)}
                >
                  <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                    {cat === 'mahasiswa' ? 'Mahasiswa' : cat === 'postingan' ? 'Postingan' : 'Portofolio'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isSearchActive ? (
          /* Search Results View */
          <View>
            <Text style={styles.sectionHeader}>
              Hasil Pencarian: "{searchQuery}" ({searchCategory})
            </Text>

            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Mencari seluruh kampus...</Text>
              </View>
            ) : searchItems.length > 0 ? (
              <View style={styles.resultGroup}>
                {searchCategory === 'mahasiswa' &&
                  (searchItems as StudentSearchResult[]).map((student) => (
                    <TouchableOpacity
                      key={student.user_id}
                      style={styles.studentCard}
                      activeOpacity={0.7}
                      onPress={() => onNavigateToUserProfile(student.user_id)}
                    >
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>
                          {getInitials(student.nama)}
                        </Text>
                      </View>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.nama}</Text>
                        <Text style={styles.studentProdi}>
                          {student.jurusan || 'Mahasiswa'} {student.angkatan ? `• ${student.angkatan}` : ''}
                        </Text>
                        {Boolean(student.skills && student.skills.length > 0) && (
                          <View style={styles.studentSkillChips}>
                            {student.skills!.slice(0, 3).map((s, idx) => (
                              <Text key={idx} style={styles.studentSkillChip}>
                                #{s.nama}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}

                {searchCategory === 'postingan' &&
                  (searchItems as PostSearchResult[]).map((post) => (
                    <View key={post.post_id} style={styles.postSnippetCard}>
                      <Text style={styles.authorTitle}>{post.author_nama}</Text>
                      <Text style={styles.postSnippetText} numberOfLines={3}>
                        {post.isi}
                      </Text>
                    </View>
                  ))}

                {searchCategory === 'portofolio' &&
                  (searchItems as PortfolioSearchResult[]).map((item) => (
                    <View key={item.portfolio_id} style={styles.portfolioCard}>
                      <FileText size={18} color={colors.primary} />
                      <View style={styles.portfolioInfo}>
                        <Text style={styles.portfolioTitle}>{item.judul}</Text>
                        <Text style={styles.portfolioCategory}>
                          {item.kategori.toUpperCase()} • {item.author_nama}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            ) : (
              <EmptyState
                title="Tidak Ada Hasil Ditemukan"
                description={`Tidak menemukan data yang cocok dengan kata kunci "${searchQuery}". Coba kata kunci keahlian atau nama lain.`}
              />
            )}
          </View>
        ) : (
          /* Default Explore: AI Matchmaker */
          <View>
            {isStudent && (
              <View style={styles.aiSection}>
                <View style={styles.aiHeader}>
                  <View style={styles.aiBadge}>
                    <Sparkles size={14} color={colors.primary} />
                    <Text style={styles.aiBadgeText}>AI-1 MATCHMAKER</Text>
                  </View>
                  <Text style={styles.aiTitle}>Rekomendasi Rekan Kolaborator</Text>
                  <Text style={styles.aiSubtitle}>
                    Menganalisis kemiripan minat dan keahlian komplementer untuk proyek dan lomba Anda.
                  </Text>
                </View>

                {isLoadingRecs ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Menghitung kecocokan semantik...</Text>
                  </View>
                ) : (
                  <View>
                    {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
                      recommendations.recommendations.map((item) => (
                        <RecommendationCard
                          key={item.user_id}
                          item={item}
                          onAddFriend={(targetId) => addFriendMutation.mutate(targetId)}
                          onDismissFeedback={(recId) => feedbackMutation.mutate(recId)}
                          onPressProfile={onNavigateToUserProfile}
                          isAddingFriend={pendingAddFriendIds.includes(parseInt(item.user_id, 10))}
                        />
                      ))
                    ) : (
                      <EmptyState
                        title="Belum Ada Rekomendasi"
                        description="Lengkapi daftar keahlian dan minat di profil Anda agar AI dapat mencarikan kolaborator terbaik!"
                      />
                    )}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCanvas,
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  categoryTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
  },
  categoryTabActive: {
    backgroundColor: colors.primary,
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 14,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  aiSection: {
    marginBottom: 20,
  },
  aiHeader: {
    marginBottom: 16,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onSurface,
  },
  aiSubtitle: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  resultGroup: {
    marginBottom: 20,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  studentProdi: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  studentSkillChips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  studentSkillChip: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  authorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 4,
  },
  portfolioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  portfolioInfo: {
    flex: 1,
  },
  portfolioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  portfolioCategory: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  postSnippetCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  postSnippetText: {
    fontSize: 13,
    color: colors.onSurface,
    lineHeight: 18,
  },
});
