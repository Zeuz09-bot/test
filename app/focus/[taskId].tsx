import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FocusTimer } from '../../src/components/FocusTimer';
import { useTaskStore } from '../../src/stores/taskStore';

export default function FocusScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const tasks = useTaskStore((s) => s.tasks);
  const task = tasks.find((t) => t.id === taskId);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#222" />
      </Pressable>

      {task ? (
        <Text style={styles.taskTitle}>Focus: {task.title}</Text>
      ) : (
        <Text style={styles.taskTitle}>Focus Session</Text>
      )}

      <FocusTimer taskId={taskId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F5F5' },
  backButton: { marginTop: 48, marginBottom: 16, width: 40 },
  taskTitle: { fontSize: 18, fontWeight: '600', color: '#222', textAlign: 'center', marginBottom: 24 },
});
