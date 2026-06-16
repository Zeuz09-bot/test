import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTaskStore } from '../stores/taskStore';
import { useHabitStore } from '../stores/habitStore';

export function HomeScreen() {
  const todaysTasks = useTaskStore((s) => s.todaysTasks);
  const habits = useHabitStore((s) => s.habits);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TODAY</Text>
      <Text style={styles.subtitle}>Briefing</Text>
      <View style={styles.section}>
        <Text style={styles.heading}>Tasks</Text>
        {todaysTasks.map((task) => (
          <View key={task.id} style={styles.row}>
            <Text style={styles.dot}>●</Text>
            <Text style={styles.item}>{task.title}</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>Habits</Text>
        {habits.map((habit) => (
          <View key={habit.id} style={styles.row}>
            <Text style={styles.dot}>●</Text>
            <Text style={styles.item}>{habit.title}</Text>
          </View>
        ))}
      </View>
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Start Day</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F5F5' },
  title: { fontSize: 34, fontWeight: '600', color: '#222222', textAlign: 'center', marginTop: 48 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 },
  section: { marginBottom: 24 },
  heading: { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { color: '#222', marginRight: 8, fontSize: 12 },
  item: { fontSize: 16, color: '#222' },
  button: { backgroundColor: '#222', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});