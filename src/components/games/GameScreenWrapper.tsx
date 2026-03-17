import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface GameScreenWrapperProps {
  title: string;
  children?: React.ReactNode;
}

export default function GameScreenWrapper({ title, children }: GameScreenWrapperProps) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={32} color="#FFF" />
          <Text style={styles.backText}>חזרה</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    direction: 'rtl',
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  backText: {
    color: '#FFF',
    fontSize: 16,
    marginRight: -4,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
});
