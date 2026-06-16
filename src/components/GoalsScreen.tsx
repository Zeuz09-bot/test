import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useGoalStore } from '../stores/goalStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export function GoalsScreen() {
  const goals = useGoalStore((s) => s.goals);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Goals</Text>
      {goals.length === 0 ? (
        <Text style={styles.empty}>No goals yet.</Text>
      ) : (
        goals.map((goal) => (
          <View key={goal.id} style={styles.item}>
            <View style={styles.icon}>
              <MaterialCommunityIcons name="bullseye" size={36} color="#222" />
            </View>
            <View style={styles.info}>
              <Text style={styles.label}>{goal.title}</Text>
              <Text style={styles.category}>{goal.category}</Text>
              <Text style={styles.progress}>
                Progress: {goal.progress_pct}%
              </Text>
            </View>
          </View>
        ))
      )}
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Set New Goal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F5F5' },
  title: { fontSize: 28, fontWeight: '600', color: '#222', textAlign: 'center' },
  empty: { fontSize: 16, color: '#666', marginTop: 20, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', padding: 16, marginBottom: 12, backgroundColor: '#FFF' },
  icon: { marginRight: 16 },
  info: { flex: 1 },
  label: { fontSize: 18, fontWeight: '600', color: '#222' },
  category: { fontSize: 14, color: '#555' },
  progress: { fontSize: 14, color: '#333' },
  button: { backgroundColor: '#222', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});