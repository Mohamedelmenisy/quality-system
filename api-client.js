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
    console.log('🚀 Starting signup for:', email);
    
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

export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('UpdateUserProfile error:', error);
    throw error;
  }
}

// ==================== ORDER FUNCTIONS ====================

export async function getOrders(filters = {}) {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .order('recorded_at', { ascending: false });

    // Apply filters
    if (filters.order_id) {
      query = query.ilike('order_id', `%${filters.order_id}%`);
    }
    if (filters.from_date) {
      query = query.gte('recorded_at', filters.from_date);
    }
    if (filters.to_date) {
      query = query.lte('recorded_at', filters.to_date);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetOrders error:', error);
    throw error;
  }
}

export async function getUnassignedOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .is('assigned_agent', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetUnassignedOrders error:', error);
    throw error;
  }
}

export async function assignOrders(orderIds, agentId, assignedById) {
  try {
    // تحديث العمود assigned_agent مباشرة في جدول orders
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        assigned_agent: agentId,
        assigned_by: assignedById,
        status: 'assigned',
        updated_at: new Date()
      })
      .in('order_id', orderIds)  // استخدام order_id بدلاً من id
      .select();

    if (error) throw error;
    
    // أيضاً يمكن إضافة سجل في order_assignments إذا كان الجدول موجود
    try {
      const assignments = orderIds.map(orderId => ({
        order_id: orderId,
        quality_agent_id: agentId,
        assigned_by_id: assignedById,
        status: 'pending',
        assigned_at: new Date()
      }));

      await supabase
        .from('order_assignments')
        .insert(assignments);
    } catch (assignmentError) {
      console.log('Order assignments table might not exist, continuing...');
    }

    return data;
  } catch (error) {
    console.error('AssignOrders error:', error);
    throw error;
  }
}

export async function getAssignedOrders(agentId = null, filters = {}) {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .not('assigned_agent', 'is', null)  // الأوردرات المعينة
      .order('created_at', { ascending: false });

    if (agentId) {
      query = query.eq('assigned_agent', agentId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetAssignedOrders error:', error);
    throw error;
  }
}

// ==================== QUALITY REVIEW FUNCTIONS ====================

export async function submitReview(assignmentId, reviewData) {
  try {
    const { data, error } = await supabase
      .from('quality_reviews')
      .insert({
        assignment_id: assignmentId,
        ...reviewData,
        reviewed_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    // Update assignment status
    await supabase
      .from('order_assignments')
      .update({ status: 'completed' })
      .eq('id', assignmentId);

    // If error was found, create error record
    if (reviewData.action_correctness === 'error') {
      const assignment = await supabase
        .from('order_assignments')
        .select('orders(employee_id)')
        .eq('id', assignmentId)
        .single();

      if (assignment.data) {
        await supabase
          .from('errors')
          .insert({
            review_id: data.id,
            employee_id: assignment.data.orders.employee_id,
            status: 'pending_response',
            recorded_at: new Date()
          });
      }
    }

    return data;
  } catch (error) {
    console.error('SubmitReview error:', error);
    throw error;
  }
}

export async function getQualityReviews(filters = {}) {
  try {
    let query = supabase
      .from('quality_reviews')
      .select(`
        *,
        order_assignments (
          orders (*),
          users!order_assignments_quality_agent_id_fkey (name)
        )
      `)
      .order('reviewed_at', { ascending: false });

    if (filters.agent_id) {
      query = query.eq('order_assignments.quality_agent_id', filters.agent_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetQualityReviews error:', error);
    throw error;
  }
}

// ==================== ERROR FUNCTIONS ====================

export async function getAgentErrors(agentId, filters = {}) {
  try {
    let query = supabase
      .from('errors')
      .select(`
        *,
        quality_reviews (
          action_correctness,
          department,
          modified_reason,
          modification_details,
          order_assignments (
            orders (
              order_id,
              created_at,
              employee_name,
              reason
            ),
            users!order_assignments_quality_agent_id_fkey (name)
          )
        ),
        error_responses (*)
      `)
      .eq('employee_id', agentId)
      .order('recorded_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.from_date) {
      query = query.gte('recorded_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('recorded_at', filters.to_date);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetAgentErrors error:', error);
    throw error;
  }
}

export async function submitErrorResponse(errorId, agentId, responseText) {
  try {
    const { data, error } = await supabase
      .from('error_responses')
      .insert({
        error_id: errorId,
        response_by_id: agentId,
        response_text: responseText,
        responded_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    // Update error status
    await supabase
      .from('errors')
      .update({ status: 'responded' })
      .eq('id', errorId);

    return data;
  } catch (error) {
    console.error('SubmitErrorResponse error:', error);
    throw error;
  }
}

export async function getPendingErrors() {
  try {
    const { data, error } = await supabase
      .from('errors')
      .select(`
        *,
        quality_reviews (
          action_correctness,
          department,
          modified_reason,
          order_assignments (
            orders (*)
          )
        ),
        error_responses (*),
        users!errors_employee_id_fkey (name, email)
      `)
      .eq('status', 'pending_response')
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetPendingErrors error:', error);
    throw error;
  }
}

export async function submitFinalDecision(errorId, decidedById, decision, notes = '') {
  try {
    const { data, error } = await supabase
      .from('final_decisions')
      .insert({
        error_id: errorId,
        decided_by_id: decidedById,
        decision: decision,
        notes: notes,
        decided_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;

    // Update error status
    await supabase
      .from('errors')
      .update({ status: 'finalized' })
      .eq('id', errorId);

    return data;
  } catch (error) {
    console.error('SubmitFinalDecision error:', error);
    throw error;
  }
}

// ==================== ESCALATION FUNCTIONS ====================

export async function submitEscalation(assignmentId, escalatedById, escalatedToId, reason) {
  try {
    const { data, error } = await supabase
      .from('escalations')
      .insert({
        assignment_id: assignmentId,
        escalated_by_id: escalatedById,
        escalated_to_id: escalatedToId,
        reason: reason,
        status: 'pending',
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('SubmitEscalation error:', error);
    throw error;
  }
}

export async function getEscalations(userId = null, filters = {}) {
  try {
    let query = supabase
      .from('escalations')
      .select(`
        *,
        order_assignments (
          orders (*),
          users!order_assignments_quality_agent_id_fkey (name)
        ),
        users!escalations_escalated_by_id_fkey (name),
        users!escalations_escalated_to_id_fkey (name)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('escalated_to_id', userId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetEscalations error:', error);
    throw error;
  }
}

// ==================== TEAM & SCHEDULING FUNCTIONS ====================

export async function getTeamMembers(role = null) {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetTeamMembers error:', error);
    throw error;
  }
}

export async function getTeamSchedule() {
  try {
    const { data, error } = await supabase
      .from('team_schedule')
      .select(`
        *,
        users (name, role)
      `)
      .order('user_id')
      .order('shift_date');  // استخدم shift_date بدل day_of_week

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetTeamSchedule error:', error);
    // بيانات تجريبية ك fallback
    return [];
  }
}

export async function updateTeamSchedule(scheduleData) {
  try {
    const { data, error } = await supabase
      .from('team_schedule')
      .upsert(scheduleData)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('UpdateTeamSchedule error:', error);
    throw error;
  }
}

// ==================== NOTIFICATION FUNCTIONS ====================

export async function getNotifications(userId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetNotifications error:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('MarkNotificationAsRead error:', error);
    throw error;
  }
}

export async function createNotification(userId, message, type = 'info') {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message: message,
        type: type,
        is_read: false,
        created_at: new Date()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('CreateNotification error:', error);
    throw error;
  }
}

// ==================== ANALYTICS & REPORTING FUNCTIONS ====================

export async function getPerformanceMetrics(period = 'month', agentId = null) {
  try {
    let dateFilter = new Date();
    
    switch (period) {
      case 'week':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case 'month':
        dateFilter.setMonth(dateFilter.getMonth() - 1);
        break;
      case 'quarter':
        dateFilter.setMonth(dateFilter.getMonth() - 3);
        break;
      default:
        dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    const { data: ordersData, error: ordersError } = await supabase
      .from('order_assignments')
      .select('id, status, assigned_at')
      .gte('assigned_at', dateFilter.toISOString());

    if (ordersError) throw ordersError;

    const { data: errorsData, error: errorsError } = await supabase
      .from('errors')
      .select('id, recorded_at, status')
      .gte('recorded_at', dateFilter.toISOString());

    if (errorsError) throw errorsError;

    const { data: reviewsData, error: reviewsError } = await supabase
      .from('quality_reviews')
      .select('id, action_correctness, reviewed_at')
      .gte('reviewed_at', dateFilter.toISOString());

    if (reviewsError) throw reviewsError;

    const totalOrders = ordersData.length;
    const completedOrders = ordersData.filter(o => o.status === 'completed').length;
    const totalErrors = errorsData.length;
    const correctReviews = reviewsData.filter(r => r.action_correctness === 'correct').length;
    
    const errorRate = totalOrders > 0 ? (totalErrors / totalOrders * 100).toFixed(2) : 0;
    const accuracyRate = reviewsData.length > 0 ? (correctReviews / reviewsData.length * 100).toFixed(2) : 0;

    return {
      totalOrders,
      completedOrders,
      totalErrors,
      errorRate: parseFloat(errorRate),
      accuracyRate: parseFloat(accuracyRate),
      pendingReviews: totalOrders - completedOrders
    };
  } catch (error) {
    console.error('GetPerformanceMetrics error:', error);
    throw error;
  }
}

export async function getErrorTrends(period = '6 months') {
  try {
    const { data, error } = await supabase
      .from('errors')
      .select('recorded_at, quality_reviews(modified_reason)')
      .order('recorded_at', { ascending: true });

    if (error) throw error;

    // Process data for charts
    const monthlyData = {};
    data.forEach(error => {
      const month = new Date(error.recorded_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month]++;
    });

    return {
      labels: Object.keys(monthlyData),
      values: Object.values(monthlyData)
    };
  } catch (error) {
    console.error('GetErrorTrends error:', error);
    throw error;
  }
}

export async function getDepartmentPerformance() {
  try {
    const { data, error } = await supabase
      .from('quality_reviews')
      .select('department, action_correctness');

    if (error) throw error;

    const departmentData = {};
    data.forEach(review => {
      if (!departmentData[review.department]) {
        departmentData[review.department] = { total: 0, errors: 0 };
      }
      departmentData[review.department].total++;
      if (review.action_correctness === 'error') {
        departmentData[review.department].errors++;
      }
    });

    const departments = Object.keys(departmentData);
    const errorRates = departments.map(dept => {
      const rate = (departmentData[dept].errors / departmentData[dept].total * 100).toFixed(1);
      return parseFloat(rate);
    });

    return {
      departments,
      errorRates
    };
  } catch (error) {
    console.error('GetDepartmentPerformance error:', error);
    throw error;
  }
}

// ==================== DATA IMPORT FUNCTIONS ====================

export async function importOrdersFromCSV(csvData) {
  try {
    // Parse CSV data and transform to match orders table structure
    const orders = csvData.map(row => ({
      order_id: row.order_id,
      employee_name: row.employee_name,
      admin_id: row.admin_id,
      reason: row.reason,
      amount: parseFloat(row.amount) || 0,
      chefz: row.chefz,
      order_status: row.order_status,
      requested_delivery_date: row.requested_delivery_date,
      payment_type: row.payment_type,
      raw_data: row,
      recorded_at: new Date()
    }));

    const { data, error } = await supabase
      .from('orders')
      .insert(orders)
      .select();

    if (error) throw error;

    // Create notifications for new orders
    const qualityAgents = await getTeamMembers('quality');
    for (const agent of qualityAgents) {
      await createNotification(
        agent.id,
        `${orders.length} new orders have been imported and are ready for assignment.`,
        'info'
      );
    }

    return data;
  } catch (error) {
    console.error('ImportOrdersFromCSV error:', error);
    throw error;
  }
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export function subscribeToNotifications(userId, callback) {
  try {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  } catch (error) {
    console.error('SubscribeToNotifications error:', error);
    // Return a mock subscription object to prevent errors
    return {
      unsubscribe: () => {}
    };
  }
}

export function subscribeToAssignments(agentId, callback) {
  try {
    return supabase
      .channel('assignments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_assignments',
          filter: `quality_agent_id=eq.${agentId}`
        },
        callback
      )
      .subscribe();
  } catch (error) {
    console.error('SubscribeToAssignments error:', error);
    // Return a mock subscription object to prevent errors
    return {
      unsubscribe: () => {}
    };
  }
}

export function subscribeToEscalations(userId, callback) {
  try {
    return supabase
      .channel('escalations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'escalations',
          filter: `escalated_to_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  } catch (error) {
    console.error('SubscribeToEscalations error:', error);
    // Return a mock subscription object to prevent errors
    return {
      unsubscribe: () => {}
    };
  }
}
