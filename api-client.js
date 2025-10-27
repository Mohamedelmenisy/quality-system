// api-client.js - QualityX System
// ================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// الرجاء التأكد من أن هذه القيم مطابقة تماماً لما هو موجود في لوحة تحكم Supabase
// Project Settings -> API
const SUPABASE_URL = "https://otaztiyatvbajswowdgs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YXp0aXlhdHZiYWpzd293ZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI4NTYsImV4cCI6MjA3NjI3ODg1Nn0.wmAvCpj8TpKjeuWF1OrjvXnxucMCFhhQrK0skA0SQhc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== AUTH FUNCTIONS ====================

export async function signUp(email, password, name, department = null) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: { data: { name: name, department: department } }
    });
    if (error) throw error;
    const user = data.user;
    if (user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: user.id, name: name, email: email, role: 'quality', department: department, first_login: new Date(), status: 'offline' });
      if (insertError) throw insertError;
    }
    return user;
  } catch (error) {
    console.error('💥 SignUp Error:', error);
    throw error;
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email, password: password });
    if (error) throw error;
    const user = data.user;
    await supabase.from('users').update({ last_seen: new Date(), status: 'online' }).eq('id', user.id);
    return user;
  } catch (error) {
    console.error('💥 SignIn Error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data?.user || null;
  } catch (error) {
    console.error('💥 GetCurrentUser error:', error);
    return null;
  }
}

// ==================== USER DATA FUNCTIONS ====================

export async function getUserData(email) {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error) throw new Error('User data not found in database');
    return data;
  } catch (error) {
    console.error('💥 GetUserData error:', error);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetUserById error:', error);
    throw error;
  }
}

export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase.from('users').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('UpdateUserProfile error:', error);
    throw error;
  }
}

// ==================== COMPANY & DEPARTMENT FUNCTIONS ====================

export async function getCompanyEmployees() {
  try {
    const { data, error } = await supabase.from('employees').select('*').order('employee_name', { ascending: true });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetCompanyEmployees error:', error);
    throw error;
  }
}

export async function addCompanyEmployee(employeeData) {
    try {
        const { data, error } = await supabase.from('employees').insert(employeeData).select().single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('AddCompanyEmployee error:', error);
        throw error;
    }
}

export async function updateCompanyEmployee(employeeId, updates) {
    try {
        const { data, error } = await supabase.from('employees').update(updates).eq('id', employeeId).select().single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('UpdateCompanyEmployee error:', error);
        throw error;
    }
}

export async function getDepartments() {
    const { data, error } = await supabase.from('departments').select('*, head:users(name)');
    if (error) throw error;
    return data;
}

export async function addDepartment(departmentData) {
    try {
        const { data, error } = await supabase.from('departments').insert(departmentData).select().single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('AddDepartment error:', error);
        throw error;
    }
}

export async function getCompanyDepartments() {
  try {
    const { data, error } = await supabase.from('employees').select('department');
    if (error) throw error;
    const departments = [...new Set(data.map(item => item.department).filter(Boolean))];
    return departments.sort();
  } catch (error) {
    console.error('GetCompanyDepartments error:', error);
    return [];
  }
}

// ==================== ORDER & ASSIGNMENT FUNCTIONS ====================

export async function getUnassignedOrders() {
  try {
    const { data: assigned, error: assignedError } = await supabase.from('order_assignments').select('order_id');
    if (assignedError) throw assignedError;
    const assignedIds = assigned.map(a => a.order_id);
    let query = supabase.from('orders').select('*');
    if (assignedIds.length > 0) {
      query = query.not('order_id', 'in', `(${assignedIds.join(',')})`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetUnassignedOrders error:', error);
    throw error;
  }
}

export async function assignOrders(orderIds, agentId, assignedById) {
  try {
    const assignments = orderIds.map(orderId => ({ order_id: orderId, quality_agent_id: agentId, assigned_by_id: assignedById, status: 'pending' }));
    const { data, error } = await supabase.from('order_assignments').insert(assignments).select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('AssignOrders error:', error);
    throw error;
  }
}

export async function reassignOrder(assignmentId, newAgentId, reassignedById) {
  try {
    const { data, error } = await supabase.from('order_assignments').update({ quality_agent_id: newAgentId, assigned_by_id: reassignedById, assigned_at: 'now()', status: 'pending' }).eq('id', assignmentId).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('ReassignOrder error:', error);
    throw error;
  }
}

export async function updateAssignmentStatus(assignmentId, newStatus) {
  try {
    const { data, error } = await supabase.from('order_assignments').update({ status: newStatus }).eq('id', assignmentId);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('UpdateAssignmentStatus error:', error);
    throw error;
  }
}

export async function getAssignedOrders(agentId = null, filters = {}) {
  try {
    let query = supabase
      .from('order_assignments')
      .select(`id, order_id, status, assigned_at, completed_at, orders(*), users!order_assignments_quality_agent_id_fkey(name, email), inquiries(*, raised_by:users!inquiries_raised_by_id_fkey(name), responded_by:users!inquiries_responded_by_id_fkey(name)), escalations(*, escalated_by:users!escalations_escalated_by_id_fkey(name), escalated_to:users!escalations_escalated_to_id_fkey(name)), quality_reviews(*)`)
      .order('assigned_at', { ascending: false });

    if (agentId) query = query.eq('quality_agent_id', agentId);
    // ... add filters logic ...
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetAssignedOrders error:', error);
    throw error;
  }
}

// ==================== QUALITY REVIEW & ERROR FUNCTIONS ====================

export async function submitReview(assignmentId, reviewData) {
  try {
    const { data: review, error: reviewError } = await supabase.from('quality_reviews').insert({ assignment_id: assignmentId, action_correctness: reviewData.action_correctness, department: reviewData.department, modified_reason: reviewData.modified_reason, modification_details: reviewData.notes, reviewed_at: new Date(), employee_raw_name: reviewData.employee_raw_name }).select('id, employee_raw_name').single();
    if (reviewError) throw reviewError;

    if (reviewData.action_correctness === 'error') {
      const { data: employee } = await supabase.from('employees').select('id').eq('employee_name', review.employee_raw_name.trim()).single();
      if (employee) {
        await supabase.from('errors').insert({ review_id: review.id, employee_id: employee.id, status: 'closed' });
      }
    }
    await supabase.from('order_assignments').update({ status: 'completed', completed_at: 'now()' }).eq('id', assignmentId);
    return review;
  } catch (error) {
    console.error('SubmitReview error:', error);
    throw error;
  }
}

export async function getAgentErrors(agentId, filters = {}) {
  try {
    const { data: rawErrors, error: rpcError } = await supabase.rpc('get_errors_for_agent', { agent_uuid: agentId });
    if (rpcError) throw rpcError;
    if (!rawErrors || rawErrors.length === 0) return [];
    const errorIds = rawErrors.map(e => e.error_id);
    const { data: decisions } = await supabase.from('final_decisions').select(`error_id, decision, notes, decided_at, decided_by:users!final_decisions_decided_by_id_fkey(name)`).in('error_id', errorIds);
    return rawErrors.map(error => ({ ...error, ...decisions?.find(d => d.error_id === error.error_id) }));
  } catch (error) {
    console.error('GetAgentErrors error:', error);
    throw error;
  }
}

export async function submitFinalDecision(errorId, decidedById, decision, notes = '', reviewingAgentId = null) {
  try {
    const { data, error } = await supabase.from('final_decisions').insert({ error_id: errorId, decided_by_id: decidedById, decision: decision, notes: notes, decided_at: new Date(), reviewing_agent_id: reviewingAgentId }).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('SubmitFinalDecision error:', error);
    throw error;
  }
}

export async function getAppealedErrors() {
  try {
    const { data, error } = await supabase.rpc('get_appealed_errors');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetAppealedErrors error:', error);
    throw error;
  }
}

export async function getFinalizedDecisions() {
  try {
    const { data, error } = await supabase.rpc('get_finalized_decisions');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetFinalizedDecisions error:', error);
    throw error;
  }
}

// ==================== ESCALATION & INQUIRY FUNCTIONS ====================

export async function submitEscalation(assignmentId, escalatedById, escalatedToId, reason, additionalNotes) {
  try {
    const combinedNotes = `Reason: ${reason}\n\nAdditional Notes: ${additionalNotes}`;
    const { data, error } = await supabase.from('escalations').insert({ assignment_id: assignmentId, escalated_by_id: escalatedById, escalated_to_id: escalatedToId, notes: combinedNotes, status: 'pending', escalated_at: new Date() }).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('SubmitEscalation error:', error);
    throw error;
  }
}

export async function getEscalations(userId = null, filters = {}) {
  try {
    let query = supabase.from('escalations').select(`*, order_assignments!escalations_assignment_id_fkey(*, orders(*), users!order_assignments_quality_agent_id_fkey(name)), escalated_by:users!escalations_escalated_by_id_fkey(name), escalated_to:users!escalations_escalated_to_id_fkey(name)`).order('escalated_at', { ascending: false });
    if (userId) query = query.eq('escalated_to_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetEscalations error:', error);
    throw error;
  }
}

export async function resolveEscalation(escalationId, feedback) {
  try {
    await supabase.from('escalations').update({ status: 'resolved', feedback: feedback, resolved_at: new Date().toISOString() }).eq('id', escalationId);
  } catch (error) {
    console.error('ResolveEscalation error:', error);
    throw error;
  }
}

// ... other functions like getHelperEscalations, raiseInquiry, respondToInquiry etc.

// ==================== TEAM & SCHEDULING FUNCTIONS ====================

export async function getTeamMembers(roles = []) {
  try {
    let query = supabase.from('users').select('*').eq('is_active', true).order('name');
    if (roles.length > 0) query = query.in('role', roles);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetTeamMembers error:', error);
    throw error;
  }
}

// ... other scheduling functions ...

// ==================== ANALYTICS & REPORTING FUNCTIONS ===================

// [AI-FIX] This is the single, unified, and correct function.
export async function getPerformanceMetrics(agentId = null) {
  try {
    let rpcName;
    let params = {};
    let isSeniorOrManager = false;

    if (agentId) {
      rpcName = 'get_quality_dashboard_kpis';
      params = { p_agent_id: agentId };
    } else {
      isSeniorOrManager = true;
      const { data: { user } } = await supabase.auth.getUser();
      const userRole = user?.user_metadata?.role || 'senior';

      if (userRole === 'manager') {
        rpcName = 'get_manager_dashboard_kpis';
      } else {
        rpcName = 'get_senior_dashboard_kpis';
      }
    }

    const { data, error } = await supabase.rpc(rpcName, params);
    if (error) throw error;
    
    const metrics = data[0];
    if (!metrics) {
        return { completedOrders: 0, pendingEscalations: 0, avgResolutionTime: 0, accuracyRate: 0, pendingReviews: 0, escalationRate: 0, totalOrders: 0, qualityTeamAccuracy: 'N/A' };
    }

    if (isSeniorOrManager) {
        if (rpcName === 'get_manager_dashboard_kpis') {
            return {
                totalOrders: metrics.total_reviews_today || 0,
                accuracyRate: metrics.overall_team_accuracy ? parseFloat(metrics.overall_team_accuracy).toFixed(1) : 100.0,
                qualityTeamAccuracy: metrics.quality_team_accuracy !== undefined ? parseFloat(metrics.quality_team_accuracy).toFixed(1) : 'N/A'
            };
        } else { // Senior
            return {
                completedOrders: metrics.reviews_today || 0,
                pendingEscalations: metrics.pending_escalations || 0,
                avgResolutionTime: metrics.avg_resolution_time_minutes || 0,
                accuracyRate: metrics.team_accuracy ? parseFloat(metrics.team_accuracy).toFixed(1) : 0.0
            };
        }
    } else { // Quality Agent
       return {
            completedOrders: metrics.todays_reviews || 0,
            pendingReviews: metrics.open_cases || 0,
            accuracyRate: metrics.avg_quality_score ? parseFloat(metrics.avg_quality_score).toFixed(1) : 100.0,
            escalationRate: metrics.escalation_rate ? parseFloat(metrics.escalation_rate).toFixed(1) : 0.0
        };
    }
  } catch (error) {
    console.error(`Error in getPerformanceMetrics (agentId: ${agentId}):`, error);
    return { completedOrders: 0, pendingEscalations: 0, avgResolutionTime: 0, accuracyRate: 0, pendingReviews: 0, escalationRate: 0, totalOrders: 0, qualityTeamAccuracy: 'N/A' };
  }
}

export async function getErrorTrends() {
  try {
    const { data, error } = await supabase.rpc('get_error_trends_last_30_days');
    if (error) throw error;
    const labels = data.map(d => new Date(d.error_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const values = data.map(d => d.error_count);
    return { labels, values };
  } catch (error) {
    console.error('GetErrorTrends error:', error);
    return { labels: [], values: [] };
  }
}

export async function getDepartmentPerformance() {
  try {
    const { data, error } = await supabase.rpc('get_department_performance');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching department performance:', error);
    return [];
  }
}

export async function getTeamPerformance() {
  try {
    const { data, error } = await supabase.rpc('get_team_performance');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetTeamPerformance error:', error);
    return [];
  }
}

export async function getAgentAccuracySummary(period) {
  try {
    const { data, error } = await supabase.rpc('get_agent_accuracy_summary', { period_filter: period });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching agent accuracy summary:', error);
    return [];
  }
}

export async function getReviewsVsOverturnedSummary(period) {
  try {
    const { data, error } = await supabase.rpc('get_reviews_vs_overturned_summary', { period_filter: period });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching reviews vs overturned summary:', error);
    return [];
  }
}

export async function getQualityAgentPerformance(agentId) {
  try {
    const { data, error } = await supabase.rpc('get_quality_agent_performance', { agent_id: agentId });
    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('GetQualityAgentPerformance error:', error);
    return { total_reviews: 0, overturned_reviews: 0, accuracy: 100.0 };
  }
}

export async function getOverturnedReviewsForAgent(agentId) {
  try {
    const { data, error } = await supabase.rpc('get_overturned_reviews_for_agent', { p_agent_id: agentId });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching overturned reviews:', error);
    return [];
  }
}

export async function getErrorTypesSummary(period) {
  try {
    const { data, error } = await supabase.rpc('get_error_types_summary', { period_filter: period });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching error types summary:', error);
    return [];
  }
}


// ==================== KPI & SETTINGS FUNCTIONS ====================

export async function getKpiTargets() {
  try {
    const { data, error } = await supabase.from('kpi_targets').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data || { accuracy_target: 98, reviews_per_day: 25 };
  } catch (error) {
    console.error('Error fetching KPI targets:', error);
    return { accuracy_target: 98, reviews_per_day: 25 };
  }
}

export async function updateKpiTargets(targets) {
  try {
    const { data, error } = await supabase.from('kpi_targets').update(targets).eq('id', 1).select().single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating KPI targets:', error);
    throw error;
  }
}


// ==================== REAL-TIME SUBSCRIPTIONS ====================

export function subscribeToAssignmentUpdates(callback) {
  try {
    return supabase.channel('assignment-updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_assignments' }, callback).subscribe();
  } catch (error) {
    console.error('SubscribeToAssignmentUpdates error:', error);
    return { unsubscribe: () => {} };
  }
}

export function subscribeToErrors(agentId, callback) {
  try {
    return supabase
      .channel('errors')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'errors', filter: `employee_id=eq.${agentId}` }, callback)
      .subscribe();
  } catch (error) {
    console.error('SubscribeToErrors error:', error);
    return { unsubscribe: () => {} };
  }
}
