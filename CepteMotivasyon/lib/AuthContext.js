import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Auth state değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUsername = async (username) => {
    try {
      const { data, error } = await supabase
        .rpc('check_username_exists', { username: username.toLowerCase() });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking username:', error);
      throw new Error('Kullanıcı adı kontrolü sırasında bir hata oluştu');
    }
  };

  const signUp = async ({ email, password, username }) => {
    try {
      // Username kontrolü
      const usernameExists = await checkUsername(username);
      if (usernameExists) {
        throw new Error('Bu kullanıcı adı zaten kullanılıyor');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase(),
          },
        },
      });

      if (error) {
        if (error.message.includes('email')) {
          throw new Error('Bu e-posta adresi zaten kullanılıyor');
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async ({ emailOrUsername, password }) => {
    try {
      let email = emailOrUsername;
      
      // Eğer @ işareti yoksa, bu bir username'dir
      if (!emailOrUsername.includes('@')) {
        console.log('Username ile giriş deneniyor:', emailOrUsername);
        // Username'e göre email'i bul
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', emailOrUsername.toLowerCase());
        
        if (profileError) {
          console.error('Profile error:', profileError);
          throw new Error('Kullanıcı bulunamadı');
        }

        if (!profiles || profiles.length === 0) {
          console.error('Profile not found for username:', emailOrUsername);
          throw new Error('Kullanıcı bulunamadı');
        }

        // Get user data from auth.users table
        const { data: userData, error: userError } = await supabase
          .from('auth.users')
          .select('email')
          .eq('id', profiles[0].id)
          .single();

        if (userError || !userData) {
          console.error('User error:', userError);
          throw new Error('Kullanıcı bulunamadı');
        }

        email = userData.email;
        console.log('Found email for username:', email);
      }

      console.log('Attempting to sign in with email:', email);
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Email adresinizi onaylamadan giriş yapamazsınız. Lütfen email adresinizi kontrol edin.');
        }
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Email veya şifre hatalı');
        }
        throw signInError;
      }

      // Giriş başarılı olduğunda session'ı kontrol et
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Oturum başlatılamadı');
      }

      if (!session) {
        console.error('No session after successful sign in');
        throw new Error('Oturum başlatılamadı');
      }

      setUser(session.user);
      console.log('Sign in successful, session established:', session);
      return { user: session.user, session };
    } catch (error) {
      console.error('Error in signIn function:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    checkUsername,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 