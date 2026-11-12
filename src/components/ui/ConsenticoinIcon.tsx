import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

interface ConsenticoinIconProps {
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

/** Icono vectorial uniforme de monedas apiladas para Consenticoins. */
export const ConsenticoinIcon: React.FC<ConsenticoinIconProps> = ({
  size = 13,
  color = colors.primary.light,
  style,
}) => <FontAwesome5 name="coins" solid size={size} color={color} style={style} />;
