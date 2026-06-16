import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useFocusStore } from '../stores/focusStore';
import { useAuthStore } from '../stores/authStore';

export function FocusTimer({ taskId }: { taskId?: string }) {
  const { activeSession, sessions, startSession, endSession, loadSessions } = useFocusStore();
  const user = useAuthStore((s) => s.user);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!activeSession) {
      setRemaining(0);
      return;
    }
    const startTime = new Date(activeSession.started_at).getTime();
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const total = activeSession.planned_minutes * 60;
    setRemaining(Math.max(total - elapsed, 0));

    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleStartPomodoro = async () => {
    if (!user || !taskId) return;
    await startSession({
      task_id: taskId,
      user_id: user.id,
      session_type: 'pomodoro',
      planned_minutes: 25,
      started_at: new Date().toISOString(),
    });
  };

  const handleStartFreeform = async () => {
    if (!user || !taskId) return;
    await startSession({
      task_id: taskId,
      user_id: user.id,
      session_type: 'freeform',
      planned_minutes: 60,
      started_at: new Date().toISOString(),
    });
  };

  const handleEnd = async () => {
    if (!activeSession) return;
    await endSession(activeSession.id);
  };

  if (!activeSession) {
    return (
      <View style={styles.container}>
        <Text style={styles.nothing}>No active focus session</Text>
        {taskId ? (
          <View style={styles.startButtons}>
            <Pressable style={[styles.button, styles.pomodoroButton]} onPress={handleStartPomodoro}>
              <Text style={styles.buttonText}>Start Pomodoro (25m)</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.freeformButton]} onPress={handleStartFreeform}>
              <Text style={styles.buttonText}>Free Focus (60m)</Text>
            </Pressable>
          </View>
        ) : null}
        {sessions.length > 0 ? (
          <View style={styles.history}>
            <Text style={styles.historyTitle}>Recent Sessions</Text>
            {sessions.slice(0, 5).map((s) => (
              <Text key={s.id} style={styles.historyItem}>
                {s.session_type} — {s.completed ? `${s.actual_minutes ?? '?'}m` : 'incomplete'}
              </Text>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Focus Session</Text>
      <Text style={styles.timer}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </Text>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={handleEnd}>
          <Text style={styles.buttonText}>Complete Session</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 24 },
  title: { fontSize: 28, fontWeight: '600', color: '#222', marginBottom: 48 },
  timer: { fontSize: 72, fontWeight: 'bold', color: '#222', fontFamily: 'monospace', marginBottom: 48 },
  controls: { flexDirection: 'row', gap: 12 },
  button: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  nothing: { fontSize: 18, color: '#666', marginBottom: 32 },
  pomodoroButton: { backgroundColor: '#6A1B9A', marginBottom: 12 },
  freeformButton: { backgroundColor: '#1565C0' },
  startButtons: { width: '100%', paddingHorizontal: 24, marginBottom: 32 },
  history: { marginTop: 32, width: '100%', paddingHorizontal: 24 },
  historyTitle: { fontSize: 16, fontWeight: '600', color: '#222', marginBottom: 8 },
  historyItem: { fontSize: 14, color: '#555', marginBottom: 4 },
});
