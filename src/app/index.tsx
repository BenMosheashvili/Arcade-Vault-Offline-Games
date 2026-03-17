import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GameCard from '../components/games/GameCard';
import Colors, { IconName } from '../constants/colors';

interface GameItem {
  id: string;
  title: string;
  route: string;
  icon: IconName;
  color: string;
  desc: string;
}

const GAMES: GameItem[] = [
  { id: '1', title: 'Snake', route: '/games/Snake', icon: 'snake' as IconName, color: Colors.dark.accentGreen, desc: 'Classic Retro Fun' },
  { id: '2', title: 'Tetris', route: '/games/Tetris', icon: 'google-controller' as IconName, color: Colors.dark.neonPurple, desc: 'Block Puzzle' },
  { id: '3', title: '2048', route: '/games/2048', icon: 'format-list-numbered' as IconName, color: Colors.dark.accentGold, desc: 'Number Merge' },
  { id: '4', title: 'Pong', route: '/games/Pong', icon: 'table-tennis' as IconName, color: Colors.dark.text, desc: 'Retro Sports' },
  { id: '5', title: 'Sudoku', route: '/games/Sudoku', icon: 'grid' as IconName, color: Colors.dark.neonBlue, desc: 'Logic Puzzle' },
  { id: '6', title: 'Flappy', route: '/games/Flappy', icon: 'bird' as IconName, color: Colors.dark.neonSky, desc: 'High Score' },
];

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Arcade Vault</Text>
        <Text style={styles.subtitle}>Premium Gaming Hub</Text>
      </View>
      
      <FlatList
        data={GAMES}
        renderItem={({ item }: { item: GameItem }) => <GameCard game={item} />}
        keyExtractor={(item: GameItem) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
