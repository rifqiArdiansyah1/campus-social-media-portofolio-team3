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
import { LogIn, GraduationCap, Sparkles } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

export interface LoginScreenProps {
  onNavigateToRegister: () => void;
}

export function LoginScreen({ onNavigateToRegister }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = (loginEmail || email).trim();
    const targetPassword = loginPassword || password;

    if (!targetEmail || !targetPassword) {
      setErrorMessage('Email dan kata sandi wajib diisi');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await login({ email: targetEmail, password: targetPassword });
    } catch (err: any) {
      const msg = err?.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.';
      setErrorMessage(msg);
      Alert.alert('Gagal Masuk', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(demoEmail, demoPass);
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
        {/* Hero Branding */}
        <View style={styles.heroSection}>
          <View style={styles.logoBadge}>
            <GraduationCap size={36} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>CampusFolio</Text>
          <Text style={styles.brandSubtitle}>
            Media Sosial Portofolio & Rekomendasi Kolaborator Mahasiswa
          </Text>
        </View>

        {/* Card Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Masuk ke Akun Anda</Text>

          {Boolean(errorMessage) && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Input
            label="Email Kampus / Akun"
            placeholder="nama@campus.ac.id"
            value={email}
            onChangeText={(txt) => {
              setEmail(txt);
              if (errorMessage) setErrorMessage('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Kata Sandi"
            placeholder="••••••••"
            value={password}
            onChangeText={(txt) => {
              setPassword(txt);
              if (errorMessage) setErrorMessage('');
            }}
            secureTextEntry
          />

          <Button
            title="Masuk Sekarang"
            onPress={() => handleLogin()}
            loading={loading}
            icon={<LogIn size={18} color="#FFFFFF" />}
            style={styles.loginBtn}
          />

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Belum punya akun? </Text>
            <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
              <Text style={styles.registerLink}>Daftar Mahasiswa Baru</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Demo Logins for Evaluator */}
        <View style={styles.demoSection}>
          <View style={styles.demoHeader}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.demoTitle}>Akun Pengujian Cepat (1-Klik):</Text>
          </View>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => handleDemoLogin('rifqi@campus.ac.id', 'password123')}
            >
              <Text style={styles.demoChipText}>Mahasiswa TI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => handleDemoLogin('hakim@campus.ac.id', 'password123')}
            >
              <Text style={styles.demoChipText}>Mahasiswa SI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => handleDemoLogin('kaprodi.ti@campus.ac.id', 'kaprodipassword123')}
            >
              <Text style={styles.demoChipText}>Kaprodi (Mod)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => handleDemoLogin('admin@campus.ac.id', 'adminpassword123')}
            >
              <Text style={styles.demoChipText}>Admin</Text>
            </TouchableOpacity>
          </View>
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
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 20,
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
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 18,
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
  loginBtn: {
    marginTop: 8,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  registerPrompt: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  demoSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demoChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurface,
  },
});
