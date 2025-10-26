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
          role: 'quality',
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

// api-client.js

export async function getQualityAgentPerformance(agentId) {
  try {
    const { data, error } = await supabase.rpc('get_quality_agent_performance', { agent_id: agentId });
    if (error) throw error;
    // The RPC function returns an array with one object, so we return that object.
    return data[0];
  } catch (error) {
    console.error('GetQualityAgentPerformance error:', error);
    return { total_reviews: 0, overturned_reviews: 0, accuracy: 100.0 };
  }
}

// api-client.js

export async function getAgentMonthlyPerformance(agentId) {
  try {
    const { data, error } = await supabase.rpc('get_agent_monthly_performance', { p_agent_id: agentId });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching agent monthly performance:', error);
    return [];
  }
}


export async function getAgentIssueTypes(agentId) {
  try {
    const { data, error } = await supabase.rpc('get_agent_issue_types', { p_agent_id: agentId });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching agent issue types:', error);
    return [];
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

// ==================== COMPANY EMPLOYEE FUNCTIONS ====================

export async function getCompanyEmployees() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('employee_name', { ascending: true });

    if (error) {
      console.error('Error fetching company employees:', error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error('GetCompanyEmployees error:', error);
    throw error;
  }
}

export async function addCompanyEmployee(employeeData) {
    try {
        const { data, error } = await supabase
            .from('employees')
            .insert(employeeData)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('AddCompanyEmployee error:', error);
        throw error;
    }
}

export async function updateCompanyEmployee(employeeId, updates) {
    try {
        const { data, error } = await supabase
            .from('employees')
            .update(updates)
            .eq('id', employeeId)
            .select()
            .single();

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

export async function getErrorReasons() {
  try {
    const { data, error } = await supabase
      .from('error_reasons')
      .select('reason_text')
      .eq('is_active', true)
      .order('reason_text');

    if (error) throw error;
    return data.map(item => item.reason_text);
  } catch (error) {
    console.error('GetErrorReasons error:', error);
    return [];
  }
}

export async function getTeamAccuracyKpi() {
  try {
    const { data, error } = await supabase.rpc('get_team_accuracy_kpi');
    if (error) throw error;
    return data[0]?.quality_team_accuracy || 100.0;
  } catch(error) {
    console.error("Error fetching team accuracy KPI:", error);
    return 100.0;
  }
}


export async function getCompanyDepartments() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('department');

    if (error) throw error;

    const departments = [...new Set(data.map(item => item.department).filter(Boolean))];
    return departments.sort();

  } catch (error) {
    console.error('GetCompanyDepartments error:', error);
    return [];
  }
}

// ==================== ORDER FUNCTIONS ====================

export async function getOrders(filters = {}) {
  try {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.order_id) query = query.ilike('order_id', `%${filters.order_id}%`);
    if (filters.from_date) query = query.gte('created_at', filters.from_date);
    if (filters.to_date) query = query.lte('created_at', filters.to_date);
    if (filters.status) query = query.eq('status', filters.status);

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
    const { data: assignedOrdersData, error: assignedOrdersError } = await supabase
      .from('order_assignments')
      .select('order_id');

    if (assignedOrdersError) throw assignedOrdersError;

    const assignedOrderIds = assignedOrdersData.map(assignment => assignment.order_id);

    let query = supabase.from('orders').select('*');

    if (assignedOrderIds.length > 0) {
      query = query.not('order_id', 'in', `(${assignedOrderIds.map(id => `'${id}'`).join(',')})`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('GetUnassignedOrders error:', error);
    throw error;
  }
}


export async function getTeamPerformance() {
  try {
    // This RPC function should return data like: [{ agent_name, accuracy, total_reviews }]
    const { data, error } = await supabase.rpc('get_team_performance');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetTeamPerformance error:', error);
    return [];
  }
}

export async function assignOrders(orderIds, agentId, assignedById) {
  try {
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
  } catch (error) {
    console.error('AssignOrders error:', error);
    throw error;
  }
}

// أضف هذه الوظيفة الجديدة
export async function reassignOrder(assignmentId, newAgentId, reassignedById) {
  try {
    console.log(`🔄 Reassigning assignment ${assignmentId} to agent ${newAgentId}`);

    const { data, error } = await supabase
      .from('order_assignments')
      .update({
        quality_agent_id: newAgentId,
        assigned_by_id: reassignedById,
        assigned_at: 'now()', // تحديث تاريخ التعيين
        status: 'pending' // إعادة الحالة إلى pending للموظف الجديد
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      console.error('❌ Reassign order error:', error);
      throw error;
    }

    console.log('✅ Order reassigned successfully:', data);
    return data;
  } catch (error) {
    console.error('💥 ReassignOrder error:', error);
    throw error;
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

// أضف هذه الوظيفة الجديدة لتحديث الحالة
export async function updateAssignmentStatus(assignmentId, newStatus) {
  try {
    const { data, error } = await supabase
      .from('order_assignments')
      .update({ status: newStatus })
      .eq('id', assignmentId);

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
      .select(`
    id, 
    order_id, 
    status, 
    assigned_at, 
    completed_at,
    orders (*),
    users!order_assignments_quality_agent_id_fkey (name, email),
    inquiries (
        *,
        raised_by:users!inquiries_raised_by_id_fkey(name),
        responded_by:users!inquiries_responded_by_id_fkey(name)
    ),
    escalations (
        *,
        escalated_by:users!escalations_escalated_by_id_fkey(name),
        escalated_to:users!escalations_escalated_to_id_fkey(name)
    ),
    quality_reviews (*)
`)
      .order('assigned_at', { ascending: false });

    if (agentId) query = query.eq('quality_agent_id', agentId);
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'completed_today') {
        const today = new Date().toISOString().split('T')[0];
        query = query.eq('status', 'completed')
                    .gte('assigned_at', `${today}T00:00:00`)
                    .lte('assigned_at', `${today}T23:59:59`);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    if (filters.from_date) query = query.gte('assigned_at', filters.from_date);
    if (filters.to_date) query = query.lte('assigned_at', `${filters.to_date}T23:59:59`);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetAssignedOrders error:', error);
    throw error;
  }
}

// ==================== QUALITY REVIEW FUNCTIONS ====================

// [AI-FIX] This function has been improved to be more robust.
export async function submitReview(assignmentId, reviewData) {
  try {
    // 1. Insert the review record
    const { data: review, error: reviewError } = await supabase
      .from('quality_reviews')
      .insert({
        assignment_id: assignmentId,
        action_correctness: reviewData.action_correctness,
        department: reviewData.department,
        modified_reason: reviewData.modified_reason,
        modification_details: reviewData.notes,
        reviewed_at: new Date(),
        employee_raw_name: reviewData.employee_raw_name
      })
      .select('id, employee_raw_name')
      .single();

    if (reviewError) throw reviewError;

    // 2. If it's an error, find the employee and log the error
    if (reviewData.action_correctness === 'error') {
      const employeeNameToFind = review.employee_raw_name.replace(/"/g, '').trim();
      let employee = null;

      // --- IMPROVEMENT START ---
      // Attempt 1: Find by exact username match (the original, faster method)
      const { data: employeeByUsername } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_username', employeeNameToFind)
        .single();

      if (employeeByUsername) {
        employee = employeeByUsername;
      } else {
        // Attempt 2: Fallback to find by exact full name match (slower but more reliable)
        console.warn(`Could not find employee by username: "${employeeNameToFind}". Falling back to search by full name.`);
        const { data: employeeByName } = await supabase
          .from('employees')
          .select('id')
          .eq('employee_name', employeeNameToFind)
          .single();
        employee = employeeByName;
      }
      // --- IMPROVEMENT END ---

      if (employee) {
        // Log the error now that we have the employee ID
        const { error: insertError } = await supabase
          .from('errors')
          .insert({
            review_id: review.id,
            employee_id: employee.id, // Use the found employee ID
            status: 'closed',
            created_at: new Date()
          });

        if (insertError) throw insertError;
        console.log(`✅ Error successfully logged for employee ID: ${employee.id}`);

      } else {
        // This is a critical warning. The error was not logged for the agent.
        console.error(`❌ CRITICAL: Could not find employee matching name/username: "${employeeNameToFind}". The error was NOT logged for the agent.`);
        // You could optionally create a notification for an admin here.
      }
    }

    // 3. Finally, update the assignment status
    await supabase
      .from('order_assignments')
      .update({ status: 'completed', completed_at: 'now()' })
      .eq('id', assignmentId);

    return review;

  } catch (error) {
    console.error('SubmitReview error:', error);
    throw error;
  }
}

// ==================== ERROR FUNCTIONS ====================

// api-client.js
export async function getAgentErrors(agentId, filters = {}) {
  try {
    const { data: rawErrors, error: rpcError } = await supabase
      .rpc('get_errors_for_agent', { agent_uuid: agentId });

    if (rpcError) {
        console.error('RPC call error:', rpcError);
        throw rpcError;
    }

    if (!rawErrors || rawErrors.length === 0) {
        return [];
    }

    const errorIds = rawErrors.map(e => e.error_id);
    
    // --- THIS IS THE CORRECTED QUERY ---
    const { data: decisions, error: decisionError } = await supabase
        .from('final_decisions')
        .select(`
            error_id,
            decision,
            notes,
            decided_at,
            decided_by:users!final_decisions_decided_by_id_fkey ( name )
        `)
        .in('error_id', errorIds);

    if (decisionError) {
        // This is not a critical error, just a warning if decisions don't exist yet
        console.warn('Could not fetch final decisions:', decisionError.message);
    }

    const errorsWithDecisions = rawErrors.map(error => {
        const decision = decisions?.find(d => d.error_id === error.error_id);
        return {
            ...error,
            final_decision: decision?.decision,
            decision_notes: decision?.notes,
            decided_at: decision?.decided_at,
            decided_by_name: decision?.decided_by?.name
        };
    });
    
    let filteredData = errorsWithDecisions;
    if (filters.status && filters.status !== 'All Statuses') {
        filteredData = filteredData.filter(e => e.status === filters.status);
    }

    return filteredData;

  } catch (error) {
    console.error('GetAgentErrors error:', error);
    throw error;
  }
}

export async function addDepartment(departmentData) {
    try {
        const { data, error } = await supabase
            .from('departments')
            .insert(departmentData)
            .select()
            .single();
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('AddDepartment error:', error);
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
          order_assignments ( orders (*) )
        ),
        error_responses (*),
        employee:employees (employee_name, employee_username)
      `)
      .eq('status', 'pending_response')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetPendingErrors error:', error);
    throw error;
  }
}

// api-client.js -> NEW version
export async function submitFinalDecision(errorId, decidedById, decision, notes = '', reviewingAgentId = null) {
  try {
    const { data, error } = await supabase
      .from('final_decisions')
      .insert({
        error_id: errorId,
        decided_by_id: decidedById,
        decision: decision,
        notes: notes,
        decided_at: new Date(),
        reviewing_agent_id: reviewingAgentId // <-- Add the new field here
      })
      .select()
      .single();

    if (error) throw error;
    
    // The rest of the function remains the same, but for safety let's remove the status update from here
    // and keep it in the main handleFinalDecision function.
    /*
    await supabase
      .from('errors')
      .update({ status: 'finalized' })
      .eq('id', errorId);
    */

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

// ==================== ESCALATION FUNCTIONS ====================

export async function submitEscalation(assignmentId, escalatedById, escalatedToId, reason, additionalNotes) {
  try {
        const combinedNotes = `Reason: ${reason}\n\nAdditional Notes: ${additionalNotes}`;
    const { data, error } = await supabase
      .from('escalations')
      .insert({
        assignment_id: assignmentId,
        escalated_by_id: escalatedById,
        escalated_to_id: escalatedToId,
        notes: combinedNotes,
        status: 'pending',
        escalated_at: new Date()
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
        order_assignments!escalations_assignment_id_fkey (
          *,
          orders (*),
          users!order_assignments_quality_agent_id_fkey (name)
        ),
        escalated_by:users!escalations_escalated_by_id_fkey (name),
        escalated_to:users!escalations_escalated_to_id_fkey (name)
      `)
      .order('escalated_at', { ascending: false });

    if (userId) query = query.eq('escalated_to_id', userId);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetEscalations error:', error);
    throw error;
  }
}

// ... (Rest of the file remains the same)

// ==================== ESCALATION WORKFLOW FUNCTIONS ====================

export async function getHelperEscalations(helperId) {
  try {
    console.log('🔍 Fetching escalations for helper:', helperId);

    const { data, error } = await supabase
      .from('escalations')
      .select(`
        id,
        notes,
        status,
        created_at,
        order_assignments!escalations_assignment_id_fkey (
          id,
          status,
          assigned_at,
          orders (
            order_id,
            employee_name,
            reason,
            amount,
            chefz,
            order_status,
            payment_type
          ),
          users!order_assignments_quality_agent_id_fkey (
            name,
            email
          )
        )
      `)
      .eq('escalated_to_id', helperId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ GetHelperEscalations error:', error);
      throw error;
    }

    console.log('✅ Escalations fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('💥 GetHelperEscalations error:', error);
    throw error;
  }
}

export async function resolveEscalation(escalationId, feedback) {
  try {
    const { data: escalationData, error: fetchError } = await supabase
      .from('escalations')
      .select('escalated_by_id, order_assignments!inner(orders(order_id))')
      .eq('id', escalationId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('escalations')
      .update({
        status: 'resolved',
        feedback: feedback,
        resolved_at: new Date().toISOString()
      })
      .eq('id', escalationId)
      .select()
      .single();

    if (error) throw error;

    if (escalationData) {
      const orderId = escalationData.order_assignments?.orders?.order_id || 'Unknown';
      await createNotification(
        escalationData.escalated_by_id,
        `Your escalation for order ${orderId} has been resolved.`, 'info'
      );
    }
    return data;
  } catch (error) {
    console.error('💥 ResolveEscalation error:', error);
    throw error;
  }
}

export async function escalateToSenior(escalationId, seniorId, helperNotes) {
  try {
    console.log('🔄 Escalating to senior:', { escalationId, seniorId });

    const { data: currentEscalation, error: fetchError } = await supabase
      .from('escalations')
      .select('*')
      .eq('id', escalationId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('escalations')
      .update({
        escalated_to_id: seniorId,
        notes: `${currentEscalation.notes}\n\n--- Helper Notes ---\n${helperNotes}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', escalationId)
      .select()
      .single();

    if (error) throw error;

    await createNotification(
      seniorId,
      `A new escalation requires your review.`,
      'warning'
    );

    console.log('✅ Escalation forwarded to senior successfully');
    return data;
  } catch (error) {
    console.error('💥 EscalateToSenior error:', error);
    throw error;
  }
}

// ==================== INQUIRY FUNCTIONS ====================

export async function raiseInquiry(assignmentId, agentId, inquiryText) {
  try {
    console.log('🔄 Raising inquiry for assignment:', assignmentId);

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        order_id: assignmentId,
        raised_by_id: agentId,
        inquiry_text: inquiryText,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    const qualityAgents = await getTeamMembers('quality');
    for (const agent of qualityAgents) {
      await createNotification(
        agent.id,
        `A new inquiry has been raised for order review.`,
        'info'
      );
    }

    console.log('✅ Inquiry raised successfully');
    return data;
  } catch (error) {
    console.error('💥 RaiseInquiry error:', error);
    throw error;
  }
}

export async function getHelperInquiries(helperId) {
  try {
    console.log('🔍 Fetching inquiries for helper:', helperId);

    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        id,
        inquiry_text,
        response_text,
        status,
        created_at,
        order_assignments!inquiries_order_id_fkey (
          id,
          status,
          assigned_at,
          orders (
            order_id,
            employee_name,
            reason,
            amount,
            chefz,
            order_status,
            payment_type
          ),
          users!order_assignments_quality_agent_id_fkey (
            name,
            email
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ GetHelperInquiries error:', error);
      throw error;
    }

    console.log('✅ Inquiries fetched successfully:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('💥 GetHelperInquiries error:', error);
    throw error;
  }
}

export async function respondToInquiry(inquiryId, helperId, response) {
  try {
    console.log('🔄 Responding to inquiry:', inquiryId);

    const { data: inquiryData, error: fetchError } = await supabase
      .from('inquiries')
      .select('raised_by_id, order_assignments!inquiries_order_id_fkey(orders(order_id))')
      .eq('id', inquiryId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('inquiries')
      .update({
        status: 'responded',
        response_text: response,
        responded_by_id: helperId,
        responded_at: new Date().toISOString()
      })
      .eq('id', inquiryId)
      .select()
      .single();

    if (error) throw error;

    if (inquiryData) {
      const orderId = inquiryData.order_assignments?.orders?.order_id || 'Unknown';
      await createNotification(
        inquiryData.raised_by_id,
        `Your inquiry for order ${orderId} has been responded. Check the response.`,
        'info'
      );
    }

    console.log('✅ Inquiry response sent successfully');
    return data;
  } catch (error) {
    console.error('💥 RespondToInquiry error:', error);
    throw error;
  }
}

// ==================== TEAM & SCHEDULING FUNCTIONS ====================

export async function getTeamMembers(roles = []) {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (roles.length > 0) {
      query = query.in('role', roles);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  } catch (error)
 {
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
      .order('shift_date');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetTeamSchedule error:', error);
    return [];
  }
}

export async function updateTeamSchedule(scheduleData) {
  try {
    const validStatuses = ['Working', 'Off', 'On Leave', 'Sick Leave'];

    const sanitizedData = scheduleData.map(item => ({
      ...item,
      status: validStatuses.includes(item.status) ? item.status : 'Working'
    }));

    const { data, error } = await supabase
      .from('team_schedule')
      .upsert(sanitizedData)
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

// ==================== ANALYTICS & REPORTING FUNCTIONS ===================

// --- NEW FUNCTION SPECIFICALLY FOR THE MANAGER DASHBOARD ---
export async function getManagerPerformanceMetrics() {
  try {
    const { data, error } = await supabase.rpc('get_manager_dashboard_kpis');
    if (error) throw error;
    const metrics = data[0];
    return {
      totalOrders: metrics.total_reviews_today || 0,
      accuracyRate: metrics.overall_team_accuracy ? parseFloat(metrics.overall_team_accuracy).toFixed(1) : 100.0,
      qualityTeamAccuracy: metrics.quality_team_accuracy !== undefined ? parseFloat(metrics.quality_team_accuracy).toFixed(1) : 'N/A'
    };
  } catch (error) {
    console.error('Error fetching Manager KPIs:', error);
    return { totalOrders: 0, accuracyRate: 0, qualityTeamAccuracy: 'N/A' };
  }
}

// --- NEW FUNCTION SPECIFICALLY FOR THE SENIOR DASHBOARD ---
export async function getSeniorPerformanceMetrics() {
    try {
        const { data, error } = await supabase.rpc('get_senior_dashboard_kpis');
        if (error) throw error;
        const metrics = data[0];
        return {
            completedOrders: metrics.reviews_today || 0,
            pendingEscalations: metrics.pending_escalations || 0,
            avgResolutionTime: metrics.avg_resolution_time_minutes || 0,
            accuracyRate: metrics.team_accuracy ? parseFloat(metrics.team_accuracy).toFixed(1) : 0.0
        };
    } catch (error) {
        console.error('Error fetching Senior KPIs:', error);
        return { completedOrders: 0, pendingEscalations: 0, avgResolutionTime: 0, accuracyRate: 0 };
    }
}

// --- NEW FUNCTION SPECIFICALLY FOR THE QUALITY AGENT DASHBOARD ---
export async function getQualityAgentPerformanceMetrics(agentId) {
   try {
        const { data, error } = await supabase.rpc('get_quality_dashboard_kpis', { p_agent_id: agentId });
        if (error) throw error;
        const metrics = data[0];
        return {
            completedOrders: metrics.todays_reviews || 0,
            pendingReviews: metrics.open_cases || 0,
            accuracyRate: metrics.avg_quality_score ? parseFloat(metrics.avg_quality_score).toFixed(1) : 100.0,
            escalationRate: metrics.escalation_rate ? parseFloat(metrics.escalation_rate).toFixed(1) : 0.0
        };
   } catch (error) {
        console.error(`Error in getQualityAgentPerformanceMetrics:`, error);
        return { completedOrders: 0, pendingReviews: 0, accuracyRate: 0, escalationRate: 0 };
   }
}


export async function getErrorTrends() {
  try {
    const { data, error } = await supabase.rpc('get_error_trends_last_30_days');
    if (error) throw error;
    
    // Format data for Chart.js
    const labels = data.map(d => new Date(d.error_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const values = data.map(d => d.error_count);
    
    return { labels, values };
  } catch (error) {
    console.error('GetErrorTrends error:', error);
    return { labels: [], values: [] };
  }
}

// ** NEW FUNCTIONS FOR REPORTS & ANALYTICS PAGE **
export async function getAgentAccuracySummary(period) {
  try {
    const { data, error } = await supabase.rpc('get_agent_accuracy_summary', { period_filter: period });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching agent accuracy summary:', error);
    return []; // Return an empty array on error
  }
}

export async function getReviewsVsOverturnedSummary(period) {
  try {
    const { data, error } = await supabase.rpc('get_reviews_vs_overturned_summary', { period_filter: period });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching reviews vs overturned summary:', error);
    return []; // Return an empty array on error
  }
}

// ==================== DATA IMPORT FUNCTIONS ====================

export async function importOrdersFromCSV(csvData) {
  try {
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
     created_at: new Date()
    }));

    const { data, error } = await supabase
      .from('orders')
      .insert(orders)
      .select();

    if (error) throw error;

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

// ==================== KPI & SETTINGS FUNCTIONS ====================

export async function getKpiTargets() {
  try {
    const { data, error } = await supabase
      .from('kpi_targets') // This table name is a suggestion
      .select('*')
      .limit(1)
      .single(); // We assume there is only one row for KPI settings

    if (error && error.code !== 'PGRST116') { // PGRST116 = "The result contains 0 rows"
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error fetching KPI targets:', error);
    // Return default values if no settings are found
    return { accuracy_target: 98, reviews_per_day: 25 };
  }
}

export async function updateKpiTargets(targets) {
  try {
    // 'id: 1' is a common practice for a single-row settings table
    const { data, error } = await supabase
      .from('kpi_targets')
      .update(targets)
      .eq('id', 1) // Assuming the settings row has an id of 1
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating KPI targets:', error);
    throw error;
  }
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export function subscribeToNotifications(userId, callback) {
  try {
    return supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, callback)
      .subscribe();
  } catch (error) {
    console.error('SubscribeToNotifications error:', error);
    return { unsubscribe: () => {} };
  }
}

// أضف هذه الوظيفة الجديدة للاستماع لتحديثات التعيينات
export function subscribeToAssignmentUpdates(callback) {
  try {
    return supabase
      .channel('assignment-updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'order_assignments' }, callback)
      .subscribe();
  } catch (error) {
    console.error('SubscribeToAssignmentUpdates error:', error);
    return { unsubscribe: () => {} };
  }
}

export function subscribeToAssignments(agentId, callback) {
  try {
    return supabase
      .channel('assignments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_assignments', filter: `quality_agent_id=eq.${agentId}` }, callback)
      .subscribe();
  } catch (error) {
    console.error('SubscribeToAssignments error:', error);
    return { unsubscribe: () => {} };
  }
}

export function subscribeToEscalations(userId, callback) {
  try {
    return supabase
      .channel('escalations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'escalations', filter: `escalated_to_id=eq.${userId}` }, callback)
      .subscribe();
  } catch (error) {
    console.error('SubscribeToEscalations error:', error);
    return { unsubscribe: () => {} };
  }
}

export function subscribeToInquiries(callback) {
  try {
    return supabase
      .channel('inquiries')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inquiries' }, callback)
      .subscribe();
  } catch (error) {
    console.error('SubscribeToInquiries error:', error);
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
