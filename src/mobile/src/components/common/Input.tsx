import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helper,
  containerStyle,
  secureTextEntry,
  ...rest
}: InputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {Boolean(label) && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        <TextInput
          placeholderTextColor="#94A3B8"
          style={styles.input}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        {secureTextEntry && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsSecure(!isSecure)}
            style={styles.eyeBtn}
          >
            {isSecure ? (
              <Eye size={20} color={colors.onSurfaceVariant} />
            ) : (
              <EyeOff size={20} color={colors.onSurfaceVariant} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {Boolean(error) ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : Boolean(helper) ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FAF8FF',
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.onSurface,
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
});
