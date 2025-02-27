import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const Toast = ({ message, type, visible, style }) => {
  const opacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#6C63FF';

  return (
    <Animated.View style={[styles.toast, { opacity, backgroundColor }, style]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

export default function NotesScreen() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    loadNotes();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      showToast('Notlar yüklenirken bir hata oluştu', 'error');
    }
  };

  const saveNote = async () => {
    if (title.trim().length === 0 || note.trim().length === 0) {
      showToast('Lütfen başlık ve açıklama girin', 'error');
      return;
    }

    try {
      const newNote = {
        id: Date.now().toString(),
        title: title.trim(),
        text: note.trim(),
        date: new Date().toLocaleString('tr-TR'),
      };

      const updatedNotes = [newNote, ...notes];
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
      setTitle('');
      setNote('');
      showToast('Not başarıyla kaydedildi');
    } catch (error) {
      showToast('Not kaydedilirken bir hata oluştu', 'error');
    }
  };

  const deleteNote = async (id) => {
    try {
      const updatedNotes = notes.filter(note => note.id !== id);
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
      showToast('Not başarıyla silindi');
    } catch (error) {
      showToast('Not silinirken bir hata oluştu', 'error');
    }
  };

  const renderNote = ({ item }) => (
    <View style={styles.noteItem}>
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.noteText}>{item.text}</Text>
        <Text style={styles.noteDate}>{item.date}</Text>
      </View>
      <TouchableOpacity
        onPress={() => deleteNote(item.id)}
        style={styles.deleteButton}
      >
        <Ionicons name="trash-outline" size={24} color="#FF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        style={styles.toastStyle}
      />

      <FlatList
        data={notes}
        renderItem={renderNote}
        keyExtractor={item => item.id}
        style={styles.notesList}
        contentContainerStyle={styles.notesListContent}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Başlık..."
          maxLength={50}
        />
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="Açıklama..."
          multiline
        />
        <TouchableOpacity onPress={saveNote} style={styles.addButton}>
          <Ionicons name="send" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  notesList: {
    flex: 1,
  },
  notesListContent: {
    padding: 16,
  },
  noteItem: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  titleInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: '#6C63FF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  toast: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 8,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  toastText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
  toastStyle: {
    marginTop: Platform.OS === 'ios' ? 50 : 20,
  },
}); 