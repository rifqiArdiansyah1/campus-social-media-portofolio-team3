import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { X, UploadCloud, FileText, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { apiClient } from '../../api/client';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export interface CreatePortfolioModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES: { key: 'proyek' | 'skpi' | 'sertifikat' | 'artikel_ilmiah'; label: string }[] = [
  { key: 'skpi', label: 'SKPI & Prestasi' },
  { key: 'sertifikat', label: 'Sertifikat Kompetensi' },
  { key: 'proyek', label: 'Proyek Aplikasi' },
  { key: 'artikel_ilmiah', label: 'Artikel Ilmiah / Riset' },
];

export function CreatePortfolioModal({ onClose, onSuccess }: CreatePortfolioModalProps) {
  const [judul, setJudul] = useState('');
  const [kategori, setKategori] = useState<'proyek' | 'skpi' | 'sertifikat' | 'artikel_ilmiah'>('skpi');
  const [deskripsi, setDeskripsi] = useState('');
  const [penerbit, setPenerbit] = useState('');
  const [nomorDokumen, setNomorDokumen] = useState('');
  const [tanggalTerbit, setTanggalTerbit] = useState('');
  const [tautanUrl, setTautanUrl] = useState('');

  const [documentAsset, setDocumentAsset] = useState<{ uri: string; name: string } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const file = res.assets[0];
        setDocumentAsset({ uri: file.uri, name: file.name });
      }
    } catch {
      Alert.alert('Gagal Memilih Dokumen', 'Tidak dapat membuka pengelola berkas.');
    }
  };

  const handleSubmit = async () => {
    if (!judul.trim()) {
      setErrorMsg('Judul karya wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let uploadedFilePath: string | null = null;

      // 1. If document attached, upload first
      if (documentAsset) {
        setIsUploadingDoc(true);
        const formData = new FormData();
        formData.append('file', {
          uri: documentAsset.uri,
          name: documentAsset.name,
          type: 'application/pdf',
        } as any);

        const uploadRes = await apiClient.post<{ path: string }>('/uploads/portfolio-doc', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedFilePath = uploadRes.data.path;
        setIsUploadingDoc(false);
      }

      // 2. Submit Portfolio
      await apiClient.post('/portfolio', {
        judul: judul.trim(),
        kategori,
        deskripsi: deskripsi.trim() || null,
        penerbit: penerbit.trim() || null,
        nomor_dokumen: nomorDokumen.trim() || null,
        tanggal_terbit: tanggalTerbit.trim() || null,
        tautan_url: tautanUrl.trim() || null,
        file_url: uploadedFilePath,
      });

      Alert.alert('Berhasil', 'Karya portofolio berhasil ditambahkan!');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan karya portofolio.');
      Alert.alert('Gagal Menyimpan', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
      setIsUploadingDoc(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.modalCard}>
        {/* Modal Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tambah Karya Portofolio</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {Boolean(errorMsg) && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <Input
            label="Judul Portofolio / Capaian *"
            placeholder="Contoh: Juara 1 UI/UX Design Hackathon 2024"
            value={judul}
            onChangeText={setJudul}
          />

          {/* Kategori Chips */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Kategori Capaian</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = kategori === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
                    onPress={() => setKategori(cat.key)}
                  >
                    <Text
                      style={[
                        styles.categoryBtnText,
                        isSelected && styles.categoryBtnTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input
            label="Penerbit / Penyelenggara"
            placeholder="Contoh: Kemendikbudristek / IEEE"
            value={penerbit}
            onChangeText={setPenerbit}
          />

          <Input
            label="Nomor Dokumen / Sertifikat"
            placeholder="Contoh: SK-102/KEM/2024"
            value={nomorDokumen}
            onChangeText={setNomorDokumen}
          />

          <Input
            label="Tanggal Terbit / Kegiatan"
            placeholder="YYYY-MM-DD (Contoh: 2024-08-17)"
            value={tanggalTerbit}
            onChangeText={setTanggalTerbit}
          />

          <Input
            label="Tautan Proyek / Demo (Opsional)"
            placeholder="https://github.com/..."
            value={tautanUrl}
            onChangeText={setTautanUrl}
            keyboardType="url"
            autoCapitalize="none"
          />

          <Input
            label="Deskripsi / Peran Anda"
            placeholder="Jelaskan peran Anda, teknologi yang digunakan, serta capaian hasil..."
            value={deskripsi}
            onChangeText={setDeskripsi}
            multiline
            numberOfLines={3}
            containerStyle={{ marginBottom: 12 }}
          />

          {/* PDF Document Upload Picker */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Unggah Bukti Dokumen (PDF SKPI)</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handlePickDocument}
              style={[
                styles.uploadBox,
                Boolean(documentAsset) && styles.uploadBoxSelected,
              ]}
            >
              {documentAsset ? (
                <View style={styles.fileSelectedRow}>
                  <CheckCircle2 size={24} color={colors.matchEmeraldText} />
                  <View style={styles.fileSelectedInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {documentAsset.name}
                    </Text>
                    <Text style={styles.fileSelectedSub}>Ketuk untuk mengganti berkas PDF</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadPrompt}>
                  <UploadCloud size={28} color={colors.primary} />
                  <Text style={styles.uploadPromptTitle}>Pilih Berkas PDF dari Perangkat</Text>
                  <Text style={styles.uploadPromptSub}>Maksimal ukuran berkas 10MB</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <Button
            title={
              isUploadingDoc
                ? 'Mengunggah Dokumen Bukti...'
                : isSubmitting
                ? 'Menyimpan Karya...'
                : 'Simpan Portofolio'
            }
            onPress={handleSubmit}
            loading={isSubmitting || isUploadingDoc}
            style={styles.submitBtn}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    padding: 20,
  },
  errorBox: {
    backgroundColor: colors.dangerBg,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 13,
  },
  fieldSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  categoryBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryBtnText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  categoryBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  uploadBoxSelected: {
    borderStyle: 'solid',
    borderColor: colors.matchEmerald,
    backgroundColor: colors.matchEmeraldBg,
  },
  uploadPrompt: {
    alignItems: 'center',
    gap: 4,
  },
  uploadPromptTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 6,
  },
  uploadPromptSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  fileSelectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileSelectedInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
  },
  fileSelectedSub: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 10,
    marginBottom: 20,
  },
});
