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
} from 'react-native';
import { UserPlus, ArrowLeft } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

const AVAILABLE_JURUSAN = [
  'Teknik Informatika',
  'Sistem Informasi',
  'Ilmu Komputer',
  'Manajemen Bisnis',
  'Teknik Elektro',
];

export function RegisterScreen({ onNavigateToLogin }: RegisterScreenProps) {
  const { register } = useAuth();
  const [nim, setNim] = useState('');
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jurusan, setJurusan] = useState(AVAILABLE_JURUSAN[0]);
  const [angkatan, setAngkatan] = useState('2024');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!nim.trim() || !nama.trim() || !email.trim() || !password) {
      setErrorMessage('Semua bidang formulir wajib diisi');
      return;
    }

    const angkatanNum = parseInt(angkatan, 10);
    if (isNaN(angkatanNum) || angkatanNum < 2015 || angkatanNum > 2030) {
      setErrorMessage('Tahun angkatan tidak valid');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await register({
        nim: nim.trim(),
        nama: nama.trim(),
        email: email.trim(),
        password,
        jurusan,
        angkatan: angkatanNum,
      });
    } catch (err: any) {
      const msg = err?.message || 'Pendaftaran gagal. Pastikan email menggunakan domain kampus.';
      setErrorMessage(msg);
      Alert.alert('Gagal Daftar', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={onNavigateToLogin}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.onSurface} />
          <Text style={styles.backText}>Kembali ke Login</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Daftar Mahasiswa Baru</Text>
          <Text style={styles.subtitle}>
            Bergabung dengan jaringan portofolio dan proyek kolaboratif kampus
          </Text>
        </View>

        <View style={styles.formCard}>
          {Boolean(errorMessage) && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Input
            label="NIM (Nomor Induk Mahasiswa)"
            placeholder="Contoh: 24060122140099"
            value={nim}
            onChangeText={setNim}
            keyboardType="number-pad"
          />

          <Input
            label="Nama Lengkap"
            placeholder="Nama lengkap sesuai KTM"
            value={nama}
            onChangeText={setNama}
          />

          <Input
            label="Email Kampus Resmi"
            placeholder="nama@students.campus.ac.id"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            helper="Wajib domain @campus.ac.id atau @students.campus.ac.id"
          />

          <Input
            label="Kata Sandi (Min. 8 Karakter)"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Program Studi Selector */}
          <View style={styles.jurusanSection}>
            <Text style={styles.jurusanLabel}>Program Studi</Text>
            <View style={styles.jurusanChips}>
              {AVAILABLE_JURUSAN.map((j) => {
                const isSelected = jurusan === j;
                return (
                  <TouchableOpacity
                    key={j}
                    style={[styles.jurusanChip, isSelected && styles.jurusanChipSelected]}
                    onPress={() => setJurusan(j)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.jurusanChipText,
                        isSelected && styles.jurusanChipTextSelected,
                      ]}
                    >
                      {j}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Input
            label="Tahun Angkatan"
            placeholder="2024"
            value={angkatan}
            onChangeText={setAngkatan}
            keyboardType="number-pad"
          />

          <Button
            title="Daftar & Masuk"
            onPress={handleRegister}
            loading={loading}
            icon={<UserPlus size={18} color="#FFFFFF" />}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    backgroundColor: colors.surfaceCanvas,
  },
  container: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.onSurface,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  errorBanner: {
    backgroundColor: colors.dangerBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: colors.dangerText,
    fontWeight: '500',
  },
  jurusanSection: {
    marginBottom: 16,
  },
  jurusanLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
    marginBottom: 8,
  },
  jurusanChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  jurusanChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  jurusanChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  jurusanChipText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  jurusanChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 10,
  },
});
