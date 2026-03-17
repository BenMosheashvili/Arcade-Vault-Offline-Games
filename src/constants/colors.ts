import { ComponentProps } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const Colors = {
  dark: {
    background: '#000000',
    surface: '#121212',
    surfaceElevated: '#1E1E1E',
    border: '#333333',
    borderSubtle: '#222222',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    textMuted: '#666666',
    tint: '#6C63FF',
    accentGreen: '#00FF41',
    accentWarm: '#FF4500',
    accentGold: '#FFBF00',
    accentCyan: '#00D9FF',
    neonPurple: '#BF40BF',
    neonBlue: '#4169E1',
    neonSky: '#87CEEB',
    neonLavender: '#E6E6FA',
    neonCyan: '#00FFFF',
    neonOrange: '#FFAC1C',
    neonPink: '#FF6AD5',
  }
};

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export default Colors;
