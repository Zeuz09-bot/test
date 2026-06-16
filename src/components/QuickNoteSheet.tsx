import { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useNoteStore } from '../stores/noteStore';
import { useAuthStore } from '../stores/authStore';

export function QuickNoteSheet({ onClose }: { onClose: () => void }) {
  const createNote = useNoteStore((s) => s.createNote);
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState('');

  const handleSave = async () => {
    if (!content.trim() || !user) return;
    await createNote({
      user_id: user.id,
      content: content.trim(),
      reminder_sent: 0,
    });
    onClose();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Text style={styles.title}>Quick Note</Text>
      <TextInput
        style={styles.input}
        placeholder="Write something..."
        multiline
        value={content}
        onChangeText={setContent}
        placeholderTextColor="#999"
        autoFocus
      />
      <View style={styles.buttonRow}>
        <Pressable style={[styles.button, styles.cancel]} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.save, !content.trim() && styles.disabled]}
          onPress={handleSave}
          disabled={!content.trim()}
        >
          <Text style={styles.saveText}>Save</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#FFF' },
  title: { fontSize: 20, fontWeight: '600', color: '#222', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    fontSize: 16,
    color: '#222',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancel: { backgroundColor: '#EEE' },
  cancelText: { color: '#555', fontWeight: '600' },
  save: { backgroundColor: '#222' },
  saveText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.4 },
});
