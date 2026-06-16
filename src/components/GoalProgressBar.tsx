import { View, StyleSheet } from 'react-native';

export function GoalProgressBar({ progress }: { progress: number }) {
  const clamped = Math.min(Math.max(progress, 0), 100);
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#222',
    borderRadius: 4,
  },
});
