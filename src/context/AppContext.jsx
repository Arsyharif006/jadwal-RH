import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children, value }) => {
  const [schedules, setSchedules] = useState([
    { 
      id: 1, 
      class_id: 1, 
      title: 'PR Matematika', 
      description: 'Kerjakan halaman 45-50',
      date: '2024-09-14',
      time: '10:00',
      type: 'homework',
      created_by: 1,
      created_at: '2024-09-13T10:00:00Z'
    },
    { 
      id: 2, 
      class_id: 1, 
      title: 'Ujian Fisika', 
      description: 'Materi BAB 1-3',
      date: '2024-09-15',
      time: '08:00',
      type: 'exam',
      created_by: 1,
      created_at: '2024-09-13T11:00:00Z'
    }
  ]);

  const [classMembers, setClassMembers] = useState([
    { id: 1, class_id: 1, user_id: 1, status: 'approved', role: 'creator' },
    { id: 2, class_id: 1, user_id: 2, status: 'pending', role: 'member' }
  ]);

  // Fungsi untuk menambah jadwal
  const addSchedule = (schedule) => {
    const newSchedule = {
      ...schedule,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    setSchedules(prev => [...prev, newSchedule]);
    return newSchedule;
  };

  // Fungsi untuk update jadwal
  const updateSchedule = (id, updatedSchedule) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === id ? { ...schedule, ...updatedSchedule } : schedule
    ));
  };

  // Fungsi untuk delete jadwal
  const deleteSchedule = (id) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  };

  // Fungsi untuk approve/reject member
  const updateMemberStatus = (memberId, status) => {
    setClassMembers(prev => prev.map(member => 
      member.id === memberId ? { ...member, status } : member
    ));
  };

  // Fungsi untuk menambah member baru
  const addClassMember = (classId, userId) => {
    const newMember = {
      id: Date.now(),
      class_id: classId,
      user_id: userId,
      status: 'pending',
      role: 'member'
    };
    setClassMembers(prev => [...prev, newMember]);
    return newMember;
  };

  const contextValue = {
    ...value,
    schedules,
    classMembers,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    updateMemberStatus,
    addClassMember
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};