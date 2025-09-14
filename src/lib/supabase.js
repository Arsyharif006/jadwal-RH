// =============================================
// SUPABASE CONFIGURATION
// =============================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://itogbzbloivogszcnkvx.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0b2diemJsb2l2b2dzemNua3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NTM4ODcsImV4cCI6MjA3MzMyOTg4N30.u3CwCdhCFY89JVEMxX8qzbDq20WRtA4VS-2pjhPt4E4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// =============================================
// AUTH HELPERS
// =============================================

// Sign in with Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: null
    }
  })
  return { data, error }
}

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// =============================================
// PROFILE HELPERS
// =============================================

// Get user profile
export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

// Update user profile
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

// Create user profile (usually called automatically via trigger)
export const createProfile = async (user) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      avatar_url: user.user_metadata?.avatar_url
    })
    .select()
    .single()

  return { data, error }
}

// =============================================
// CLASS HELPERS
// =============================================

// Tambahkan fungsi ini ke file supabase.js di section CLASS HELPERS

// Update class information
export const updateClass = async (classId, updates) => {
  const { data, error } = await supabase
    .from('classes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', classId)
    .select()
    .single()

  return { data, error }
}

// Create new class
export const createClass = async (classData) => {
  const { data, error } = await supabase
    .from('classes')
    .insert({
      name: classData.name.toUpperCase(),
      description: classData.description,
      creator_id: classData.creator_id,
      member_limit: classData.member_limit || 30,
      prodi: classData.prodi || 'Teknik Informatika'
    })
    .select()
    .single()

  return { data, error }
}

// Search classes with capacity info
export const searchClasses = async (searchTerm) => {
  const { data, error } = await supabase
    .from('classes_with_stats')
    .select('*')
    .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,prodi.ilike.%${searchTerm}%`)
    .eq('is_active', true)

  return { data, error }
}

// Get class with capacity details
export const getClassWithStats = async (classId) => {
  const { data, error } = await supabase
    .from('classes_with_stats')
    .select('*')
    .eq('id', classId)
    .single()

  return { data, error }
}

// Get user's classes (approved only)
export const getUserClasses = async (userId) => {
  const { data, error } = await supabase
    .from('class_members')
    .select(`
      *,
      classes (
        *,
        profiles:creator_id (full_name)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'approved')

  return { data, error }
}

// Get user's class memberships (all statuses)
export const getUserMemberships = async (userId) => {
  const { data, error } = await supabase
    .from('class_members')
    .select(`
      *,
      classes (
        id,
        name,
        description,
        prodi,
        member_limit,
        creator_id,
        profiles:creator_id (full_name)
      )
    `)
    .eq('user_id', userId)

  return { data, error }
}

// Get specific membership status
export const getMembershipStatus = async (userId, classId) => {
  const { data, error } = await supabase
    .from('class_members')
    .select('*')
    .eq('user_id', userId)
    .eq('class_id', classId)
    .single()

  return { data, error }
}

// Check if class has available slots
export const checkClassAvailability = async (classId) => {
  const { data, error } = await supabase
    .from('classes_with_stats')
    .select('member_limit, approved_members, remaining_quota, is_full')
    .eq('id', classId)
    .single()

  return { data, error }
}

// =============================================
// CLASS MEMBER HELPERS
// =============================================

// Request to join class (with capacity check)
export const requestJoinClass = async (classId, userId) => {
  // First check if class is full
  const { data: classStats, error: statsError } = await checkClassAvailability(classId)

  if (statsError) {
    return { data: null, error: statsError }
  }

  if (classStats && classStats.is_full) {
    return {
      data: null,
      error: {
        message: `Kelas sudah penuh. Batas maksimal ${classStats.member_limit} anggota.`,
        code: 'CLASS_FULL'
      }
    }
  }

  const { data, error } = await supabase
    .from('class_members')
    .insert({
      class_id: classId,
      user_id: userId,
      status: 'pending'
    })
    .select()
    .single()

  return { data, error }
}

// Get class members
export const getClassMembers = async (classId) => {
  const { data, error } = await supabase
    .from('class_members_view')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })

  return { data, error }
}

// Update member status (approve/reject) with capacity check
export const updateMemberStatus = async (memberId, status) => {
  const updates = {
    status,
    updated_at: new Date().toISOString()
  }

  if (status === 'approved') {
    updates.joined_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('class_members')
    .update(updates)
    .eq('id', memberId)
    .select()
    .single()

  return { data, error }
}

// Get class member statistics
export const getClassMemberStats = async (classId) => {
  const { data, error } = await supabase
    .from('classes_with_stats')
    .select('member_limit, current_members, approved_members, pending_members, remaining_quota, is_full')
    .eq('id', classId)
    .single()

  return { data, error }
}

// =============================================
// SCHEDULE HELPERS
// =============================================

// Create new schedule
export const createSchedule = async (scheduleData) => {
  const { data, error } = await supabase
    .from('schedules')
    .insert({
      class_id: scheduleData.class_id,
      title: scheduleData.title,
      description: scheduleData.description,
      schedule_date: scheduleData.date,
      schedule_time: scheduleData.time,
      type: scheduleData.type,
      created_by: scheduleData.created_by
    })
    .select()
    .single()

  return { data, error }
}

// Get class schedules
export const getClassSchedules = async (classId) => {
  const { data, error } = await supabase
    .from('schedules_view')
    .select('*')
    .eq('class_id', classId)
    .order('schedule_date', { ascending: true })
    .order('schedule_time', { ascending: true })

  return { data, error }
}

// Update schedule
export const updateSchedule = async (scheduleId, updates) => {
  const { data, error } = await supabase
    .from('schedules')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', scheduleId)
    .select()
    .single()

  return { data, error }
}

// Delete schedule
export const deleteSchedule = async (scheduleId) => {
  const { data, error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId)

  return { data, error }
}

// =============================================
// NOTIFICATION HELPERS
// =============================================

// Get user notifications
export const getUserNotifications = async (userId, limit = 50) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return { data, error }
}

// Mark notification as read
export const markNotificationRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  return { data, error }
}

// Mark all notifications as read
export const markAllNotificationsRead = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  return { data, error }
}

// =============================================
// REALTIME SUBSCRIPTIONS
// =============================================

// Subscribe to schedule changes
export const subscribeToSchedules = (classId, callback) => {
  return supabase
    .channel(`schedules:class_id=eq.${classId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'schedules',
      filter: `class_id=eq.${classId}`
    }, callback)
    .subscribe()
}

// Subscribe to class member changes
export const subscribeToClassMembers = (classId, callback) => {
  return supabase
    .channel(`class_members:class_id=eq.${classId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'class_members',
      filter: `class_id=eq.${classId}`
    }, callback)
    .subscribe()
}

// Subscribe to user notifications
export const subscribeToNotifications = (userId, callback) => {
  return supabase
    .channel(`notifications:user_id=eq.${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe()
}

// =============================================
// HELPER FUNCTIONS
// =============================================

// Format error messages
export const formatSupabaseError = (error) => {
  if (!error) return null

  // Common error mappings
  const errorMappings = {
    'duplicate key value violates unique constraint': 'Data sudah ada',
    'violates foreign key constraint': 'Data terkait tidak ditemukan',
    'violates not-null constraint': 'Data wajib tidak boleh kosong',
    'permission denied': 'Tidak memiliki izin untuk aksi ini',
    'kelas sudah penuh': 'Kelas sudah mencapai batas maksimal anggota'
  }

  const errorMessage = error.message || error.details || 'Terjadi kesalahan'

  for (const [key, value] of Object.entries(errorMappings)) {
    if (errorMessage.toLowerCase().includes(key)) {
      return value
    }
  }

  return errorMessage
}

export const isClassCreator = async (userId, classId) => {
  const { data, error } = await supabase
    .from('classes')
    .select('creator_id')
    .eq('id', classId)
    .eq('creator_id', userId)
    .single()

  return { isCreator: !!data && !error, error }
}

export const isClassMember = async (userId, classId) => {
  const { data, error } = await supabase
    .from('class_members')
    .select('status')
    .eq('user_id', userId)
    .eq('class_id', classId)
    .eq('status', 'approved')
    .single()

  return { isMember: !!data && !error, error }
}