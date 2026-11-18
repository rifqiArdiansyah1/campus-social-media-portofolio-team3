import { REPORT_CATEGORIES, ReportCategoryValue } from '../constants/reportCategories';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export function validateReportInput(category: ReportCategoryValue, reason: string): ValidationResult {
  const item = REPORT_CATEGORIES.find((c) => c.value === category);
  const isReasonRequired = item?.requiresReason ?? false;
  const trimmed = reason.trim();

  if (isReasonRequired) {
    if (trimmed.length < 5) {
      return {
        isValid: false,
        errorMessage: 'Alasan wajib diisi minimal 5 karakter untuk kategori Pelanggaran Lainnya.',
      };
    }
  } else {
    if (reason.length > 0 && trimmed.length < 5) {
      return {
        isValid: false,
        errorMessage: 'Jika diisi, alasan minimal 5 karakter.',
      };
    }
  }

  if (reason.length > 1000) {
    return {
      isValid: false,
      errorMessage: 'Alasan maksimal 1000 karakter.',
    };
  }

  return { isValid: true };
}

export function mapReportApiError(err: any): string {
  const status = err?.response?.status;
  const code = err?.response?.data?.code;
  const detail = err?.response?.data?.detail;

  if (code === 'DUPLICATE_ACTIVE_REPORT' || status === 409) {
    return 'Anda sudah memiliki laporan aktif untuk postingan ini yang sedang ditinjau.';
  }
  if (code === 'REPORT_RATE_LIMIT_EXCEEDED' || status === 429) {
    return 'Batas pelaporan maksimal (20 laporan per 24 jam) tercapai. Silakan coba lagi nanti.';
  }
  if (code === 'SELF_REPORT_NOT_ALLOWED' || status === 422) {
    return detail || 'Anda tidak dapat melaporkan postingan milik sendiri.';
  }
  if (code === 'POST_NOT_FOUND' || status === 404) {
    return 'Postingan ini telah dihapus atau tidak tersedia lagi.';
  }
  if (status === 401) {
    return 'Sesi Anda telah kedaluwarsa. Silakan masuk kembali.';
  }
  return detail || 'Gagal mengirimkan laporan. Periksa koneksi internet Anda dan coba lagi.';
}
