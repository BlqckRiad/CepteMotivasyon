import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://acqthycsyaqfhtwigozq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjcXRoeWNzeWFxZmh0d2lnb3pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyODUwNzgsImV4cCI6MjA1Njg2MTA3OH0.DcsZkzAUDrXW6bIpBtxtJ4hcaLWiBZ7n8IOpF5Nu1tk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Function to get a random quote
export const getRandomQuote = async () => {
  const { data, error } = await supabase
    .rpc('get_random_quote')
    .single();

  if (error) {
    console.error('Error fetching random quote:', error);
    return null;
  }

  return data;
};

// Function to get user's tasks
export const getUserTasks = async (userId) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return data;
};

// Function to toggle task completion
export const toggleTaskCompletion = async (taskId, completed) => {
  const { data, error } = await supabase
    .from('tasks')
    .update({ completed })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task:', error);
    return false;
  }

  return true;
}; 