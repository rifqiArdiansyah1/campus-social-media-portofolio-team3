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
import { ImagePlus, X, Users, ArrowLeft, Send } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import { Button } from '../../components/common/Button';

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

      // 2. Create Post
      await apiClient.post('/posts', {
        isi: isi.trim(),
        tipe,
        gambar_url: uploadedImageUrl,
      });

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
});
