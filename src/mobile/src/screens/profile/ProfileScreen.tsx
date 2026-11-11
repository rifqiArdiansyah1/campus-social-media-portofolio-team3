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
  ShieldAlert,
  Mail,
  GraduationCap,
  Calendar,
  Globe,
  ArrowLeft,
  Edit3,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { PublicProfileResponse, MyProfileResponse } from '../../api/types';
import { getInitials } from '../../utils/formatting';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';

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
        blocked_user_id: blockedId,
        alasan: 'Pemblokiran melalui aplikasi mobile',
      });
    },
    onSuccess: () => {
      Alert.alert('Pengguna Diblokir', 'Pengguna ini tidak dapat melihat karya atau berinteraksi dengan Anda.');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err: any) => {
      Alert.alert('Gagal Memblokir', err?.message || 'Terjadi kesalahan.');
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
      'Blokir Pengguna',
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const userObj = profileData || currentUser;
  const isStudent = userObj?.role === 'mahasiswa';
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

          {/* Other Profile Friendship & Block Actions */}
          {!isOwnProfile && isStudent && (
            <View style={styles.otherActionsRow}>
              {friendshipStatus === 'none' && (
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
              <TouchableOpacity
                onPress={handleBlockConfirmation}
                style={styles.blockBtn}
                activeOpacity={0.7}
              >
                <ShieldAlert size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
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
});
