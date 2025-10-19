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
    console.log('🚀 Starting signin for:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('❌ Auth signin error:', error);
      throw error;
    }
    
    console.log('✅ Signin successful, user:', data.user);
    return data;
  } catch (error) {
    console.error('💥 SignIn Error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    console.log('✅ Signout successful');
  } catch (error) {
    console.error('💥 SignOut Error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  } catch (error) {
    console.error('💥 GetCurrentUser error:', error);
    return null;
  }
}

export async function getUserData(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

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

// ==================== QUALITY AGENT FUNCTIONS ====================

/**
 * جلب الطلبات المسندة لموظف الجودة الحالي (Active Assignments)
 * @param {string} userId - UUID الخاص بموظف الجودة
 */
export async function getAssignedOrders(userId) {
  try {
    const { data, error } = await supabase
      .from('order_assignments')
      .select('*, orders(*)') // استخدام خاصية الـ Join المدمجة لجلب تفاصيل الطلب
      .eq('quality_agent_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('assigned_at', { ascending: true });

    if (error) throw error;
    console.log('✅ Fetched assigned orders:', data);
    return data;
  } catch (error) {
    console.error('💥 getAssignedOrders Error:', error);
    throw error;
  }
}

/**
 * حساب مؤشرات الأداء (KPIs) الخاصة بموظف الجودة
 * @param {string} userId - UUID الخاص بموظف الجودة
 */
export async function getQualityKPIs(userId) {
  try {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // KPI 1: إجمالي المراجعات المكتملة لهذا الشهر
    const { count: completedReviewsCount, error: error1 } = await supabase
      .from('quality_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('quality_agent_id', userId)
      .gte('reviewed_at', firstDayOfMonth); 
    
    if (error1) throw error1;

    // KPI 2: عدد المهام المفتوحة (معلقة أو قيد العمل)
    const { count: openAssignmentsCount, error: error2 } = await supabase
      .from('order_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('quality_agent_id', userId)
      .in('status', ['pending', 'in_progress']);

    if (error2) throw error2;

    const kpis = {
      totalCompletedReviews: completedReviewsCount || 0,
      openAssignments: openAssignmentsCount || 0,
    };
    
    console.log('✅ Fetched KPIs:', kpis);
    return kpis;

  } catch (error) {
    console.error('💥 getQualityKPIs Error:', error);
    throw error;
  }
}

/**
 * البحث عن UUID الموظف باستخدام اسمه النصي (لعملية ربط الخطأ)
 * @param {string} employeeName - الاسم النصي للموظف (من جدول orders)
 */
export async function findEmployeeIdByName(employeeName) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('name', employeeName)
            .eq('role', 'agent') // فلترة للبحث بين وكلاء المبيعات/الخدمة فقط
            .maybeSingle();

        if (error) throw error;
        
        if (!data) {
            console.log(`⚠️ Employee not found for name: ${employeeName}`);
            return null;
        }

        return data.id;
    } catch (error) {
        console.error('💥 findEmployeeIdByName Error:', error);
        throw error;
    }
}

/**
 * دالة إرسال المراجعة (تتضمن محاكاة لعملية Transaction)
 * @param {string} assignmentId - مُعرّف المهمة
 * @param {string} orderId - مُعرّف الطلب
 * @param {string} qualityAgentId - UUID موظف الجودة الحالي
 * @param {string} actionCorrectness - 'correct' أو 'error'
 * @param {string} notes - ملاحظات المراجعة
 * @param {string} employeeName - الاسم النصي للموظف الذي قام بالعملية
 */
export async function submitReview(assignmentId, orderId, qualityAgentId, actionCorrectness, notes, employeeName) {
    try {
        let employeeId = null;
        if (actionCorrectness === 'error') {
            // الخطوة 1: ربط الاسم بالـ UUID إذا كان هناك خطأ
            employeeId = await findEmployeeIdByName(employeeName);
            if (!employeeId) {
                // إرجاع خطأ محدد إذا لم يتم العثور على الموظف
                return { success: false, error: new Error(`Employee name "${employeeName}" is not registered in the system (cannot map to UUID).`) };
            }
        }

        // الخطوة 2: إدراج السجل في quality_reviews
        const { data: reviewData, error: reviewError } = await supabase
            .from('quality_reviews')
            .insert({
                order_id: orderId,
                quality_agent_id: qualityAgentId,
                action_correctness: actionCorrectness,
                notes: notes,
                reviewed_at: new Date()
            })
            .select('id')
            .single();

        if (reviewError) throw reviewError;
        const reviewId = reviewData.id;

        // الخطوة 3: تسجيل الخطأ في جدول errors إذا لزم الأمر
        if (actionCorrectness === 'error') {
            const { error: errorInsertError } = await supabase
                .from('errors')
                .insert({
                    order_id: orderId,
                    review_id: reviewId,
                    employee_id: employeeId,
                    recorded_by: qualityAgentId,
                    status: 'pending_response' // الحالة الأولية
                });

            if (errorInsertError) throw errorInsertError;
        }

        // الخطوة 4: تحديث order_assignments كـ 'completed'
        const { error: assignmentUpdateError } = await supabase
            .from('order_assignments')
            .update({ 
                status: 'completed', 
                completed_at: new Date(), 
                review_id: reviewId 
            })
            .eq('id', assignmentId);

        if (assignmentUpdateError) throw assignmentUpdateError;

        console.log(`✅ Review submission successful for assignment ${assignmentId}.`);
        return { success: true, reviewId };

    } catch (error) {
        console.error('💥 submitReview Transaction Error:', error);
        return { success: false, error: error };
    }
}
