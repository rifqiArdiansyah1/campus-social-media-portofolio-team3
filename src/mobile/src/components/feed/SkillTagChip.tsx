import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { PostSkillTagResponse } from '../../api/types';

export interface SkillTagChipProps {
  skill: PostSkillTagResponse;
}

export function SkillTagChip({ skill }: SkillTagChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.text}>#{skill.nama}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primaryContainer,
  },
});
