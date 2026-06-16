import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNoteStore } from '../../src/stores/noteStore';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notes = useNoteStore((s) => s.notes);
  const { updateNote, deleteNote, convertNoteToTask } = useNoteStore();
  const note = notes.find((n) => n.id === id);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) setContent(note.content);
  }, [note]);

  if (!note) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Note not found.</Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleSave = async () => {
    if (content.trim() && content !== note.content) {
      await updateNote(note.id, { content: content.trim() });
    }
    router.back();
  };

  const handleConvertToTask = async () => {
    await convertNoteToTask(note.id);
    router.back();
  };

  const handleDelete = async () => {
    await deleteNote(note.id);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={handleSave} style={styles.iconButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#222" />
        </Pressable>
        <View style={styles.topActions}>
          <Pressable onPress={handleConvertToTask} style={styles.iconButton}>
            <MaterialCommunityIcons name="checkbox-marked-outline" size={22} color="#666" />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.iconButton}>
            <MaterialCommunityIcons name="delete-outline" size={22} color="#E53935" />
          </Pressable>
        </View>
      </View>

      <TextInput
        style={styles.input}
        value={content}
        onChangeText={setContent}
        multiline
        placeholder="Edit note..."
        placeholderTextColor="#999"
        textAlignVertical="top"
      />

      <Text style={styles.meta}>
        Created: {new Date(note.created_at).toLocaleDateString()}
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F5F5F5' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 48,
    marginBottom: 16,
  },
  topActions: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 4 },
  empty: { fontSize: 16, color: '#666', marginTop: 48, textAlign: 'center' },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    lineHeight: 24,
    paddingTop: 8,
  },
  meta: { fontSize: 12, color: '#999', marginTop: 16, textAlign: 'center' },
  button: { backgroundColor: '#222', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
