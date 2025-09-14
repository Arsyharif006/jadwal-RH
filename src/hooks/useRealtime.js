import { useEffect, useState } from 'react'
import { db } from '../lib/supabase'

export const useScheduleRealtime = (classId) => {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!classId) return

    // Load initial data
    const loadSchedules = async () => {
      const { data, error } = await db.getClassSchedules(classId)
      if (!error) {
        setSchedules(data || [])
      }
      setLoading(false)
    }

    loadSchedules()

    // Subscribe to realtime changes
    const subscription = db.subscribeToScheduleChanges(classId, (payload) => {
      console.log('Schedule update:', payload)
      
      if (payload.eventType === 'INSERT') {
        setSchedules(prev => [...prev, payload.new])
      } else if (payload.eventType === 'UPDATE') {
        setSchedules(prev => 
          prev.map(schedule => 
            schedule.id === payload.new.id ? payload.new : schedule
          )
        )
      } else if (payload.eventType === 'DELETE') {
        setSchedules(prev => 
          prev.filter(schedule => schedule.id !== payload.old.id)
        )
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [classId])

  return { schedules, loading, setSchedules }
}

export const useNotificationRealtime = (userId) => {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!userId) return

    const subscription = db.subscribeToNotifications(userId, (payload) => {
      console.log('New notification:', payload)
      setNotifications(prev => [payload.new, ...prev])
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [userId])

  return { notifications }
}