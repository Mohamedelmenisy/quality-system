import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://otaztiyatvbajswowdgs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YXp0aXlhdHZiYWpzd293ZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI4NTYsImV4cCI6MjA3NjI3ODg1Nn0.wmAvCpj8TpKjeuWF1OrjvXnxucMCFhhQrK0skA0SQhc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTH ---
export async function signUp(email, password, metadata = {}){
  return supabase.auth.signUp({ email, password, options: { data: metadata } });
}
export async function signIn(email, password){
  return supabase.auth.signInWithPassword({ email, password });
}
export async function signOut(){
  return supabase.auth.signOut();
}
export async function getCurrentUser(){
  const res = await supabase.auth.getUser();
  return res.data?.user || null;
}

// --- USERS ---
export async function getUserById(userId){
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if(error) throw error;
  return data;
}
export async function getUserByEmail(email){
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
  if(error) throw error;
  return data;
}

// --- ORDERS ---
export async function getOrders(limit = 100){
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
  if(error) throw error;
  return data;
}
export async function importOrdersFromCSV(rows = []){
  // rows: array of objects matching orders columns. Using upsert to avoid dupes by order_id
  const { data, error } = await supabase.from('orders').upsert(rows, { onConflict: ['order_id'] });
  if(error) throw error;
  return data;
}
export async function getUnassignedOrders(limit = 100){
  // orders that are not present in order_assignments
  const { data, error } = await supabase.rpc('get_unassigned_orders', { _limit: limit }).catch(()=>({ data:null, error:null }));
  if(data) return data;
  // fallback: fetch orders and filter in client (less efficient)
  const { data: all, error: e } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
  if(e) throw e;
  const { data: assignments } = await supabase.from('order_assignments').select('order_id');
  const assignedIds = new Set((assignments||[]).map(a=>a.order_id));
  return all.filter(o=> !assignedIds.has(o.order_id));
}

// --- ASSIGNMENTS ---
export async function assignOrdersToAgent(orderIds = [], qualityAgentId, assignedById){
  if(!orderIds.length) return [];
  const rows = orderIds.map(oid => ({ order_id: oid, quality_agent_id: qualityAgentId, assigned_by_id: assignedById, status: 'pending' }));
  const { data, error } = await supabase.from('order_assignments').insert(rows).select();
  if(error) throw error;
  return data;
}
export async function getAssignedOrders(agentId){
  const { data, error } = await supabase.from('order_assignments').select('*').eq('quality_agent_id', agentId).order('created_at', { ascending: false });
  if(error) throw error;
  return data;
}

// --- QUALITY REVIEWS ---
export async function submitReview(review){
  // review: { assignment_id, action_correctness, notes, department, modified_reason, reviewer_id, created_at }
  const { data, error } = await supabase.from('quality_reviews').insert([review]).select().single();
  if(error) throw error;
  return data;
}

// --- ERRORS ---
export async function submitError(errorRow){
  // errorRow: { review_id, employee_id, status, ... }
  const { data, error } = await supabase.from('errors').insert([errorRow]).select().single();
  if(error) throw error;
  return data;
}
export async function getErrorsForAgent(agentId, filters = {}){
  let q = supabase.from('errors').select('*').eq('employee_id', agentId).order('created_at', { ascending: false });
  if(filters.status) q = q.eq('status', filters.status);
  if(filters.date_from) q = q.gte('created_at', filters.date_from);
  if(filters.date_to) q = q.lte('created_at', filters.date_to);
  const { data, error } = await q;
  if(error) throw error;
  return data;
}

// --- ERROR RESPONSES ---
export async function submitErrorResponse(responseRow){
  // { error_id, response_by_id, response_text, created_at }
  const { data, error } = await supabase.from('error_responses').insert([responseRow]).select().single();
  if(error) throw error;
  return data;
}
export async function getErrorResponses(errorId){
  const { data, error } = await supabase.from('error_responses').select('*').eq('error_id', errorId).order('created_at', { ascending: true });
  if(error) throw error;
  return data;
}

// --- ESCALATIONS & FINAL DECISIONS ---
export async function submitEscalation(escalationRow){
  const { data, error } = await supabase.from('escalations').insert([escalationRow]).select().single();
  if(error) throw error;
  return data;
}
export async function submitFinalDecision(finalRow){
  const { data, error } = await supabase.from('final_decisions').insert([finalRow]).select().single();
  if(error) throw error;
  return data;
}

// --- TEAM SCHEDULE ---
export async function getTeamSchedule(teamId=null){
  let q = supabase.from('team_schedule').select('*');
  if(teamId) q = q.eq('team_id', teamId);
  const { data, error } = await q.order('date', { ascending: true });
  if(error) throw error;
  return data;
}
export async function updateSchedule(scheduleId, patch){
  const { data, error } = await supabase.from('team_schedule').update(patch).eq('id', scheduleId).select().single();
  if(error) throw error;
  return data;
}

// --- NOTIFICATIONS ---
export async function getNotifications(userId){
  const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if(error) throw error;
  return data;
}
export async function markNotificationAsRead(notificationId){
  const { data, error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId).select().single();
  if(error) throw error;
  return data;
}

// --- DASHBOARD / STATS HELPERS ---
export async function getOrdersSummary(){
  const { data, error } = await supabase.from('orders').select('order_id', { count: 'estimated' });
  if(error) throw error;
  return { total: data?.length || 0 };
}
export async function getErrorStats(){
  const { data, error } = await supabase.from('errors').select('id, status, created_at');
  if(error) throw error;
  const total = data.length;
  const byStatus = data.reduce((acc, r)=> (acc[r.status]=(acc[r.status]||0)+1, acc), {});
  return { total, byStatus };
}
export async function getActiveAgentsCount(){
  const { data, error } = await supabase.from('users').select('id').eq('status', 'online');
  if(error) throw error;
  return (data || []).length;
}
export async function getDepartmentErrorDistribution(){
  // join errors -> reviews -> department if available
  const { data, error } = await supabase.from('quality_reviews').select('department, id');
  if(error) throw error;
  const map = {};
  (data||[]).forEach(r=> map[r.department] = (map[r.department]||0)+1);
  return map;
}

// --- UTILS ---
export function nowISO(){ return new Date().toISOString(); }
