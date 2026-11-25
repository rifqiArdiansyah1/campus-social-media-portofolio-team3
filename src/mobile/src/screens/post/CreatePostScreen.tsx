import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X, Users, ArrowLeft, Send, Tag, Plus, Check } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';
import { buildPostPayload, PostCreatePayload } from '../../utils/postPayload';

export interface SkillItem {
  skill_id: number;
  nama: string;
  tipe?: string;
}

export interface CreatePostScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function CreatePostScreen({ onBack, onSuccess }: CreatePostScreenProps) {
  const queryClient = useQueryClient();
  const [isi, setIsi] = useState('');
  const [tipe, setTipe] = useState<'umum' | 'cari_anggota'>('umum');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Skill state for recruiting post
  const [selectedSkills, setSelectedSkills] = useState<SkillItem[]>([]);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [skillSuggestions, setSkillSuggestions] = useState<SkillItem[]>([]);
  const [isSearchingSkills, setIsSearchingSkills] = useState(false);

  // Debounced search for skills in mobile
  React.useEffect(() => {
    if (tipe !== 'cari_anggota' || !skillSearchQuery.trim()) {
      setSkillSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingSkills(true);
      try {
        const res = await apiClient.get<SkillItem[]>('/skills', {
          params: { q: skillSearchQuery.trim(), limit: 5 },
        });
        setSkillSuggestions(res.data);
      } catch {
        setSkillSuggestions([]);
      } finally {
        setIsSearchingSkills(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [tipe, skillSearchQuery]);

  const handleAddSkill = (skill: SkillItem) => {
    if (selectedSkills.some((s) => s.skill_id === skill.skill_id)) return;
    if (selectedSkills.length >= 10) {
      Alert.alert('Batas Maksimal', 'Maksimal memilih 10 tag keahlian.');
      return;
    }
    setSelectedSkills((prev) => [...prev, skill]);
    setSkillSearchQuery('');
    setSkillSuggestions([]);
  };

  const handleRemoveSkill = (skillId: number) => {
    setSelectedSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
  };

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Izin Diperlukan',
          'Aplikasi membutuhkan izin galeri untuk mengunggah foto postingan.'
        );
        return;
      }

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedImageUri(res.assets[0].uri);
      }
    } catch {
      Alert.alert('Gagal Membuka Galeri', 'Terjadi kesalahan saat memilih gambar.');
    }
  };

  const handlePublish = async () => {
    if (!isi.trim()) {
      Alert.alert('Konten Kosong', 'Tuliskan pesan atau karya yang ingin Anda bagikan.');
      return;
    }

    setIsPublishing(true);
    try {
      let uploadedImageUrl: string | null = null;

      // 1. Upload photo if selected
      if (selectedImageUri) {
        setIsUploadingPhoto(true);
        const filename = selectedImageUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        const formData = new FormData();
        formData.append('file', {
          uri: selectedImageUri,
          name: filename,
          type,
        } as any);

        const uploadRes = await apiClient.post<{ path?: string; url: string }>('/uploads/post-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedImageUrl = uploadRes.data.path || uploadRes.data.url;
        setIsUploadingPhoto(false);
      }

      // 2. Create Post with payload builder
      const payload = buildPostPayload(
        isi,
        tipe,
        selectedSkills.map((s) => s.skill_id),
        uploadedImageUrl
      );
      await apiClient.post('/posts', payload);

      // 3. Invalidate feed cache immediately
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      Alert.alert('Berhasil Dipublikasikan', 'Postingan Anda telah berhasil tayang di linimasa kampus!');
      onSuccess();
    } catch (err: any) {
      Alert.alert('Gagal Publikasi', err?.message || 'Terjadi kesalahan saat memposting.');
    } finally {
      setIsPublishing(false);
      setIsUploadingPhoto(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buat Postingan Baru</Text>
        <Button
          title="Kirim"
          size="sm"
          onPress={handlePublish}
          loading={isPublishing || isUploadingPhoto}
          style={styles.headerPublishBtn}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tipe Post Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeOption, tipe === 'umum' && styles.typeOptionActive]}
            onPress={() => setTipe('umum')}
          >
            <Text
              style={[
                styles.typeOptionText,
                tipe === 'umum' && styles.typeOptionTextActive,
              ]}
            >
              Postingan Umum
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeOption,
              tipe === 'cari_anggota' && styles.typeOptionActiveCoral,
            ]}
            onPress={() => setTipe('cari_anggota')}
          >
            <Users
              size={14}
              color={tipe === 'cari_anggota' ? '#FFFFFF' : colors.recruitingCoralText}
            />
            <Text
              style={[
                styles.typeOptionText,
                tipe === 'cari_anggota' && styles.typeOptionTextActive,
              ]}
            >
              Rekrutmen Tim
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skill Selector for Rekrutmen Tim */}
        {tipe === 'cari_anggota' && (
          <View style={styles.skillSelectorContainer}>
            <View style={styles.skillHeaderRow}>
              <View style={styles.skillHeaderLeft}>
                <Tag size={14} color={colors.primary} />
                <Text style={styles.skillHeaderTitle}>Tag Keahlian yang Dicari</Text>
              </View>
              <Text style={styles.skillCounter}>{selectedSkills.length}/10</Text>
            </View>

            {/* Selected Chips */}
            {selectedSkills.length > 0 && (
              <View style={styles.chipsContainer}>
                {selectedSkills.map((sk) => (
                  <View key={sk.skill_id} style={styles.chip}>
                    <Text style={styles.chipText}>#{sk.nama}</Text>
                    <TouchableOpacity
                      onPress={() => handleRemoveSkill(sk.skill_id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.chipRemoveBtn}
                    >
                      <X size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Search Input for Skills */}
            {selectedSkills.length < 10 && (
              <View style={styles.skillSearchBox}>
                <TextInput
                  placeholder="Ketik keahlian (contoh: React, Python)..."
                  placeholderTextColor="#94A3B8"
                  value={skillSearchQuery}
                  onChangeText={setSkillSearchQuery}
                  style={styles.skillSearchInput}
                />
                {isSearchingSkills && <ActivityIndicator size="small" color={colors.primary} />}
              </View>
            )}

            {/* Suggestions List */}
            {skillSuggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {skillSuggestions.map((item) => {
                  const isSelected = selectedSkills.some((s) => s.skill_id === item.skill_id);
                  return (
                    <TouchableOpacity
                      key={item.skill_id}
                      style={[styles.suggestionItem, isSelected && styles.suggestionItemSelected]}
                      onPress={() => handleAddSkill(item)}
                      disabled={isSelected}
                    >
                      <Text style={[styles.suggestionText, isSelected && styles.suggestionTextSelected]}>
                        {item.nama}
                      </Text>
                      {isSelected ? (
                        <Check size={14} color="#10B981" />
                      ) : (
                        <Plus size={14} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          placeholder={
            tipe === 'cari_anggota'
              ? 'Tuliskan proyek atau lomba yang sedang Anda ikuti, serta kriteria rekan yang dicari...'
              : 'Bagikan progres proyek, inspirasi riset, atau karya terbaru Anda...'
          }
          placeholderTextColor="#94A3B8"
          value={isi}
          onChangeText={setIsi}
          multiline
          style={styles.textInput}
          textAlignVertical="top"
        />

        {/* Selected Image Preview */}
        {Boolean(selectedImageUri) && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImageUri! }}
              style={styles.imagePreview}
              contentFit="cover"
            />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setSelectedImageUri(null)}
            >
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Pick Image Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handlePickImage}
          style={styles.pickImageBtn}
        >
          <ImagePlus size={20} color={colors.primary} />
          <Text style={styles.pickImageText}>
            {selectedImageUri ? 'Ganti Foto' : 'Tambahkan Foto dari Galeri (Maks 5MB)'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
  },
  headerPublishBtn: {
    minWidth: 70,
  },
  container: {
    padding: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    padding: 4,
    borderRadius: 10,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  typeOptionActive: {
    backgroundColor: colors.primary,
  },
  typeOptionActiveCoral: {
    backgroundColor: colors.recruitingCoral,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    fontSize: 16,
    color: colors.onSurface,
    lineHeight: 24,
    minHeight: 180,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 16,
    position: 'relative',
    backgroundColor: colors.surfaceContainerLow,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: 12,
  },
  pickImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  skillSelectorContainer: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  skillHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skillHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  skillHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
  },
  skillCounter: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingVertical: 4,
    paddingLeft: 8,
    paddingRight: 6,
    borderRadius: 12,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  chipRemoveBtn: {
    padding: 2,
  },
  skillSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: 10,
    height: 38,
  },
  skillSearchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.onSurface,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginTop: 6,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  suggestionItemSelected: {
    backgroundColor: colors.surfaceContainerLow,
    opacity: 0.6,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
  },
  suggestionTextSelected: {
    color: colors.onSurfaceVariant,
  },
});
