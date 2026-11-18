import { describe, it, expect } from 'vitest';
import { validateReportInput, mapReportApiError } from '../utils/reportValidation';

describe('Mobile Report Validation Utilities', () => {
  describe('validateReportInput', () => {
    it('accepts empty reason for standard categories', () => {
      const result = validateReportInput('konten_tidak_pantas', '');
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('rejects reason shorter than 5 chars for standard categories if provided', () => {
      const result = validateReportInput('konten_tidak_pantas', 'abc');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/minimal 5 karakter/i);
    });

    it('accepts valid reason for standard categories', () => {
      const result = validateReportInput('spam', 'Iklan pinjaman online ilegal berulang.');
      expect(result.isValid).toBe(true);
    });

    it('rejects empty or whitespace reason for "lainnya" category', () => {
      const emptyResult = validateReportInput('lainnya', '');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errorMessage).toMatch(/wajib diisi minimal 5 karakter/i);

      const whitespaceResult = validateReportInput('lainnya', '    ');
      expect(whitespaceResult.isValid).toBe(false);
    });

    it('rejects reason shorter than 5 chars for "lainnya" category', () => {
      const shortResult = validateReportInput('lainnya', 'halo');
      expect(shortResult.isValid).toBe(false);
    });

    it('accepts reason with >= 5 chars for "lainnya" category', () => {
      const validResult = validateReportInput('lainnya', 'Menyebarkan informasi privasi nomor telepon tanpa izin.');
      expect(validResult.isValid).toBe(true);
    });

    it('rejects reason exceeding 1000 characters', () => {
      const longReason = 'a'.repeat(1001);
      const result = validateReportInput('konten_tidak_pantas', longReason);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toMatch(/maksimal 1000 karakter/i);
    });
  });

  describe('mapReportApiError', () => {
    it('maps 409 or DUPLICATE_ACTIVE_REPORT to duplicate message', () => {
      expect(mapReportApiError({ response: { status: 409 } })).toMatch(/sudah memiliki laporan aktif/i);
      expect(mapReportApiError({ response: { data: { code: 'DUPLICATE_ACTIVE_REPORT' } } })).toMatch(
        /sudah memiliki laporan aktif/i
      );
    });

    it('maps 429 or REPORT_RATE_LIMIT_EXCEEDED to rate limit message', () => {
      expect(mapReportApiError({ response: { status: 429 } })).toMatch(/Batas pelaporan maksimal/i);
      expect(mapReportApiError({ response: { data: { code: 'REPORT_RATE_LIMIT_EXCEEDED' } } })).toMatch(
        /Batas pelaporan maksimal/i
      );
    });

    it('maps 422 or SELF_REPORT_NOT_ALLOWED to self-report message', () => {
      expect(mapReportApiError({ response: { status: 422 } })).toMatch(/tidak dapat melaporkan postingan milik sendiri/i);
      expect(
        mapReportApiError({
          response: {
            data: { code: 'SELF_REPORT_NOT_ALLOWED', detail: 'Tidak boleh lapor sendiri' },
          },
        })
      ).toBe('Tidak boleh lapor sendiri');
    });

    it('maps 404 or POST_NOT_FOUND to not found message', () => {
      expect(mapReportApiError({ response: { status: 404 } })).toMatch(/telah dihapus atau tidak tersedia/i);
      expect(mapReportApiError({ response: { data: { code: 'POST_NOT_FOUND' } } })).toMatch(
        /telah dihapus atau tidak tersedia/i
      );
    });

    it('maps 401 to session expired message', () => {
      expect(mapReportApiError({ response: { status: 401 } })).toMatch(/Sesi Anda telah kedaluwarsa/i);
    });

    it('falls back to error detail or generic message', () => {
      expect(mapReportApiError({ response: { data: { detail: 'Custom error detail' } } })).toBe(
        'Custom error detail'
      );
      expect(mapReportApiError({})).toMatch(/Gagal mengirimkan laporan/i);
    });
  });
});
