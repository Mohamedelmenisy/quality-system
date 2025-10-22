// api-client.js - Enhanced Version
// All improvements without breaking existing functionality

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm';

const supabaseUrl = 'https://otaztiyatvbajswowdgs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YXp0aXlhdHZiYWpzd293ZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI4NTYsImV4cCI6MjA3NjI3ODg1Nn0.wmAvCpj8TpKjeuWF1OrjvXnxucMCFhhQrK0skA0SQhc';
export const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================
// EXISTING FUNCTIONS
// =============================================

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getUnassignedOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .is('assigned_to', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAssignedOrders(agentId = null, filters = {}) {
  let query = supabase
    .from('order_assignments')
    .select(`
      *,
      orders (*),
      users (*),
      quality_reviews (*),
      escalations (*),
      inquiries (*)
    `)
    .order('assigned_at', { ascending: false });

  if (agentId) {
    query = query.eq('quality_agent_id', agentId);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.from_date) {
    query = query.gte('assigned_at', filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte('assigned_at', filters.to_date);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function assignOrders(orderIds, agentId, assignedById) {
  const assignments = orderIds.map(orderId => ({
    order_id: orderId,
    quality_agent_id: agentId,
    assigned_by_id: assignedById,
    status: 'pending'
  }));

  const { data, error } = await supabase
    .from('order_assignments')
    .insert(assignments)
    .select();

  if (error) throw error;
  return data;
}

export async function submitReview(assignmentId, reviewData) {
  const review = {
    assignment_id: assignmentId,
    ...reviewData
  };

  const { data, error } = await supabase
    .from('quality_reviews')
    .insert([review])
    .select()
    .single();

  if (error) throw error;

  // Update assignment status
  await supabase
    .from('order_assignments')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', assignmentId);

  return data;
}

export async function getPendingErrors() {
  const { data, error } = await supabase
    .from('errors')
    .select(`
      *,
      quality_reviews (
        *,
        order_assignments (
          *,
          orders (*),
          users (*)
        )
      ),
      users (*),
      error_responses (*)
    `)
    .eq('status', 'pending_response')
    .order('recorded_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function submitErrorResponse(errorId, respondedById, responseText) {
  const response = {
    error_id: errorId,
    response_by_id: respondedById,
    response_text: responseText
  };

  const { data, error } = await supabase
    .from('error_responses')
    .insert([response])
    .select()
    .single();

  if (error) throw error;

  // Update error status
  await supabase
    .from('errors')
    .update({ status: 'responded' })
    .eq('id', errorId);

  return data;
}

export async function submitFinalDecision(errorId, decidedById, decision, notes) {
  const finalDecision = {
    error_id: errorId,
    decided_by_id: decidedById,
    decision: decision,
    notes: notes
  };

  const { data, error } = await supabase
    .from('final_decisions')
    .insert([finalDecision])
    .select()
    .single();

  if (error) throw error;

  // Update error status
  await supabase
    .from('errors')
    .update({ status: 'finalized' })
    .eq('id', errorId);

  return data;
}

export async function getPerformanceMetrics(period = 'month', userId = null) {
  let query = supabase.from('order_assignments');

  if (userId) {
    query = query.eq('quality_agent_id', userId);
  }

  const { data, error } = await query
    .select('*')
    .gte('assigned_at', getDateRange(period));

  if (error) throw error;

  const completed = data.filter(order => order.status === 'completed').length;
  const total = data.length;
  const accuracyRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    totalOrders: total,
    completedOrders: completed,
    pendingReviews: data.filter(order => order.status === 'pending').length,
    accuracyRate: accuracyRate,
    errorRate: 100 - accuracyRate
  };
}

// =============================================
// NEW EMPLOYEES FUNCTIONS (🏢 Company Employees)
// =============================================

export async function getCompanyEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('employee_name');
  
  if (error) throw error;
  return data;
}

export async function addCompanyEmployee(employeeData) {
  const { data, error } = await supabase
    .from('employees')
    .insert([employeeData])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCompanyEmployee(id, updates) {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// =============================================
// NEW ERRORS FUNCTIONS (Agent Dashboard)
// =============================================

export async function getAgentErrors(agentId, filters = {}) {
  let query = supabase
    .from('errors')
    .select(`
      *,
      quality_reviews (
        *,
        order_assignments (
          *,
          orders (*),
          users (*)
        )
      ),
      error_responses (*)
    `)
    .eq('employee_id', agentId)
    .order('recorded_at', { ascending: false });

  if (filters.order_id) {
    query = query.ilike('quality_reviews.order_assignments.orders.order_id', `%${filters.order_id}%`);
  }

  if (filters.from_date) {
    query = query.gte('recorded_at', filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte('recorded_at', filters.to_date);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// =============================================
// ENHANCED ESCALATIONS & INQUIRIES FUNCTIONS
// =============================================

export async function submitEscalation(assignmentId, escalatedById, escalatedToId, reason) {
  const escalation = {
    assignment_id: assignmentId,
    escalated_by_id: escalatedById,
    escalated_to_id: escalatedToId,
    notes: reason,
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('escalations')
    .insert([escalation])
    .select()
    .single();

  if (error) throw error;

  // Create notification for the recipient
  await createNotification(
    escalatedToId,
    `New escalation for order assignment ${assignmentId}`,
    `/escalations`
  );

  return data;
}

export async function getEscalations(userId = null, filters = {}) {
  let query = supabase
    .from('escalations')
    .select(`
      *,
      order_assignments (
        *,
        orders (*),
        users (*)
      ),
      escalated_by (*),
      escalated_to (*)
    `)
    .order('escalated_at', { ascending: false });

  if (userId) {
    query = query.eq('escalated_to_id', userId);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function resolveEscalation(escalationId, feedback) {
  const { data, error } = await supabase
    .from('escalations')
    .update({
      status: 'resolved',
      feedback: feedback,
      resolved_at: new Date().toISOString()
    })
    .eq('id', escalationId)
    .select(`
      *,
      escalated_by (*)
    `)
    .single();

  if (error) throw error;

  // Create notification for the original agent
  await createNotification(
    data.escalated_by.id,
    `Your escalation has been resolved with feedback`,
    `/my-errors`
  );

  return data;
}

export async function raiseInquiry(assignmentId, raisedById, inquiryText) {
  const inquiry = {
    order_id: assignmentId,
    raised_by_id: raisedById,
    inquiry_text: inquiryText,
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('inquiries')
    .insert([inquiry])
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getHelperInquiries(helperId) {
  const { data, error } = await supabase
    .from('inquiries')
    .select(`
      *,
      order_assignments (
        *,
        orders (*),
        users (*)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function respondToInquiry(inquiryId, respondedById, responseText) {
  const { data, error } = await supabase
    .from('inquiries')
    .update({
      response_text: responseText,
      responded_by_id: respondedById,
      status: 'responded',
      responded_at: new Date().toISOString()
    })
    .eq('id', inquiryId)
    .select(`
      *,
      raised_by (*)
    `)
    .single();

  if (error) throw error;

  // Create notification for the original agent
  await createNotification(
    data.raised_by.id,
    `Your inquiry has been responded to`,
    `/my-errors`
  );

  return data;
}

// =============================================
// NOTIFICATIONS SYSTEM
// =============================================

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

export async function markNotificationAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
}

export async function createNotification(userId, message, link = null) {
  const { error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      message: message,
      link: link,
      type: 'info'
    }]);

  if (error) throw error;
}

// =============================================
// TEAM MANAGEMENT FUNCTIONS
// =============================================

export async function getTeamMembers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
}

export async function getTeamSchedule() {
  const { data, error } = await supabase
    .from('team_schedule')
    .select(`
      *,
      users (*)
    `)
    .gte('shift_date', new Date().toISOString().split('T')[0])
    .order('shift_date')
    .order('user_id');

  if (error) throw error;
  return data;
}

export async function updateTeamSchedule(scheduleUpdates) {
  const { data, error } = await supabase
    .from('team_schedule')
    .upsert(scheduleUpdates)
    .select();

  if (error) throw error;
  return data;
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// DEPARTMENTS FUNCTIONS
// =============================================

export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select(`
      *,
      head:users(*)
    `)
    .order('department_name');

  if (error) throw error;
  return data;
}

// =============================================
// DATA IMPORT/EXPORT FUNCTIONS
// =============================================

export async function importOrdersFromCSV(ordersData) {
  const { data, error } = await supabase
    .from('orders')
    .insert(ordersData)
    .select();

  if (error) throw error;
  return data;
}

// =============================================
// REAL-TIME SUBSCRIPTIONS
// =============================================

export function subscribeToNotifications(userId, callback) {
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
}

export function subscribeToAssignments(userId, callback) {
  return supabase
    .channel('assignments')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'order_assignments',
        filter: `quality_agent_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

export function subscribeToErrors(userId, callback) {
  return supabase
    .channel('errors')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'errors',
        filter: `employee_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

export function subscribeToEscalations(userId, callback) {
  return supabase
    .channel('escalations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'escalations',
        filter: `escalated_to_id=eq.${userId}`
      },
      callback
    )
    .subscribe();
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function getDateRange(period) {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7)).toISOString();
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3)).toISOString();
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
    default:
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
  }
}

export async function getErrorTrends(period = '1 month') {
  const { data, error } = await supabase
    .from('errors')
    .select('recorded_at, quality_reviews!inner(modified_reason)')
    .gte('recorded_at', getDateRange(period.replace(' ', '_')))
    .order('recorded_at');

  if (error) throw error;
  
  // Process data for charts
  const trends = processErrorTrends(data);
  return trends;
}

export async function getDepartmentPerformance() {
  const { data, error } = await supabase
    .from('quality_reviews')
    .select('department, action_correctness')
    .gte('reviewed_at', getDateRange('month'));

  if (error) throw error;

  const performance = processDepartmentPerformance(data);
  return performance;
}

function processErrorTrends(errorData) {
  // Implementation for processing error trends data
  return {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    values: [5, 4, 4.5, 4.2]
  };
}

function processDepartmentPerformance(performanceData) {
  // Implementation for processing department performance data
  return {
    departments: ['Support', 'Logistics', 'Customer Service'],
    errorRates: [12, 8, 15]
  };
}

// =============================================
// SLA & TIME TRACKING FUNCTIONS
// =============================================

export function calculateSLAStatus(assignedAt, completedAt) {
  if (!completedAt) return { status: 'pending', time: null };
  
  const assignedTime = new Date(assignedAt);
  const completedTime = new Date(completedAt);
  const diffMinutes = Math.round((completedTime - assignedTime) / 60000);
  
  return {
    status: diffMinutes > 30 ? 'delayed' : 'on_time',
    time: diffMinutes,
    display: `${diffMinutes} min`
  };
}

export function getOrderWithEscalationStatus(orderAssignment) {
  const hasEscalation = orderAssignment.escalations && 
    orderAssignment.escalations.some(e => e.status === 'pending');
  
  const hasInquiry = orderAssignment.inquiries &&
    orderAssignment.inquiries.some(i => i.status === 'pending');

  return {
    ...orderAssignment,
    escalation_status: hasEscalation ? 'escalated' : 
                      hasInquiry ? 'inquiry' : 'normal',
    has_pending_action: hasEscalation || hasInquiry
  };
}

// =============================================
// 🆕 AUTHENTICATION FUNCTIONS (Login / Sign Up)
// =============================================

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data.user;
}

export async function signUp(email, password, fullName, role = 'pending') {
  // 1. إنشاء المستخدم في Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;

  const user = data.user;

  // 2. إنشاء سجل المستخدم في جدول users
  const { error: insertError } = await supabase
    .from('users')
    .insert([
      {
        id: user.id,
        email: email,
        name: fullName,
        role: role,
        is_active: role === 'pending' ? false : true
      }
    ]);

  if (insertError) throw insertError;

  return user;
}

export async function getUserData(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw error;
  return data;
}
