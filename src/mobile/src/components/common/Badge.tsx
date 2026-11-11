import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'recruiting'
  | 'info'
  | 'neutral';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Badge({
  label,
  variant = 'default',
  style,
  textStyle,
  icon,
}: BadgeProps) {
  const getColors = () => {
    switch (variant) {
      case 'success':
        return { bg: colors.matchEmeraldBg, text: colors.matchEmeraldText };
      case 'warning':
        return { bg: colors.warningBg, text: colors.warningText };
      case 'danger':
        return { bg: colors.dangerBg, text: colors.dangerText };
      case 'recruiting':
        return { bg: colors.recruitingCoralBg, text: colors.recruitingCoralText };
      case 'info':
        return { bg: colors.infoBg, text: colors.infoText };
      case 'neutral':
        return { bg: '#F1F5F9', text: '#475569' };
      case 'default':
      default:
        return { bg: colors.surfaceContainer, text: colors.primaryContainer };
    }
  };

  const { bg, text } = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {icon}
      <Text style={[styles.text, { color: text }, icon ? { marginLeft: 4 } : undefined, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
