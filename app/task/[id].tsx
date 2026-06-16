import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTaskStore } from '../../src/stores/taskStore';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tasks = useTaskStore((s) => s.tasks);
  const { completeTask, deleteTask, updateTask } = useTaskStore();
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Task not found.</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleComplete = async () => {
    await completeTask(task.id);
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteTask(task.id); router.back(); } },
    ]);
  };

  const toggleInProgress = async () => {
    const newStatus = task.status === 'in_progress' ? 'pending' : 'in_progress';
    await updateTask(task.id, { status: newStatus });
  };

  const priorityColor =
    task.priority === 'high' ? '#E53935' : task.priority === 'medium' ? '#FB8C00' : '#666';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#222" />
      </Pressable>

      <View style={styles.header}>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
          <Text style={styles.priorityText}>{task.priority}</Text>
        </View>
        <Text style={styles.title}>{task.title}</Text>
      </View>

      {task.description ? (
        <Text style={styles.description}>{task.description}</Text>
      ) : null}

      <View style={styles.meta}>
        {task.deadline ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color="#666" />
            <Text style={styles.metaText}>Due: {task.deadline}</Text>
          </View>
        ) : null}
        {task.estimated_minutes ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="timer-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{task.estimated_minutes} min</Text>
          </View>
        ) : null}
        {task.scheduled_date ? (
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.metaText}>
              Scheduled: {task.scheduled_date}
              {task.scheduled_start_time ? ` at ${task.scheduled_start_time}` : ''}
            </Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <MaterialCommunityIcons
            name={task.status === 'completed' ? 'check-circle' : task.status === 'in_progress' ? 'progress-check' : 'circle-outline'}
            size={16}
            color="#666"
          />
          <Text style={styles.metaText}>{task.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {task.status !== 'completed' ? (
          <Pressable style={[styles.actionButton, styles.completeButton]} onPress={handleComplete}>
            <MaterialCommunityIcons name="check" size={20} color="#fff" />
            <Text style={styles.actionText}>Complete</Text>
          </Pressable>
        ) : null}
        <Pressable style={[styles.actionButton, styles.inProgressButton]} onPress={toggleInProgress}>
          <MaterialCommunityIcons
            name={task.status === 'in_progress' ? 'pause' : 'play'}
            size={20}
            color="#fff"
          />
          <Text style={styles.actionText}>
            {task.status === 'in_progress' ? 'Pause' : 'In Progress'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.focusButton]}
          onPress={() => router.push(`/focus/${task.id}`)}
        >
          <MaterialCommunityIcons name="target" size={20} color="#fff" />
          <Text style={styles.actionText}>Focus</Text>
        </Pressable>
      </View>

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete Task</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F5F5' },
  backButton: { marginTop: 48, marginBottom: 16, width: 40 },
  empty: { fontSize: 16, color: '#666', marginTop: 48, textAlign: 'center' },
  header: { marginBottom: 16 },
  priorityBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  priorityText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  title: { fontSize: 28, fontWeight: '600', color: '#222' },
  description: { fontSize: 16, color: '#444', lineHeight: 22, marginBottom: 24 },
  meta: { marginBottom: 32 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  metaText: { fontSize: 14, color: '#666', marginLeft: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  completeButton: { backgroundColor: '#2E7D32' },
  inProgressButton: { backgroundColor: '#1565C0' },
  focusButton: { backgroundColor: '#6A1B9A' },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  button: { backgroundColor: '#222', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  deleteButton: { alignItems: 'center', padding: 12 },
  deleteText: { color: '#E53935', fontSize: 14, fontWeight: '500' },
});
