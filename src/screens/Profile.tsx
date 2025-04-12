import { View, Text, StyleSheet } from 'react-native';
import type { RootStackScreenProps } from '@navigation/types';

export default function Profile({ navigation }: RootStackScreenProps<'Profile'>) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
}); 