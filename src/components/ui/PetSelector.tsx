import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { PetCategory } from '../../context/AuthContext';

interface PetOption {
  id: PetCategory;
  name: string;
  emoji: string;
}

const PET_OPTIONS: PetOption[] = [
  { id: 'dog', name: 'Perro', emoji: '🐶' },
  { id: 'cat', name: 'Gato', emoji: '🐱' },
  { id: 'both', name: 'Ambos', emoji: '🐶🐱' },
];

interface PetSelectorProps {
  selectedPet: PetCategory | null;
  onSelect: (pet: PetCategory) => void;
}

export const PetSelector: React.FC<PetSelectorProps> = ({ selectedPet, onSelect }) => {
  const handleSelect = (id: PetCategory) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // ignore
    }
    onSelect(id);
  };

  return (
    <View style={styles.container}>
      <Text style={[typography.caption, styles.title]}>
        ¿A quién consentiremos hoy?
      </Text>
      <View style={styles.grid}>
        {PET_OPTIONS.map((item) => {
          const isSelected = selectedPet === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item.id)}
              style={[
                styles.chip,
                isSelected && styles.chipActive,
              ]}
            >
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text
                style={[
                  styles.name,
                  isSelected && styles.nameActive,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    color: colors.dark.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.cardElevated,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    gap: 4,
  },
  chipActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.16)',
    borderColor: colors.primary.DEFAULT,
  },
  emoji: {
    fontSize: 16,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.dark.textSecondary,
  },
  nameActive: {
    color: colors.primary.light,
    fontWeight: '700',
  },
});

