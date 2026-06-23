import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabase';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  /**
   * جلب بيانات المستخدم الإضافية من جدول users
   */
  const fetchUserData = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('خطأ في جلب بيانات المستخدم:', error.message);
      return null;
    }
    return data;
  }, []);

  /**
   * تحديث حالة المستخدم بناءً على الجلسة
   */
  const updateUserState = useCallback(async (currentSession) => {
    if (currentSession?.user) {
      const userData = await fetchUserData(currentSession.user.id);
      setUser({
        id: currentSession.user.id,
        email: currentSession.user.email,
        ...userData,
      });
      setSession(currentSession);
    } else {
      setUser(null);
      setSession(null);
    }
  }, [fetchUserData]);

  // فحص الجلسة المخزنة عند تحميل التطبيق
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        await updateUserState(currentSession);
      } catch (error) {
        console.error('خطأ في فحص الجلسة:', error.message);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [updateUserState]);

  // الاستماع لتغييرات الجلسة (تسجيل دخول / خروج من علامات تبويب أخرى)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        await updateUserState(currentSession);
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, [updateUserState]);

  /**
   * تسجيل الدخول
   */
  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  /**
   * تسجيل الخروج
   */
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    toast.success('تم تسجيل الخروج بنجاح');
  }, []);

  const isAdmin = user?.role === 'admin';
  const isDataEntry = user?.role === 'data_entry';

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, isAdmin, isDataEntry }}>
      {children}
    </AuthContext.Provider>
  );
}
