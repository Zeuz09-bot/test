import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useReviewStore } from '../stores/reviewStore';

export function ReviewScreen() {
  const review = useReviewStore((s) => s.review);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review</Text>
      {review ? (
        <View style={styles.card}>
          <Text style={styles.score}>{review.score}</Text>
          <Text style={styles.label}>Day Score</Text>
          <Text style={styles.meta}>
            Tasks: {review.tasks_completed}/{review.tasks_total}
          </Text>
          <Text style={styles.meta}>
            Habits: {review.habits_completed}/{review.habits_total}
          </Text>
          <Text style={styles.meta}>Focus: {review.focus_minutes}m</Text>
        </View>
      ) : (
        <Text style={styles.empty}>No review yet.</Text>
      )}
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Save Review</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F5F5' },
  title: { fontSize: 28, fontWeight: '600', color: '#222', textAlign: 'center', marginTop: 48 },
  card: { padding: 24, backgroundColor: '#FFF', borderRadius: 16, alignItems: 'center', marginTop: 24 },
  score: { fontSize: 56, fontWeight: '700', color: '#222' },
  label: { fontSize: 14, color: '#666', marginTop: 8 },
  meta: { fontSize: 14, color: '#333', marginTop: 6 },
  empty: { fontSize: 16, color: '#666', marginTop: 24, textAlign: 'center' },
  button: { backgroundColor: '#222', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});