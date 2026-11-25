import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  User,
  LogOut,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Mail,
  GraduationCap,
  Calendar,
  Globe,
  ArrowLeft,
  Edit3,
  Award,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  PublicProfileResponse,
  MyProfileResponse,
  SkpiSummaryResponse,
  PortfolioPublicResponse,
} from '../../api/types';
import { getInitials } from '../../utils/formatting';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { BlockedUsersModal } from '../../components/features/BlockedUsersModal';
import { invalidateSocialGraph } from '../../utils/socialSync';

export interface ProfileScreenProps {
  targetUserId?: number | null;
  onBack?: () => void;
}

export function ProfileScreen({ targetUserId, onBack }: ProfileScreenProps) {
  const { user: currentUser, logout } = useAuth();
  const queryClient = useQueryClient();

  const isOwnProfile = !targetUserId || targetUserId === currentUser?.user_id;

  // Edit Bio Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bioInput, setBioInput] = useState(currentUser?.bio || '');
  const [kontakUrlInput, setKontakUrlInput] = useState(currentUser?.kontak_url || '');

  // Blocked Users Modal State
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  // 1. Fetch Profile Data
  const {
    data: profileData,
    isLoading,
    refetch,
  } = useQuery<PublicProfileResponse | MyProfileResponse>({
    queryKey: ['user', isOwnProfile ? 'me' : targetUserId],
    queryFn: async () => {
      if (isOwnProfile) {
        const res = await apiClient.get<MyProfileResponse>('/auth/me');
        return res.data;
      } else {
        const res = await apiClient.get<PublicProfileResponse>(`/users/${targetUserId}`);
        return res.data;
      }
    },
    staleTime: 30 * 1000,
  });

  const effectiveUserId = targetUserId || currentUser?.user_id;

  // 1b. Fetch SKPI Summary (For Student Profiles)
  const { data: skpiSummary } = useQuery<SkpiSummaryResponse>({
    queryKey: ['user', effectiveUserId, 'skpi-summary'],
    queryFn: async () => {
      if (!effectiveUserId) return null as any;
      const res = await apiClient.get<SkpiSummaryResponse>(`/users/${effectiveUserId}/skpi-summary`);
      return res.data;
    },
    enabled: Boolean(effectiveUserId),
    staleTime: 30 * 1000,
  });

  // 1c. Fetch Portfolios (For Student Profiles)
  const { data: portfolios, isLoading: isLoadingPortfolios } = useQuery<PortfolioPublicResponse[]>({
    queryKey: ['user', effectiveUserId, 'portfolios'],
    queryFn: async () => {
      if (!effectiveUserId) return [];
      const res = await apiClient.get<PortfolioPublicResponse[]>(`/portfolio?user_id=${effectiveUserId}`);
      return res.data;
    },
    enabled: Boolean(effectiveUserId),
    staleTime: 30 * 1000,
  });

  // 2. Friendship Actions Mutations
  const friendRequestMutation = useMutation({
    mutationFn: async (addresseeId: number) => {
      await apiClient.post('/friendships', { addressee_id: addresseeId });
    },
    onSuccess: () => {
      Alert.alert('Terkirim', 'Permintaan pertemanan berhasil dikirim!');
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Gagal Mengirim Permintaan', err?.message || 'Terjadi kesalahan.');
    },
  });

  const cancelOrRemoveFriendMutation = useMutation({
    mutationFn: async (friendshipId: number) => {
      await apiClient.delete(`/friendships/${friendshipId}`);
    },
    onSuccess: () => {
      Alert.alert('Berhasil', 'Status pertemanan telah diperbarui.');
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Gagal Memperbarui', err?.message || 'Terjadi kesalahan.');
    },
  });

  const acceptFriendMutation = useMutation({
    mutationFn: async (friendshipId: number) => {
      await apiClient.patch(`/friendships/${friendshipId}`, { status: 'accepted' });
    },
    onSuccess: () => {
      Alert.alert('Diterima', 'Anda dan mahasiswa ini sekarang berteman!');
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Gagal Menerima', err?.message || 'Terjadi kesalahan.');
    },
  });

  // 3. User Block Mutation (US-14)
  const blockUserMutation = useMutation({
    mutationFn: async (blockedId: number) => {
      await apiClient.post('/blocks', {
        blocked_id: blockedId,
        alasan: 'Pemblokiran melalui aplikasi mobile',
      });
      return blockedId;
    },
    onSuccess: async (_, blockedId) => {
      Alert.alert('Pengguna Diblokir', 'Pengguna ini tidak dapat melihat karya atau berinteraksi dengan Anda.');
      refetch();
      await invalidateSocialGraph(queryClient, { targetUserId: blockedId });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Terjadi kesalahan.';
      Alert.alert('Gagal Memblokir', typeof msg === 'string' ? msg : 'Terjadi kesalahan validasi input.');
    },
  });

  // 3b. User Unblock Mutation (US-14)
  const unblockUserMutation = useMutation({
    mutationFn: async (blockedId: number) => {
      await apiClient.delete(`/blocks/${blockedId}`);
      return blockedId;
    },
    onSuccess: async (_, blockedId) => {
      Alert.alert(
        'Blokir Dibuka',
        'Pengguna ini dapat melihat profil Anda kembali. Pertemanan tidak otomatis aktif.'
      );
      refetch();
      await invalidateSocialGraph(queryClient, { targetUserId: blockedId });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err?.message || 'Gagal membuka blokir.';
      Alert.alert('Gagal Membuka Blokir', typeof msg === 'string' ? msg : 'Terjadi kesalahan.');
    },
  });

  // 4. Update Profile Bio & Contact Mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/users/me', {
        bio: bioInput.trim() || null,
        kontak_url: kontakUrlInput.trim() || null,
      });
    },
    onSuccess: () => {
      Alert.alert('Profil Diperbarui', 'Biodata profil berhasil disimpan.');
      setIsEditModalOpen(false);
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Gagal Memperbarui', err?.message || 'Terjadi kesalahan.');
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Keluar',
      'Apakah Anda yakin ingin keluar dari akun CampusFolio?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleBlockConfirmation = () => {
    if (!targetUserId) return;
    Alert.alert(
      `Blokir ${userObj?.nama || 'Pengguna'}?`,
      'Pengguna ini tidak akan dapat mengirim pertemanan atau melihat linimasa Anda. Lanjutkan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Blokir',
          style: 'destructive',
          onPress: () => blockUserMutation.mutate(targetUserId),
        },
      ]
    );
  };

  const handleUnblockConfirmation = () => {
    if (!targetUserId) return;
    Alert.alert(
      `Buka Blokir ${userObj?.nama || 'Pengguna'}?`,
      'Pengguna ini akan dapat melihat linimasa karya dan profil publik Anda kembali (kecuali jika pengguna tersebut juga memblokir Anda).\n\nPertemanan tidak dipulihkan secara otomatis (Bukan Teman).\n\nPihak yang bersangkutan tidak akan menerima pemberitahuan.\n\nAnda dapat memblokir kembali akun ini kapan saja jika diperlukan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Buka Blokir',
          style: 'default',
          onPress: () => unblockUserMutation.mutate(targetUserId),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const userObj = profileData || currentUser;
  const isStudent = userObj?.role === 'mahasiswa';
  const isTargetStudent = isStudent;
  const isCurrentStudent = currentUser?.role === 'mahasiswa';
  const isStaffViewer = currentUser?.role === 'moderator' || currentUser?.role === 'admin';
  const canFriendship = !isOwnProfile && isCurrentStudent && isTargetStudent;
  const otherProfile = !isOwnProfile ? (profileData as PublicProfileResponse) : null;
  const friendshipStatus = otherProfile?.friendship_status || 'none';
  const friendshipId = otherProfile?.friendship_id;

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        {!isOwnProfile && Boolean(onBack) ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
        <Text style={styles.headerTitle}>
          {isOwnProfile ? 'Profil Saya' : 'Profil Mahasiswa'}
        </Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={() => setIsEditModalOpen(true)} style={styles.editBtn}>
            <Edit3 size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Banner */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userObj?.nama)}</Text>
          </View>

          <Text style={styles.name}>{userObj?.nama}</Text>

          <View style={styles.metaBadgeRow}>
            <Badge
              label={(userObj?.role || 'mahasiswa').toUpperCase()}
              variant={userObj?.role === 'admin' ? 'danger' : userObj?.role === 'moderator' ? 'warning' : 'default'}
            />
            {Boolean((userObj as any)?.nim) && (
              <Badge label={`NIM: ${(userObj as any).nim}`} variant="neutral" />
            )}
          </View>

          <View style={styles.infoList}>
            {Boolean(userObj?.jurusan) && (
              <View style={styles.infoItem}>
                <GraduationCap size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.infoText}>{userObj?.jurusan}</Text>
              </View>
            )}

            {Boolean(userObj?.angkatan) && (
              <View style={styles.infoItem}>
                <Calendar size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.infoText}>Angkatan {userObj?.angkatan}</Text>
              </View>
            )}

            {Boolean((userObj as any)?.email) && isOwnProfile && (
              <View style={styles.infoItem}>
                <Mail size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.infoText}>{(userObj as any).email}</Text>
              </View>
            )}

            {Boolean(userObj?.kontak_url) && (
              <View style={styles.infoItem}>
                <Globe size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.primary }]}>
                  {userObj?.kontak_url}
                </Text>
              </View>
            )}
          </View>

          {/* Bio Box */}
          {Boolean(userObj?.bio) ? (
            <View style={styles.bioBox}>
              <Text style={styles.bioText}>{userObj?.bio}</Text>
            </View>
          ) : isOwnProfile ? (
            <TouchableOpacity
              onPress={() => setIsEditModalOpen(true)}
              style={styles.emptyBioPrompt}
            >
              <Text style={styles.emptyBioText}>+ Tambahkan bio untuk memperkenalkan diri</Text>
            </TouchableOpacity>
          ) : null}

          {/* Other Profile Actions (Friendship for Students, Block Banner for Blocked, Academic Notice for Staff) */}
          {!isOwnProfile && (
            otherProfile?.can_unblock ? (
              <View style={styles.blockedBanner}>
                <View style={styles.blockedBannerContent}>
                  <ShieldAlert size={18} color="#D97706" />
                  <Text style={styles.blockedBannerText}>
                    Anda memblokir pengguna ini. Data detail dan linimasa karya disembunyikan.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleUnblockConfirmation}
                  style={styles.unblockBannerBtn}
                  accessibilityLabel="Buka blokir akun ini"
                  disabled={unblockUserMutation.isPending}
                >
                  <Text style={styles.unblockBannerBtnText}>Buka Blokir</Text>
                </TouchableOpacity>
              </View>
            ) : canFriendship ? (
              <View style={styles.otherActionsRow}>
                {otherProfile?.can_friend && (
                  <Button
                    title="Tambah Teman"
                    size="sm"
                    onPress={() => targetUserId && friendRequestMutation.mutate(targetUserId)}
                    loading={friendRequestMutation.isPending}
                    icon={<UserPlus size={16} color="#FFFFFF" />}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                )}

                {friendshipStatus === 'pending_sent' && (
                  <Button
                    title="Batalkan Permintaan"
                    variant="outline"
                    size="sm"
                    onPress={() => friendshipId && cancelOrRemoveFriendMutation.mutate(friendshipId)}
                    loading={cancelOrRemoveFriendMutation.isPending}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                )}

                {friendshipStatus === 'pending_received' && (
                  <Button
                    title="Terima Pertemanan"
                    size="sm"
                    onPress={() => friendshipId && acceptFriendMutation.mutate(friendshipId)}
                    loading={acceptFriendMutation.isPending}
                    icon={<UserCheck size={16} color="#FFFFFF" />}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                )}

                {friendshipStatus === 'friends' && (
                  <Button
                    title="Hapus Teman"
                    variant="outline"
                    size="sm"
                    onPress={() => friendshipId && cancelOrRemoveFriendMutation.mutate(friendshipId)}
                    loading={cancelOrRemoveFriendMutation.isPending}
                    style={{ flex: 1, marginRight: 8 }}
                  />
                )}

                {/* Block Button (US-14) */}
                {otherProfile?.can_block && (
                  <TouchableOpacity
                    onPress={handleBlockConfirmation}
                    style={styles.blockBtn}
                    activeOpacity={0.7}
                    accessibilityLabel="Blokir pengguna ini"
                  >
                    <ShieldAlert size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.roleNoticeBanner}>
                {isStaffViewer && isTargetStudent ? (
                  <View style={styles.roleNoticeContent}>
                    <GraduationCap size={16} color={colors.primary} />
                    <Text style={styles.roleNoticeText}>
                      Mahasiswa Bimbingan {userObj?.jurusan ? `• ${userObj?.jurusan}` : ''}
                    </Text>
                  </View>
                ) : isCurrentStudent && !isTargetStudent ? (
                  <View style={styles.roleNoticeContent}>
                    <ShieldCheck size={16} color={colors.matchEmeraldText} />
                    <Text style={[styles.roleNoticeText, { color: colors.matchEmeraldText }]}>
                      {userObj?.role === 'admin' ? 'Administrator Universitas' : `Kaprodi • ${userObj?.jurusan || 'Program Studi'}`}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.roleNoticeContent}>
                    <ShieldCheck size={16} color={colors.onSurfaceVariant} />
                    <Text style={styles.roleNoticeText}>
                      {userObj?.role === 'admin' ? 'Administrator' : `Koordinator Prodi • ${userObj?.jurusan || ''}`}
                    </Text>
                  </View>
                )}
              </View>
            )
          )}
        </View>

        {/* Skills Section */}
        {Boolean((userObj as any)?.skills && (userObj as any).skills.length > 0) && (
          <View style={styles.skillsCard}>
            <Text style={styles.skillsCardTitle}>Keahlian & Minat Mahasiswa</Text>
            <View style={styles.skillsList}>
              {((userObj as any).skills as any[]).map((skill: any, idx: number) => {
                const skillName = typeof skill === 'string' ? skill : skill.nama || skill.skill?.nama;
                const level = skill.tingkat_keahlian || '';
                return (
                  <View key={idx} style={styles.skillPill}>
                    <Text style={styles.skillPillName}>#{skillName}</Text>
                    {Boolean(level) && (
                      <Text style={styles.skillPillLevel}>({level})</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* SKPI Summary Section (For Students) */}
        {isStudent && Boolean(skpiSummary) && (
          <View style={styles.skpiCard}>
            <View style={styles.skpiHeaderRow}>
              <View style={styles.skpiIconCircle}>
                <Award size={20} color={colors.primary} />
              </View>
              <View style={styles.skpiHeaderTextGroup}>
                <Text style={styles.skpiCardTitle}>Capaian Poin SKPI Resmi</Text>
                <Text style={styles.skpiCardSubtitle}>Tervalidasi oleh Koordinator Program Studi</Text>
              </View>
              <View style={styles.skpiTotalPoinBadge}>
                <Text style={styles.skpiTotalPoinText}>{skpiSummary?.total_poin ?? 0}</Text>
                <Text style={styles.skpiTotalPoinLabel}>Poin</Text>
              </View>
            </View>

            <View style={styles.skpiStatsRow}>
              <View style={styles.skpiStatBox}>
                <CheckCircle2 size={14} color={colors.matchEmeraldText} />
                <Text style={styles.skpiStatNum}>{skpiSummary?.total_terverifikasi ?? 0}</Text>
                <Text style={styles.skpiStatLbl}>Terverifikasi</Text>
              </View>
              {isOwnProfile && typeof skpiSummary?.menunggu_review === 'number' && (
                <View style={styles.skpiStatBox}>
                  <Text style={[styles.skpiStatNum, { color: colors.warningText }]}>
                    {skpiSummary.menunggu_review}
                  </Text>
                  <Text style={styles.skpiStatLbl}>Menunggu Review</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Portfolio Showcase Section (For Students) */}
        {isStudent && (
          <View style={styles.portfolioSection}>
            <View style={styles.portfolioSectionHeader}>
              <FolderKanban size={18} color={colors.primary} />
              <Text style={styles.portfolioSectionTitle}>Portofolio & Karya Ilmiah</Text>
            </View>

            {isLoadingPortfolios ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
            ) : portfolios && portfolios.length > 0 ? (
              portfolios.map((item) => (
                <View key={item.portfolio_id} style={styles.portfolioCard}>
                  <View style={styles.portfolioCardHeader}>
                    <Badge
                      label={item.kategori.replace('_', ' ').toUpperCase()}
                      variant={item.kategori === 'artikel_ilmiah' ? 'info' : item.kategori === 'sertifikat' ? 'success' : 'default'}
                    />
                    <Badge
                      label={item.status_verifikasi === 'terverifikasi' ? 'TERVERIFIKASI SKPI' : item.status_verifikasi.toUpperCase()}
                      variant={item.status_verifikasi === 'terverifikasi' ? 'success' : 'neutral'}
                    />
                  </View>
                  <Text style={styles.portfolioTitle}>{item.judul}</Text>
                  {Boolean(item.deskripsi) && (
                    <Text style={styles.portfolioDesc} numberOfLines={2}>
                      {item.deskripsi}
                    </Text>
                  )}
                  {Boolean(item.penerbit) && (
                    <Text style={styles.portfolioMetaText}>
                      Penerbit: {item.penerbit} {item.tanggal_terbit ? `(${item.tanggal_terbit})` : ''}
                    </Text>
                  )}
                  {item.skills && item.skills.length > 0 && (
                    <View style={styles.portfolioSkillRow}>
                      {item.skills.map((s, idx) => (
                        <Text key={idx} style={styles.portfolioSkillText}>
                          #{s.nama}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyPortfolioBox}>
                <Text style={styles.emptyPortfolioText}>Belum ada karya portofolio yang dipublikasikan.</Text>
              </View>
            )}
          </View>
        )}

        {/* Own Profile Privacy & Settings Section */}
        {isOwnProfile && (
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => setIsBlockedModalOpen(true)}
              accessibilityLabel="Buka daftar pengguna yang diblokir"
            >
              <View style={styles.settingsItemLeft}>
                <View style={styles.settingsIconWrapper}>
                  <Shield size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingsItemTitle}>Pengguna yang Diblokir</Text>
                  <Text style={styles.settingsItemSub}>Kelola akun yang Anda batasi</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        )}

        {/* Own Profile Logout Button */}
        {isOwnProfile && (
          <View style={styles.logoutWrapper}>
            <Button
              title="Keluar dari Aplikasi"
              variant="outline"
              onPress={handleLogout}
              icon={<LogOut size={16} color={colors.primary} />}
            />
          </View>
        )}
      </ScrollView>

      {/* Edit Bio Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Perbarui Biodata Profil</Text>

            <Input
              label="Biodata Singkat (Bio)"
              placeholder="Ceritakan minat riset, fokus teknologi, atau hobi Anda..."
              value={bioInput}
              onChangeText={setBioInput}
              multiline
              numberOfLines={4}
            />

            <Input
              label="Tautan Kontak / Portofolio Web"
              placeholder="https://linkedin.com/in/... atau GitHub"
              value={kontakUrlInput}
              onChangeText={setKontakUrlInput}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalActionsRow}>
              <Button
                title="Batal"
                variant="ghost"
                onPress={() => setIsEditModalOpen(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Simpan Perubahan"
                onPress={() => updateProfileMutation.mutate()}
                loading={updateProfileMutation.isPending}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* Blocked Users Modal (US-14) */}
      <BlockedUsersModal
        visible={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceCanvas,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  editBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: 8,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  infoList: {
    width: '100%',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
    marginBottom: 14,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: colors.onSurface,
  },
  bioBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.onSurface,
  },
  emptyBioPrompt: {
    padding: 10,
    marginBottom: 14,
  },
  emptyBioText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  otherActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 6,
  },
  roleNoticeBanner: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    width: '100%',
  },
  roleNoticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  roleNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  blockBtn: {
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  skillsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 16,
  },
  skillsCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 12,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  skillPillName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryContainer,
  },
  skillPillLevel: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  logoutWrapper: {
    marginTop: 8,
  },
  skpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 16,
  },
  skpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skpiIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  skpiHeaderTextGroup: {
    flex: 1,
  },
  skpiCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
  },
  skpiCardSubtitle: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  skpiTotalPoinBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  skpiTotalPoinText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  skpiTotalPoinLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  skpiStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  skpiStatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skpiStatNum: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onSurface,
  },
  skpiStatLbl: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  portfolioSection: {
    marginBottom: 16,
  },
  portfolioSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  portfolioSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
  },
  portfolioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 10,
  },
  portfolioCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  portfolioTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 4,
  },
  portfolioDesc: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 8,
  },
  portfolioMetaText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  portfolioSkillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  portfolioSkillText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyPortfolioBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  emptyPortfolioText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  blockedBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  blockedBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  blockedBannerText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  unblockBannerBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unblockBannerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  settingsSection: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  settingsItemSub: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
});
