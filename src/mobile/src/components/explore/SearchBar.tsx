import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors } from '../../theme/colors';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Cari mahasiswa, postingan, karya...',
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Search size={18} color={colors.onSurfaceVariant} style={styles.searchIcon} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        returnKeyType="search"
        style={styles.input}
      />
      {Boolean(value) && (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clearBtn}
          activeOpacity={0.7}
        >
          <X size={16} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.onSurface,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
  },
});
