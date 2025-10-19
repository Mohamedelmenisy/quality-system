// ================================
// api-client.js - QualityX System
// Complete Unified API Client
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

export async function updateUserProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

// ==================== ORDER MANAGEMENT FUNCTIONS ====================

export async function importOrdersCSV(file, importedBy) {
  try {
    console.log('📤 Starting CSV import...');
    
    // Parse CSV file (simplified - in real implementation, use a proper CSV parser)
    const text = await file.text();
    const rows = parseCSV(text);
    
    const { data, error } = await supabase
      .from('orders')
      .insert(rows.map(row => ({
        ...row,
        imported_by: importedBy,
        imported_at: new Date()
      })));

    if (error) throw error;
    
    console.log(`✅ Successfully imported ${rows.length} orders`);
    return data;
  } catch (error) {
    console.error('💥 CSV Import Error:', error);
    throw error;
  }
}

export async function assignOrdersToAgents(orders, agents, assignedBy) {
  try {
    const assignments = [];
    
    // Distribute orders evenly among agents
    orders.forEach((order, index) => {
      const agentIndex = index % agents.length;
      assignments.push({
        order_id: order.order_id,
        quality_agent_id: agents[agentIndex],
        assigned_by: assignedBy,
        status: 'pending'
      });
    });

    const { data, error } = await supabase
      .from('order_assignments')
      .insert(assignments);

    if (error) throw error;
    
    console.log(`✅ Successfully assigned ${assignments.length} orders to ${agents.length} agents`);
    return data;
  } catch (error) {
    console.error('💥 Assignment Error:', error);
    throw error;
  }
}

export async function getAssignedOrders(userId) {
  try {
    const { data, error } = await supabase
      .from('order_assignments')
      .select(`
        *,
        orders (*)
      `)
      .eq('quality_agent_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get assigned orders error:', error);
    throw error;
  }
}

export async function getUnassignedOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .is('assigned_to', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get unassigned orders error:', error);
    throw error;
  }
}

// ==================== QUALITY REVIEW FUNCTIONS ====================

export async function submitQualityReview(reviewData) {
  try {
    const { data, error } = await supabase
      .from('quality_reviews')
      .insert([{
        ...reviewData,
        reviewed_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    // If action is error, create error record
    if (reviewData.action_correctness === 'error') {
      await createErrorRecord(reviewData, data[0].id);
    }

    console.log('✅ Quality review submitted successfully');
    return data;
  } catch (error) {
    console.error('💥 Review Submission Error:', error);
    throw error;
  }
}

async function createErrorRecord(reviewData, reviewId) {
  try {
    // Find employee by name mapping
    const { data: employee, error: employeeError } = await supabase
      .from('users')
      .select('id')
      .ilike('name', `%${reviewData.employee_name}%`)
      .single();

    if (employeeError || !employee) {
      throw new Error(`Employee ${reviewData.employee_name} not found in system`);
    }

    const { data, error } = await supabase
      .from('errors')
      .insert({
        order_id: reviewData.order_id,
        review_id: reviewId,
        employee_id: employee.id,
        recorded_by: reviewData.quality_agent_id,
        status: 'pending_response'
      });

    if (error) throw error;
    
    console.log('✅ Error record created successfully');
    return data;
  } catch (error) {
    console.error('💥 Create Error Record Error:', error);
    throw error;
  }
}

export async function getQualityReviews(userId, filters = {}) {
  try {
    let query = supabase
      .from('quality_reviews')
      .select('*')
      .eq('quality_agent_id', userId);

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.dateFrom) {
      query = query.gte('reviewed_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('reviewed_at', filters.dateTo);
    }

    const { data, error } = await query.order('reviewed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get quality reviews error:', error);
    throw error;
  }
}

// ==================== ERROR MANAGEMENT FUNCTIONS ====================

export async function getUserErrors(userId) {
  try {
    const { data, error } = await supabase
      .from('errors')
      .select(`
        *,
        quality_reviews!inner(*),
        orders!inner(*),
        users!errors_recorded_by_fkey(name)
      `)
      .eq('employee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get user errors error:', error);
    throw error;
  }
}

export async function submitErrorResponse(errorId, responseText, respondedBy) {
  try {
    const { data, error } = await supabase
      .from('error_responses')
      .insert([{
        error_id: errorId,
        response_by: respondedBy,
        response_text: responseText,
        responded_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;

    // Update error status to responded
    const { error: updateError } = await supabase
      .from('errors')
      .update({ status: 'responded' })
      .eq('id', errorId);

    if (updateError) throw updateError;

    console.log('✅ Error response submitted successfully');
    return data;
  } catch (error) {
    console.error('💥 Submit Error Response Error:', error);
    throw error;
  }
}

export async function getErrorResponses(errorId) {
  try {
    const { data, error } = await supabase
      .from('error_responses')
      .select('*')
      .eq('error_id', errorId)
      .order('responded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get error responses error:', error);
    throw error;
  }
}

// ==================== ESCALATION FUNCTIONS ====================

export async function createEscalation(escalationData) {
  try {
    const { data, error } = await supabase
      .from('escalations')
      .insert([{
        ...escalationData,
        created_at: new Date().toISOString(),
        status: 'pending'
      }])
      .select();

    if (error) throw error;
    
    console.log('✅ Escalation created successfully');
    return data;
  } catch (error) {
    console.error('💥 Create Escalation Error:', error);
    throw error;
  }
}

export async function getEscalations(userId, filters = {}) {
  try {
    let query = supabase
      .from('escalations')
      .select(`
        *,
        users!escalations_escalated_by_fkey(name),
        orders(order_id, reason)
      `);

    // Apply user-specific filters
    if (filters.escalated_to) {
      query = query.eq('escalated_to', userId);
    }
    if (filters.escalated_by) {
      query = query.eq('escalated_by', userId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get escalations error:', error);
    throw error;
  }
}

// ==================== TEAM MANAGEMENT FUNCTIONS ====================

export async function getTeamMembers(filters = {}) {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    // Apply filters
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    if (filters.department) {
      query = query.eq('department', filters.department);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get team members error:', error);
    throw error;
  }
}

export async function getTeamSchedule(weekStart, weekEnd) {
  try {
    const { data, error } = await supabase
      .from('team_schedule')
      .select(`
        *,
        users(name, role)
      `)
      .gte('shift_date', weekStart)
      .lte('shift_date', weekEnd)
      .order('shift_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get team schedule error:', error);
    throw error;
  }
}

export async function updateTeamSchedule(scheduleUpdates) {
  try {
    const { data, error } = await supabase
      .from('team_schedule')
      .upsert(scheduleUpdates)
      .select();

    if (error) throw error;
    
    console.log('✅ Team schedule updated successfully');
    return data;
  } catch (error) {
    console.error('💥 Update Team Schedule Error:', error);
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
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get notifications error:', error);
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
    
    console.log('✅ Notification marked as read');
  } catch (error) {
    console.error('Mark notification as read error:', error);
    throw error;
  }
}

// ==================== ANALYTICS & REPORTING FUNCTIONS ====================

export async function getPerformanceMetrics(timeRange = 'month') {
  try {
    // Calculate date range based on timeRange parameter
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(endDate.getMonth() - 1);
    }

    // Get total orders count
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (ordersError) throw ordersError;

    // Get errors count
    const { data: errorsData, error: errorsError } = await supabase
      .from('errors')
      .select('id', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (errorsError) throw errorsError;

    // Get completed reviews count
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('quality_reviews')
      .select('id', { count: 'exact' })
      .gte('reviewed_at', startDate.toISOString())
      .lte('reviewed_at', endDate.toISOString());

    if (reviewsError) throw reviewsError;

    const totalOrders = ordersData?.length || 0;
    const totalErrors = errorsData?.length || 0;
    const totalReviews = reviewsData?.length || 0;
    const errorRate = totalOrders > 0 ? (totalErrors / totalOrders * 100).toFixed(1) : 0;

    return {
      totalOrders,
      totalErrors,
      totalReviews,
      errorRate: parseFloat(errorRate),
      timeRange
    };
  } catch (error) {
    console.error('Get performance metrics error:', error);
    throw error;
  }
}

export async function getDepartmentPerformance() {
  try {
    // This would aggregate performance by department
    // For now, return simulated data structure
    return {
      departments: [
        { name: 'Customer Service', score: 96.2, trend: 'up', errors: 45 },
        { name: 'Logistics', score: 94.8, trend: 'down', errors: 32 },
        { name: 'Quality', score: 98.1, trend: 'up', errors: 12 }
      ]
    };
  } catch (error) {
    console.error('Get department performance error:', error);
    throw error;
  }
}

// ==================== UTILITY FUNCTIONS ====================

function parseCSV(csvText) {
  // Simplified CSV parser - in production, use a proper CSV parsing library
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  }).filter(row => row[headers[0]]); // Filter out empty rows
}

export async function exportDataToCSV(tableName, filters = {}) {
  try {
    let query = supabase.from(tableName).select('*');
    
    // Apply filters if provided
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Convert to CSV format
    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });

    console.log(`✅ Exported ${data.length} rows from ${tableName}`);
    return csvRows.join('\n');
  } catch (error) {
    console.error('💥 Export Data Error:', error);
    throw error;
  }
}

// ==================== ERROR HANDLING & LOGGING ====================

export function handleApiError(error, context = 'API call') {
  console.error(`💥 ${context} failed:`, error);
  
  // You can add more sophisticated error handling here
  // such as sending to error tracking service, showing user-friendly messages, etc.
  
  throw error;
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

export function subscribeToTable(tableName, callback, filters = {}) {
  return supabase
    .channel(`public:${tableName}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: tableName,
        ...filters
      }, 
      callback
    )
    .subscribe();
}

export function unsubscribeFromChannel(channel) {
  return supabase.removeChannel(channel);
}
