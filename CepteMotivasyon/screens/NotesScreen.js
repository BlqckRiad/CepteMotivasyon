import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Text, FAB, Surface, IconButton, TextInput, Portal, Modal, Button, useTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const NotesScreen = () => {
  const [notes, setNotes] = useState([]);
  const [visible, setVisible] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('userNotes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const saveNote = async () => {
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const newNote = {
      id: Date.now().toString(),
      title: noteTitle,
      content: noteContent,
      date: new Date().toLocaleDateString('tr-TR')
    };

    const updatedNotes = [...notes, newNote];
    try {
      await AsyncStorage.setItem('userNotes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
      setVisible(false);
      setNoteTitle('');
      setNoteContent('');
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const deleteNote = async (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    try {
      await AsyncStorage.setItem('userNotes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: isTablet ? 32 : 16,
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    noteSurface: {
      marginBottom: 16,
      borderRadius: 12,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
    },
    noteHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 8,
    },
    noteTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
      flex: 1,
    },
    noteContent: {
      padding: 16,
      paddingTop: 0,
    },
    noteText: {
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.onSurface,
      lineHeight: 20,
    },
    dateText: {
      fontSize: 12,
      color: theme.colors.secondary,
      marginTop: 8,
    },
    modal: {
      backgroundColor: theme.colors.background,
      padding: 20,
      margin: 20,
      borderRadius: 12,
    },
    input: {
      marginBottom: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
    },
    button: {
      marginLeft: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.secondary,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Henüz not eklenmemiş</Text>
          </View>
        ) : (
          notes.map((note) => (
            <Surface key={note.id} style={styles.noteSurface} elevation={0}>
              <View style={styles.noteHeader}>
                <Text style={styles.noteTitle}>{note.title}</Text>
                <IconButton
                  icon="delete"
                  size={24}
                  onPress={() => deleteNote(note.id)}
                />
              </View>
              <View style={styles.noteContent}>
                <Text style={styles.noteText}>{note.content}</Text>
                <Text style={styles.dateText}>{note.date}</Text>
              </View>
            </Surface>
          ))
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <TextInput
            label="Başlık"
            value={noteTitle}
            onChangeText={setNoteTitle}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Not"
            value={noteContent}
            onChangeText={setNoteContent}
            multiline
            numberOfLines={4}
            style={styles.input}
            mode="outlined"
          />
          <View style={styles.buttonContainer}>
            <Button
              onPress={() => setVisible(false)}
              style={styles.button}
            >
              İptal
            </Button>
            <Button
              mode="contained"
              onPress={saveNote}
              style={styles.button}
            >
              Kaydet
            </Button>
          </View>
        </Modal>
      </Portal>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setVisible(true)}
      />
    </View>
  );
}; 