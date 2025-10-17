// ================================
// api-client.js
// QualityX System Backend Connector
// ================================

// 1️⃣ إعداد الاتصال مع Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ⚙️ القيم الفعلية من مشروعك في Supabase
const SUPABASE_URL = "https://otaztiyatvbajswowdgs.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90YXp0aXlhdHZiYWpzd293ZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI4NTYsImV4cCI6MjA3NjI3ODg1Nn0.wmAvCpj8TpKjeuWF1OrjvXnxucMCFhhQrK0skA0SQhc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================
// 2️⃣ إنشاء حساب جديد (Sign Up)
// ================================
export async function signUp(email, password, name, role = "pending", department = null) {
  // إنشاء المستخدم في نظام المصادقة
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role, department },
    },
  });

  if (error) throw error;

  const user = data.user;

  if (user) {
    // إضافة المستخدم إلى جدول app_users في public schema
    const { error: insertError } = await supabase
      .from("app_users")
      .upsert({
        id: user.id,
        name,
        email,
        role: "pending", // المستخدم دايمًا بيبدأ كـ pending
        department,
        first_login: new Date(),
        status: "offline",
      });

    if (insertError) throw insertError;
  }

  return user;
}

// ================================
// 3️⃣ تسجيل الدخول (Sign In)
// ================================
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("User not found");

  // تحديث حالة المستخدم بعد تسجيل الدخول
  const { error: updateError } = await supabase
    .from("app_users")
    .update({ last_seen: new Date(), status: "online" })
    .eq("id", user.id);

  if (updateError) console.warn("⚠️ Couldn't update user status:", updateError);

  return user;
}

// ================================
// 4️⃣ تسجيل الخروج
// ================================
export async function signOut() {
  await supabase.auth.signOut();
}

// ================================
// 5️⃣ قراءة المستخدم الحالي
// ================================
export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// ================================
// 6️⃣ دوال للتعامل مع البيانات الأخرى
// ================================

// 🔹 الحصول على الطلبات (orders)
export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// 🔹 إنشاء مراجعة جديدة
export async function addReview(orderId, decision, comments, score = null) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase.from("reviews").insert({
    order_id: orderId,
    reviewer_id: user.id,
    decision,
    comments,
    score,
  });

  if (error) throw error;
}

// 🔹 الحصول على الإشعارات
export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// 🔹 إرسال إشعار جديد
export async function sendNotification(userId, title, message, type = "info") {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
  });

  if (error) throw error;
}
