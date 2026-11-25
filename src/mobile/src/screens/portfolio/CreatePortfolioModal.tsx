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
import { buildPortfolioPayload } from '../../utils/portfolioPayload';
import { apiClient } from '../../api/client';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { PortfolioDetailResponse } from '../../api/types';

export interface CreatePortfolioModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialItem?: PortfolioDetailResponse | null;
}

const CATEGORIES: { key: 'proyek' | 'skpi' | 'sertifikat' | 'artikel_ilmiah'; label: string }[] = [
  { key: 'skpi', label: 'SKPI & Prestasi' },
  { key: 'sertifikat', label: 'Sertifikat Kompetensi' },
  { key: 'proyek', label: 'Proyek Aplikasi' },
  { key: 'artikel_ilmiah', label: 'Artikel Ilmiah / Riset' },
];

export function CreatePortfolioModal({ onClose, onSuccess, initialItem }: CreatePortfolioModalProps) {
  const isEditing = Boolean(initialItem);
  const [judul, setJudul] = useState(initialItem?.judul || '');
  const [kategori, setKategori] = useState<'proyek' | 'skpi' | 'sertifikat' | 'artikel_ilmiah'>(
    (initialItem?.kategori as any) || 'skpi'
  );
  const [deskripsi, setDeskripsi] = useState(initialItem?.deskripsi || '');
  const [penerbit, setPenerbit] = useState(initialItem?.penerbit || '');
  const [nomorDokumen, setNomorDokumen] = useState(initialItem?.nomor_dokumen || '');
  const [tanggalTerbit, setTanggalTerbit] = useState(initialItem?.tanggal_terbit || '');
  const [tautanUrl, setTautanUrl] = useState(initialItem?.tautan_url || '');

  const [documentAsset, setDocumentAsset] = useState<{ uri: string; name: string } | null>(null);
  const [existingFilePath, setExistingFilePath] = useState<string | null>(initialItem?.file_url || null);
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
    if (!judul.trim() || judul.trim().length < 3) {
      setErrorMsg('Judul karya minimal 3 karakter');
      return;
    }

    if (kategori === 'artikel_ilmiah' && nomorDokumen.trim()) {
      const match = nomorDokumen.trim().match(/10\.\d{4,9}\/[-._;()/:A-Za-z0-9<>+]+/);
      if (!match) {
        setErrorMsg('Format DOI tidak valid. Gunakan format 10.xxxx/... atau kosongkan jika draf belum memiliki DOI resmi.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let uploadedFilePath: string | null = existingFilePath;

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

      // 2. Submit Portfolio (Create or Patch)
      const payload = buildPortfolioPayload({
        judul,
        kategori,
        deskripsi,
        penerbit,
        nomor_dokumen: nomorDokumen,
        tanggal_terbit: tanggalTerbit,
        tautan_url: tautanUrl,
        file_url: uploadedFilePath,
      });

      if (isEditing && initialItem) {
        await apiClient.patch(`/portfolio/${initialItem.portfolio_id}`, payload);
        Alert.alert('Berhasil', 'Karya portofolio berhasil diperbarui!');
      } else {
        await apiClient.post('/portfolio', payload);
        Alert.alert('Berhasil', 'Karya portofolio berhasil ditambahkan!');
      }

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
          <Text style={styles.title}>{isEditing ? 'Ubah Karya Portofolio' : 'Tambah Karya Portofolio'}</Text>
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
                const isCategoryDisabled = Boolean(isEditing && initialItem?.status_verifikasi && initialItem.status_verifikasi !== 'draft');
                return (
                  <TouchableOpacity
                    key={cat.key}
                    disabled={isCategoryDisabled}
                    style={[
                      styles.categoryBtn,
                      isSelected && styles.categoryBtnActive,
                      isCategoryDisabled && { opacity: 0.5 },
                    ]}
                    onPress={() => !isCategoryDisabled && setKategori(cat.key)}
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
            label={kategori === 'artikel_ilmiah' ? 'Nama Jurnal / Konferensi' : 'Penerbit / Penyelenggara'}
            placeholder={
              kategori === 'artikel_ilmiah'
                ? 'Contoh: IEEE Transactions / Jurnal Nasional'
                : 'Contoh: Kemendikbudristek / IEEE'
            }
            value={penerbit}
            onChangeText={setPenerbit}
          />

          <Input
            label={
              kategori === 'artikel_ilmiah'
                ? 'Nomor DOI (Digital Object Identifier)'
                : 'Nomor Dokumen / Sertifikat'
            }
            placeholder={
              kategori === 'artikel_ilmiah'
                ? 'Contoh: 10.1145/1234567.1234568 (Kosongkan jika draf)'
                : 'Contoh: SK-102/KEM/2024'
            }
            value={nomorDokumen}
            onChangeText={setNomorDokumen}
          />
          {kategori === 'artikel_ilmiah' && (
            <Text style={styles.helperText}>
              Format resmi: 10.xxxx/... atau tautan https://doi.org/... Kosongkan jika draf belum memiliki DOI resmi.
            </Text>
          )}

          <Input
            label="Tanggal Terbit / Kegiatan"
            placeholder="YYYY-MM-DD (Contoh: 2024-08-17)"
            value={tanggalTerbit}
            onChangeText={setTanggalTerbit}
          />

          <Input
            label={
              kategori === 'artikel_ilmiah'
                ? 'Tautan Artikel / Publikasi (Opsional)'
                : 'Tautan Proyek / Demo (Opsional)'
            }
            placeholder={
              kategori === 'artikel_ilmiah'
                ? 'https://doi.org/... atau tautan jurnal'
                : 'https://github.com/...'
            }
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
              ) : existingFilePath ? (
                <View style={styles.fileSelectedRow}>
                  <FileText size={24} color={colors.primary} />
                  <View style={styles.fileSelectedInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {existingFilePath.split('/').pop()}
                    </Text>
                    <Text style={styles.fileSelectedSub}>Berkas tersimpan. Ketuk untuk mengganti.</Text>
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
            {Boolean(documentAsset || existingFilePath) && (
              <TouchableOpacity
                style={{ alignSelf: 'flex-start', marginTop: 6, paddingVertical: 2, paddingHorizontal: 4 }}
                onPress={() => {
                  setDocumentAsset(null);
                  setExistingFilePath(null);
                }}
              >
                <Text style={{ fontSize: 12, color: colors.dangerText, fontWeight: '600' }}>
                  Hapus Berkas Dokumen
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Button
            title={
              isUploadingDoc
                ? 'Mengunggah Dokumen Bukti...'
                : isSubmitting
                ? 'Menyimpan Karya...'
                : isEditing
                ? 'Simpan Perubahan'
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
  helperText: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    marginTop: -8,
    marginBottom: 12,
    lineHeight: 15,
  },
});
