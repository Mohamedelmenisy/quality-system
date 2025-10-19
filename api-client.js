// ================================
// api-client.js - QualityX System
// (Complete & Merged Version)
// ================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- SUPABASE CLIENT INITIALIZATION ---
const SUPABASE_URL = "https://otaztiyatvbajswowdgs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YXp0aXlhdHZiYWpzd293ZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI4NTYsImV4cCI6MjA3NjI3ODg1Nn0.wmAvCpj8TpKjeuWF1OrjvXnxucMCFhhQrK0skA0SQhc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 1. AUTHENTICATION FUNCTIONS ---

/**
 * Signs up a new user and adds them to the 'users' table with a 'pending' role.
 */
export async function signUp(email, password, name, department = null) {
  try {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, department } }
    });
    if (authError) throw authError;

    const user = data.user;
    if (user) {
      const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          name: name,
          email: email,
          role: 'pending',
          department: department
      });
      if (insertError) throw insertError;
    }
    return user;
  } catch (error) {
    console.error('SignUp Error:', error.message);
    throw error;
  }
}

/**
 * Signs in a user and updates their status to 'online'.
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    await supabase.from('users').update({ last_seen: new Date(), status: 'online' }).eq('id', data.user.id);
    return data.user;
  } catch (error) {
    console.error('SignIn Error:', error.message);
    throw error;
  }
}

/**
 * Signs out the current user.
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('SignOut Error:', error.message);
    throw error;
  }
}

/**
 * Gets the currently authenticated user session.
 */
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}


// --- 2. USER DATA FUNCTIONS ---

/**
 * Fetches a user's profile from the 'users' table by their ID.
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('GetUserProfile Error:', error.message);
    throw error;
  }
}


// --- 3. CORE QUALITYX BUSINESS LOGIC ---

/**
 * Imports orders from a parsed CSV file.
 * NOTE: CSV parsing should be handled before calling this function.
 */
export async function importOrders(parsedRows, importedByUserId) {
  try {
    const ordersToInsert = parsedRows.map(row => ({
      ...row, // Ensure 'row' has keys matching your 'orders' table columns
      imported_by: importedByUserId,
      imported_at: new Date()
    }));

    const { data, error } = await supabase.from('orders').insert(ordersToInsert).select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('ImportOrders Error:', error.message);
    throw error;
  }
}

/**
 * Assigns a list of order IDs to a list of agent IDs.
 */
export async function assignOrdersToAgents(orderIds, agentIds, assignedByUserId) {
  try {
    const assignments = orderIds.map((orderId, index) => ({
      order_id: orderId,
      quality_agent_id: agentIds[index % agentIds.length], // Distributes orders evenly
      assigned_by: assignedByUserId,
      status: 'pending'
    }));

    const { data, error } = await supabase.from('order_assignments').insert(assignments).select();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('AssignOrders Error:', error.message);
    throw error;
  }
}

/**
 * Submits a quality review and creates an error record if necessary.
 */
export async function submitQualityReview(reviewData) {
  try {
    // Step 1: Insert the review
    const { data: review, error: reviewError } = await supabase
      .from('quality_reviews')
      .insert(reviewData)
      .select()
      .single();
    if (reviewError) throw reviewError;

    // Step 2: If it's an error, create a corresponding error record
    if (reviewData.action_correctness === 'error') {
      const { data: order } = await supabase.from('orders').select('employee_name').eq('order_id', reviewData.order_id).single();
      if (!order) throw new Error(`Order with ID ${reviewData.order_id} not found.`);

      // Find the employee's ID via mapping
      const { data: employee } = await supabase.from('users').select('id').eq('name', order.employee_name).single();
      if (!employee) throw new Error(`Employee '${order.employee_name}' not found in the users table.`);

      const { error: errorRecordError } = await supabase.from('errors').insert({
        order_id: reviewData.order_id,
        review_id: review.id,
        employee_id: employee.id, // The ID of the employee who made the mistake
        recorded_by: reviewData.quality_agent_id, // The ID of the quality agent recording it
        status: 'pending_response'
      });
      if (errorRecordError) throw errorRecordError;
    }
    return review;
  } catch (error) {
    console.error('SubmitReview Error:', error.message);
    throw error;
  }
}

// --- 4. GENERAL DATA FETCHING FUNCTIONS ---

/**
 * Fetches notifications for a specific user.
 */
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
        console.error('GetNotifications Error:', error.message);
        throw error;
    }
}
