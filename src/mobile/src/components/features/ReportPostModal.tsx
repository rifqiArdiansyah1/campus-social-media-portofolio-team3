import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import {
  ShieldAlert,
  CheckCircle2,
  X,
  Lock,
  AlertCircle,
} from 'lucide-react-native';
import { colors } from '../../theme/colors';
import {
  REPORT_CATEGORIES,
  ReportCategoryValue,
} from '../../constants/reportCategories';
import { validateReportInput, mapReportApiError } from '../../utils/reportValidation';
import { apiClient } from '../../api/client';

export interface ReportPostModalProps {
  visible: boolean;
  postId: number | null;
  postAuthorName?: string;
  onClose: () => void;
  onSuccess: (postId: number) => void;
}

export function ReportPostModal({
  visible,
  postId,
  postAuthorName,
  onClose,
  onSuccess,
}: ReportPostModalProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ReportCategoryValue>('konten_tidak_pantas');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const activeCategoryItem = REPORT_CATEGORIES.find(
    (c) => c.value === selectedCategory
  );
  const isReasonRequired = activeCategoryItem?.requiresReason ?? false;
  const validation = validateReportInput(selectedCategory, reason);
  const isSubmitDisabled = isSubmitting || !validation.isValid;

  const handleReset = () => {
    setSelectedCategory('konten_tidak_pantas');
    setReason('');
    setErrorMessage(null);
    setIsSuccess(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;

    if (!isSuccess && reason.trim().length > 0) {
      Alert.alert(
        'Batalkan Laporan?',
        'Keterangan laporan yang telah Anda ketik akan hilang.',
        [
          { text: 'Lanjut Mengisi', style: 'cancel' },
          {
            text: 'Buang & Tutup',
            style: 'destructive',
            onPress: () => {
              handleReset();
              onClose();
            },
          },
        ]
      );
      return;
    }

    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!postId || isSubmitDisabled) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await apiClient.post('/reports', {
        post_id: postId,
        kategori_laporan: selectedCategory,
        alasan: reason.trim() || undefined,
      });

      setIsSuccess(true);
      onSuccess(postId);
    } catch (err: any) {
      const msg = mapReportApiError(err);
      setErrorMessage(msg);
      // If duplicate active report, treat as handled
      if (err?.response?.status === 409 || err?.response?.data?.code === 'DUPLICATE_ACTIVE_REPORT') {
        onSuccess(postId);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrapper}>
                <ShieldAlert size={20} color="#D97706" />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.title}>Laporkan Postingan</Text>
                {Boolean(postAuthorName) && (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    Konten oleh {postAuthorName}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Tutup dialog laporan"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            /* In-modal Success State */
            <View style={styles.successContainer}>
              <View style={styles.successIconBubble}>
                <CheckCircle2 size={44} color="#059669" />
              </View>
              <Text style={styles.successTitle}>Laporan Berhasil Dikirim</Text>
              <Text style={styles.successMessage}>
                Laporan Anda telah diteruskan ke antrean moderasi program studi. Postingan ini disembunyikan sementara dari linimasa Anda.
              </Text>
              <View style={styles.successNoticeBox}>
                <Lock size={15} color="#4F46E5" />
                <Text style={styles.successNoticeText}>
                  Identitas Anda dirahasiakan dari pemilik postingan dan hanya dapat dilihat oleh tim peninjau resmi kampus.
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.successCloseBtn}
                accessibilityRole="button"
              >
                <Text style={styles.successCloseBtnText}>Kembali ke Linimasa</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Form Body */
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Privacy Notice Box */}
              <View style={styles.privacyNoticeBox}>
                <View style={styles.privacyHeader}>
                  <Lock size={14} color="#4338CA" />
                  <Text style={styles.privacyTitle}>Privasi & Integritas Peninjauan</Text>
                </View>
                <Text style={styles.privacyBody}>
                  Identitas Anda tidak ditampilkan kepada pemilik postingan. Moderator prodi dan admin kampus dapat melihat identitas pelapor untuk audit akademik.
                </Text>
                <Text style={styles.privacySubBody}>
                  Postingan tetap terlihat oleh orang lain sampai ditinjau oleh tim moderasi.
                </Text>
              </View>

              {/* Error Banner if any */}
              {Boolean(errorMessage) && (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color="#DC2626" />
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* Category Selector */}
              <Text style={styles.sectionLabel}>Pilih Kategori Pelanggaran</Text>
              <View
                style={styles.categoryList}
                accessibilityRole="radiogroup"
                aria-label="Kategori pelanggaran"
              >
                {REPORT_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.value;
                  return (
                    <TouchableOpacity
                      key={cat.value}
                      activeOpacity={0.7}
                      onPress={() => setSelectedCategory(cat.value)}
                      style={[
                        styles.categoryCard,
                        isSelected && styles.categoryCardSelected,
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      accessibilityLabel={`${cat.label}: ${cat.description}`}
                    >
                      <View style={styles.radioRow}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <View style={styles.categoryTextWrapper}>
                          <Text
                            style={[
                              styles.categoryLabel,
                              isSelected && styles.categoryLabelSelected,
                            ]}
                          >
                            {cat.label}
                          </Text>
                          <Text style={styles.categoryDesc}>
                            {cat.description}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Progressive Disclosure: Reason text area */}
              <View style={styles.reasonSection}>
                <View style={styles.reasonHeaderRow}>
                  <Text style={styles.reasonLabel}>
                    Keterangan Tambahan{' '}
                    <Text
                      style={
                        isReasonRequired
                          ? styles.requiredTag
                          : styles.optionalTag
                      }
                    >
                      {isReasonRequired ? '(Wajib, min 5 karakter)' : '(Opsional)'}
                    </Text>
                  </Text>
                  <Text
                    style={[
                      styles.charCounter,
                      reason.length > 950 && styles.charCounterWarning,
                    ]}
                  >
                    {reason.length}/1000
                  </Text>
                </View>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder={activeCategoryItem?.placeholder}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={4}
                  maxLength={1000}
                  style={[
                    styles.reasonInput,
                    isReasonRequired &&
                      reason.trim().length > 0 &&
                      reason.trim().length < 5 &&
                      styles.reasonInputError,
                  ]}
                />
              </View>

              {/* Submit & Cancel Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  onPress={handleClose}
                  style={styles.cancelBtn}
                  disabled={isSubmitting}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[
                    styles.submitBtn,
                    isSubmitDisabled && styles.submitBtnDisabled,
                  ]}
                  disabled={isSubmitDisabled}
                  accessibilityRole="button"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Kirim Laporan</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.onSurface,
  },
  subtitle: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8,
  },
  scrollBody: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: 20,
  },
  privacyNoticeBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 16,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3730A3',
  },
  privacyBody: {
    fontSize: 12,
    lineHeight: 17,
    color: '#312E81',
  },
  privacySubBody: {
    fontSize: 11,
    lineHeight: 16,
    color: '#4338CA',
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorBannerText: {
    fontSize: 12,
    color: '#B91C1C',
    flex: 1,
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 10,
  },
  categoryList: {
    gap: 8,
    marginBottom: 16,
  },
  categoryCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#F5F3FF',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primary,
  },
  categoryTextWrapper: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
  },
  categoryLabelSelected: {
    color: colors.primary,
  },
  categoryDesc: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 15,
    marginTop: 2,
  },
  reasonSection: {
    marginBottom: 20,
  },
  reasonHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reasonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurface,
  },
  requiredTag: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '500',
  },
  optionalTag: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
    fontWeight: '400',
  },
  charCounter: {
    fontSize: 11,
    color: colors.onSurfaceVariant,
  },
  charCounterWarning: {
    color: '#D97706',
    fontWeight: '600',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: colors.onSurface,
    backgroundColor: '#FAFAFA',
    textAlignVertical: 'top',
    minHeight: 88,
  },
  reasonInputError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  submitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successIconBubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  successNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  successNoticeText: {
    fontSize: 11,
    color: '#3730A3',
    lineHeight: 16,
    flex: 1,
  },
  successCloseBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  successCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
