// ================================
// api-client.js - QualityX System
// ================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://otaztiyatvbajswowdgs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YXp0aXlhdHZiYWpzd293ZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI4NTYsImV4cCI6MjA3NjI3ODg1Nn0.wmAvCpj8TpKjeuWF1OrjvXnxucMCFhhQrK0skA0SQhc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== AUTH FUNCTIONS ====================

export async function signUp(email, password, name, department = null) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, department }
      }
    });

    if (error) throw error;

    const user = data.user;
    if (user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name,
          email,
          role: 'pending',
          department,
          first_login: new Date(),
          status: 'offline'
        });

      if (insertError) throw insertError;
    }

    return user;
  } catch (error) {
    console.error('SignUp Error:', error);
    throw error;
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    const user = data.user;
    
    // تحديث حالة المستخدم
    await supabase
      .from('users')
      .update({ 
        last_seen: new Date(), 
        status: 'online' 
      })
      .eq('id', user.id);

    return user;
  } catch (error) {
    console.error('SignIn Error:', error);
    throw error;
  }
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// ==================== DATA FUNCTIONS ====================

export async function getUserData(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data;
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
