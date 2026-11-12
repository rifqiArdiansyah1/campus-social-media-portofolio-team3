import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'coral';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const getContainerStyle = (): ViewStyle => {
    let paddingVertical = 10;
    let paddingHorizontal = 16;
    let borderRadius = 10;

    if (size === 'sm') {
      paddingVertical = 6;
      paddingHorizontal = 12;
      borderRadius = 8;
    } else if (size === 'lg') {
      paddingVertical = 14;
      paddingHorizontal = 24;
      borderRadius = 12;
    }

    let backgroundColor: string = colors.primary;
    let borderWidth: number | undefined;
    let borderColor: string | undefined;

    switch (variant) {
      case 'secondary':
        backgroundColor = colors.secondary;
        break;
      case 'outline':
        backgroundColor = 'transparent';
        borderWidth = 1;
        borderColor = colors.primary;
        break;
      case 'danger':
        backgroundColor = colors.danger;
        break;
      case 'coral':
        backgroundColor = colors.recruitingCoral;
        break;
      case 'ghost':
        backgroundColor = 'transparent';
        break;
      case 'primary':
      default:
        backgroundColor = colors.primary;
        break;
    }

    return {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical,
      paddingHorizontal,
      borderRadius,
      backgroundColor,
      borderWidth,
      borderColor,
      opacity: disabled || loading ? 0.55 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    let fontSize = 14;
    if (size === 'sm') fontSize = 13;
    else if (size === 'lg') fontSize = 16;

    let color = '#FFFFFF';
    if (variant === 'outline' || variant === 'ghost') {
      color = colors.primary;
    }

    return {
      fontSize,
      fontWeight: '600',
      color,
    };
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : '#FFFFFF'}
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), icon ? { marginLeft: 8 } : undefined, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
