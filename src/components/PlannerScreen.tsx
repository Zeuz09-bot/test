import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTaskStore } from '../stores/taskStore';

export function PlannerScreen() {
  const todaysTasks = useTaskStore((s) => s.todaysTasks);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Planner</Text>
      {todaysTasks.length === 0 ? (
        <Text style={styles.empty}>No tasks planned today.</Text>
      ) : (
        todaysTasks.map((task) => (
          <View key={task.id} style={styles.row}>
            <Text style={styles.dot}>●</Text>
            <Text style={styles.item}>{task.title}</Text>
          </View>
        ))
      )}
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Add Block</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F5F5' },
  title: { fontSize: 30, fontWeight: '600', color: '#222', marginTop: 48 },
  empty: { fontSize: 16, color: '#666', marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { color: '#222', marginRight: 8, fontSize: 12 },
  item: { fontSize: 16, color: '#222' },
  button: { backgroundColor: '#222', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});