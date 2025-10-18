// ================================
// api-client.js - QualityX System
// ================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://otaztiyatvbajswowdgs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YXp0aXlhdHZiYWpzd293ZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI4NTYsImV4cCI6MjA3NjI3ODg1Nn0.wmAvCpj8TpKjeuWF1OrjvXnxucMCFhhQrK0skA0SQhc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== AUTH FUNCTIONS ====================
//
// الأدوار الرسمية المعتمدة في النظام:
// admin, manager, senior, quality-agent, agent, pending
// --------------------------------------------------------

export async function signUp(email, password, name, department = null) {
  try {
    console.log('🚀 Starting signup for:', email);
    
    // 1. Auth signup
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { 
          name: name,
          department: department
        }
      }
    });

    if (error) {
      console.error('❌ Auth signup error:', error);
      throw error;
    }

    console.log('✅ Auth signup successful, user:', data.user);

    const user = data.user;
    if (user) {
      // 2. Add to our table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: name,
          email: email,
          role: 'pending', // ← المستخدم الجديد يضاف كـ pending لحين الموافقة
          department: department,
          first_login: new Date(),
          status: 'offline'
        });

      if (insertError) {
        console.error('❌ Database insert error:', insertError);
        throw insertError;
      }

      console.log('✅ User added to database successfully');
    }

    return user;
  } catch (error) {
    console.error('💥 SignUp Error:', error);
    throw error;
  }
}

export async function signIn(email, password) {
  try {
    console.log('🔐 Attempting login for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.error('❌ Login error:', error);
      throw error;
    }

    const user = data.user;
    console.log('✅ Login successful, user ID:', user.id);
    
    // تحديث حالة المستخدم
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        last_seen: new Date(), 
        status: 'online' 
      })
      .eq('id', user.id);

    if (updateError) {
      console.warn('⚠️ Could not update user status:', updateError);
    } else {
      console.log('✅ User status updated to online');
    }

    return user;
  } catch (error) {
    console.error('💥 SignIn Error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    console.log('🚪 Logging out user...');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('✅ Logout successful');
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
    return data?.user || null;
  } catch (error) {
    console.error('💥 GetCurrentUser error:', error);
    return null;
  }
}

// ==================== USER DATA FUNCTIONS ====================

export async function getUserData(email) {
  try {
    console.log('🔍 Searching for user:', email);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('📊 Query result - Data:', data, 'Error:', error);
    
    if (error) {
      console.error('❌ Get user data error:', error);
      throw new Error('User data not found in database');
    }

    if (!data) {
      console.error('❌ No user data found');
      throw new Error('User data not found in database');
    }

    console.log('✅ User data found:', data);
    return data;
  } catch (error) {
    console.error('💥 GetUserData error:', error);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetUserById error:', error);
    throw error;
  }
}

// ==================== OTHER FUNCTIONS ====================

export async function getOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetOrders error:', error);
    throw error;
  }
}

export async function getNotifications(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetNotifications error:', error);
    throw error;
  }
}
