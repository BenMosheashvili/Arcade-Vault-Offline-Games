import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Colors, { IconName } from '../../constants/colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface GameCardProps {
  game: {
    title: string;
    route: string;
    icon: IconName;
    color: string;
    desc: string;
  };
}

export default function GameCard({ game }: GameCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      activeOpacity={0.7} 
      style={styles.card}
      onPress={() => router.push(game.route as any)}
    >
      <View style={[styles.iconContainer, { borderColor: game.color + '40' }]}>
        <MaterialCommunityIcons 
          name={game.icon} 
          size={42} 
          color={game.color} 
        />
      </View>
      
      <Text style={styles.gameTitle}>{game.title}</Text>
      <Text style={styles.gameDesc}>{game.desc}</Text>
      
      <View style={[styles.playButton, { backgroundColor: game.color + '20' }]}>
        <Text style={[styles.playText, { color: game.color }]}>PLAY</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 16,
    margin: 8,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  gameDesc: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
  },
  playButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  playText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
