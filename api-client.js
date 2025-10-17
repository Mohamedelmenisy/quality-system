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
    console.log('🚀 Starting signup process for:', email);
    
    // 1. تسجيل المستخدم في Auth مع metadata عشان الـ Display Name
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: { 
          name: name,                    // ده اللي هيظهر في Display Name
          full_name: name,               // نسخة احتياطية
          department: department,
          role: 'pending'
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
      // 2. إضافة المستخدم في جدولنا
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          name: name,
          email: email,
          role: 'pending',
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
    console.error('💥 SignUp Full Error:', error);
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
    console.error('💥 SignIn Full Error:', error);
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
    console.log('📋 Fetching user data for:', email);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('❌ Get user data error:', error);
      throw error;
    }

    console.log('✅ User data fetched:', data);
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

export async function updateUserRole(email, newRole) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('email', email);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('UpdateUserRole error:', error);
    throw error;
  }
}

// ==================== ORDERS FUNCTIONS ====================

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

export async function getOrdersByStatus(status) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetOrdersByStatus error:', error);
    throw error;
  }
}

export async function createOrder(orderData) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('CreateOrder error:', error);
    throw error;
  }
}

export async function updateOrderStatus(orderId, newStatus) {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus, updated_at: new Date() })
      .eq('id', orderId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('UpdateOrderStatus error:', error);
    throw error;
  }
}

// ==================== ASSIGNMENTS FUNCTIONS ====================

export async function createAssignment(assignmentData) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .insert([assignmentData]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('CreateAssignment error:', error);
    throw error;
  }
}

export async function getAssignmentsByAgent(agentId) {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('agent_id', agentId)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetAssignmentsByAgent error:', error);
    throw error;
  }
}

// ==================== REVIEWS FUNCTIONS ====================

export async function addReview(reviewData) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('AddReview error:', error);
    throw error;
  }
}

export async function getReviewsByOrder(orderId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetReviewsByOrder error:', error);
    throw error;
  }
}

// ==================== NOTIFICATIONS FUNCTIONS ====================

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

export async function createNotification(notificationData) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('CreateNotification error:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('MarkNotificationAsRead error:', error);
    throw error;
  }
}

// ==================== UTILITY FUNCTIONS ====================

export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetAllUsers error:', error);
    throw error;
  }
}

export async function getPendingUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetPendingUsers error:', error);
    throw error;
  }
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export function subscribeToOrders(callback) {
  return supabase
    .channel('orders-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'orders' }, 
      callback
    )
    .subscribe();
}

export function subscribeToNotifications(userId, callback) {
  return supabase
    .channel('notifications-changes')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, 
      callback
    )
    .subscribe();
}
