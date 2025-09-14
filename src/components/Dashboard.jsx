// ==========================================
// components/Dashboard.js - Responsive Supabase Dashboard
// ==========================================
import React, { useState, useEffect } from 'react';
import Header from './Header';
import ScheduleList from './ScheduleList';
import AddSchedule from './AddSchedule';
import MemberManagement from './MemberManagement';
import { 
  FiCalendar, 
  FiPlus, 
  FiUsers, 
  FiClock, 
  FiBook,
  FiTrendingUp,
  FiCheckCircle,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiAlertCircle,
  FiX
} from 'react-icons/fi';
import { 
  getClassSchedules, 
  getClassMembers, 
  subscribeToSchedules, 
  subscribeToClassMembers,
  formatSupabaseError 
} from '../lib/supabase';

const Dashboard = ({ user, profile, userClass, onLogout, onNavigateToProfile, onNavigateToSettings }) => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Real-time subscriptions
  useEffect(() => {
    let scheduleSubscription;
    let memberSubscription;

    const setupRealtime = () => {
      if (!userClass?.id) return;

      // Subscribe to schedule changes
      scheduleSubscription = subscribeToSchedules(userClass.id, (payload) => {
        console.log('Schedule update:', payload);
        setLastUpdated(new Date());
        
        if (payload.eventType === 'INSERT') {
          setSchedules(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setSchedules(prev => 
            prev.map(schedule => 
              schedule.id === payload.new.id ? payload.new : schedule
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setSchedules(prev => 
            prev.filter(schedule => schedule.id !== payload.old.id)
          );
        }
      });

      // Subscribe to member changes
      memberSubscription = subscribeToClassMembers(userClass.id, (payload) => {
        console.log('Member update:', payload);
        setLastUpdated(new Date());
        
        if (payload.eventType === 'INSERT') {
          setMembers(prev => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setMembers(prev => 
            prev.map(member => 
              member.id === payload.new.id ? payload.new : member
            )
          );
        } else if (payload.eventType === 'DELETE') {
          setMembers(prev => 
            prev.filter(member => member.id !== payload.old.id)
          );
        }
      });
    };

    setupRealtime();

    return () => {
      if (scheduleSubscription) {
        scheduleSubscription.unsubscribe();
      }
      if (memberSubscription) {
        memberSubscription.unsubscribe();
      }
    };
  }, [userClass?.id]);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [userClass?.id]);

  // Online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDashboardData = async () => {
    if (!userClass?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      // Load schedules and members in parallel
      const [schedulesResult, membersResult] = await Promise.all([
        getClassSchedules(userClass.id),
        getClassMembers(userClass.id)
      ]);

      if (schedulesResult.error) {
        console.error('Schedules load error:', schedulesResult.error);
        setError(formatSupabaseError(schedulesResult.error));
      } else {
        setSchedules(schedulesResult.data || []);
      }

      if (membersResult.error) {
        console.error('Members load error:', membersResult.error);
        setError(formatSupabaseError(membersResult.error));
      } else {
        setMembers(membersResult.data || []);
      }

    } catch (error) {
      console.error('Dashboard load error:', error);
      setError('Terjadi kesalahan saat memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadDashboardData();
  };

  // Filter and process data
  const pendingMembers = members.filter(member => member.status === 'pending');
  const approvedMembers = members.filter(member => member.status === 'approved');

  // Get today's schedules
  const today = new Date().toISOString().split('T')[0];
  const todaySchedules = schedules.filter(schedule => 
    schedule.schedule_date === today
  );
  
  // Get upcoming schedules (next 7 days)
  const upcoming = schedules.filter(schedule => {
    const scheduleDate = new Date(schedule.schedule_date);
    const todayDate = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(todayDate.getDate() + 7);
    
    return scheduleDate >= todayDate && scheduleDate <= weekFromNow;
  });

  // Generate avatar from first letter of first name
  const getAvatarInitial = () => {
    const name = profile?.full_name || user?.email || 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  // Generate consistent color based on name
  const getAvatarColor = () => {
    const name = profile?.full_name || user?.email || 'U';
    const colors = [
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-purple-500 to-purple-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-red-500 to-red-600',
      'from-yellow-500 to-yellow-600',
      'from-teal-500 to-teal-600'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const stats = [
    {
      title: 'Total Jadwal',
      value: schedules.length,
      icon: FiCalendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Hari Ini',
      value: todaySchedules.length,
      icon: FiClock,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Minggu Ini',
      value: upcoming.length,
      icon: FiTrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600'
    },
    {
      title: 'Anggota',
      value: approvedMembers.length,
      icon: FiUsers,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    }
  ];

  const tabs = [
    { id: 'schedule', label: 'Jadwal', icon: FiCalendar },
    { 
      id: 'members', 
      label: 'Anggota', 
      icon: FiUsers, 
      badge: pendingMembers.length 
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          user={user} 
          profile={profile} 
          userClass={userClass} 
          onLogout={onLogout}
          onNavigateToProfile={onNavigateToProfile}
          onNavigateToSettings={onNavigateToSettings}
        />
        
        <div className="p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Memuat Dashboard</h2>
                <p className="text-gray-600">Mengambil data jadwal dan anggota kelas...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        profile={profile}
        userClass={userClass} 
        onLogout={onLogout}
        onNavigateToProfile={onNavigateToProfile}
        onNavigateToSettings={onNavigateToSettings}
      />

      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Error Banner */}
          {(!isOnline || error) && (
            <div className={`mb-4 lg:mb-6 p-3 lg:p-4 rounded-lg border ${
              !isOnline 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {!isOnline ? (
                  <FiWifiOff className="text-yellow-600 text-lg lg:text-xl flex-shrink-0 mt-0.5" />
                ) : (
                  <FiAlertCircle className="text-red-600 text-lg lg:text-xl flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium text-sm lg:text-base ${
                    !isOnline ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {!isOnline ? 'Mode Offline' : 'Terjadi Kesalahan'}
                  </h3>
                  <p className={`text-xs lg:text-sm ${
                    !isOnline ? 'text-yellow-700' : 'text-red-700'
                  } mt-1`}>
                    {!isOnline 
                      ? 'Koneksi internet terputus. Beberapa fitur mungkin tidak berfungsi.'
                      : error
                    }
                  </p>
                </div>
                {error && (
                  <button
                    onClick={refreshData}
                    className="flex-shrink-0 bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 lg:px-3 lg:py-1 rounded text-xs lg:text-sm font-medium transition-colors"
                  >
                    Coba Lagi
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MOBILE WELCOME SECTION */}
          <div className="lg:hidden mb-6">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 bg-gradient-to-r ${getAvatarColor()} rounded-full flex items-center justify-center text-white font-bold shadow-md`}>
                  {getAvatarInitial()}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold truncate">
                    Hai, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}!
                  </h1>
                  <p className="text-green-100 text-sm">
                    {userClass?.name} • {profile?.role === 'creator' ? 'Pembuat jadwal' : 'Anggota'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-green-200 text-xs">
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-300' : 'bg-red-400'}`}></div>
                  {isOnline ? 'Online' : 'Offline'}
                </div>
                <span>Update: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* DESKTOP WELCOME SECTION */}
          <div className="hidden lg:block mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">
                    Selamat datang, {profile?.full_name || user?.email}!
                  </h1>
                  <p className="text-green-100 text-lg">
                    Kelas: <span className="font-semibold">{userClass?.name}</span> • 
                    Peran: <span className="font-semibold capitalize">
                      {profile?.role === 'creator' ? 'Pembuat Jadwal' : 'Anggota'}
                    </span>
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-green-200 text-sm">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-300' : 'bg-red-400'}`}></div>
                      {isOnline ? 'Online' : 'Offline'}
                    </div>
                    <div className="flex items-center gap-1">
                      <FiRefreshCw className="text-xs" />
                      Update terakhir: {lastUpdated.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 p-4 rounded-xl">
                  <FiBook className="text-4xl" />
                </div>
              </div>
            </div>
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="bg-white rounded-lg lg:rounded-xl shadow-md lg:shadow-lg border border-gray-100 p-3 lg:p-6 hover:shadow-lg lg:hover:shadow-xl transition-all duration-300">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-2 lg:mb-0">
                      <p className="text-gray-600 text-xs lg:text-sm font-medium mb-1">{stat.title}</p>
                      <p className="text-xl lg:text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-2 lg:p-3 rounded-md lg:rounded-lg self-start lg:self-auto`}>
                      <IconComponent className={`text-lg lg:text-2xl ${stat.textColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MOBILE TODAY'S SCHEDULE */}
          {todaySchedules.length > 0 && (
            <div className="lg:hidden bg-white rounded-xl shadow-md border border-gray-100 p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-1.5 rounded-md">
                    <FiCheckCircle className="text-green-600 text-sm" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Jadwal Hari Ini</h3>
                    <p className="text-gray-600 text-xs">{todaySchedules.length} kegiatan</p>
                  </div>
                </div>
                <button
                  onClick={refreshData}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
                >
                  <FiRefreshCw className="text-sm" />
                </button>
              </div>
              
              <div className="space-y-2">
                {todaySchedules.slice(0, 2).map((schedule) => (
                  <div key={schedule.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="bg-green-500 w-2 h-2 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{schedule.title}</h4>
                      <p className="text-gray-600 text-xs truncate">
                        {schedule.schedule_time} • {schedule.description}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      schedule.type === 'homework' 
                        ? 'bg-orange-100 text-orange-700'
                        : schedule.type === 'exam'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {schedule.type === 'homework' 
                        ? 'PR' 
                        : schedule.type === 'exam' 
                          ? 'Pelajaran' 
                          : 'Kelas'
                      }
                    </span>
                  </div>
                ))}
                
                {todaySchedules.length > 2 && (
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="text-green-600 hover:text-green-700 font-medium text-xs"
                  >
                    Lihat {todaySchedules.length - 2} jadwal lainnya →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* DESKTOP TODAY'S SCHEDULE */}
          {todaySchedules.length > 0 && (
            <div className="hidden lg:block bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FiCheckCircle className="text-green-600 text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Jadwal Hari Ini</h2>
                    <p className="text-gray-600 text-sm">{todaySchedules.length} kegiatan</p>
                  </div>
                </div>
                <button
                  onClick={refreshData}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Refresh data"
                >
                  <FiRefreshCw className="text-lg" />
                </button>
              </div>
              
              <div className="space-y-3">
                {todaySchedules.slice(0, 3).map((schedule) => (
                  <div key={schedule.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="bg-green-500 w-3 h-3 rounded-full"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{schedule.title}</h4>
                      <p className="text-gray-600 text-sm">
                        {schedule.schedule_time} • {schedule.description}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      schedule.type === 'homework' 
                        ? 'bg-orange-100 text-orange-700'
                        : schedule.type === 'exam'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {schedule.type === 'homework' 
                        ? 'PR' 
                        : schedule.type === 'exam' 
                          ? 'Ujian' 
                          : 'Pelajaran'
                      }
                    </span>
                  </div>
                ))}
                
                {todaySchedules.length > 3 && (
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    Lihat {todaySchedules.length - 3} jadwal lainnya →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MAIN CONTENT */}
          <div className="bg-white rounded-xl shadow-md lg:shadow-lg border border-gray-100">
            {/* MOBILE TABS */}
            <div className="lg:hidden border-b border-gray-200">
              <div className="flex p-4 pb-0">
                <div className="flex space-x-1 w-full">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="text-lg" />
                        <span>{tab.label}</span>
                        {tab.badge && tab.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {tab.badge > 9 ? '9+' : tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Mobile Action Button */}
              {profile?.role === 'creator' && activeTab === 'schedule' && (
                <div className="p-4">
                  <button
                    onClick={() => setShowAddSchedule(true)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-4 py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-md"
                  >
                    <FiPlus className="text-lg" />
                    <span>Tambah Jadwal</span>
                  </button>
                </div>
              )}
            </div>

            {/* DESKTOP TABS */}
            <div className="hidden lg:block border-b border-gray-200">
              <div className="flex items-center justify-between p-6">
                <div className="flex space-x-1">
                  {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          activeTab === tab.id
                            ? 'bg-green-100 text-green-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="text-lg" />
                        <span>{tab.label}</span>
                        {tab.badge && tab.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Desktop Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={refreshData}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Refresh data"
                  >
                    <FiRefreshCw className="text-lg" />
                  </button>

                  {profile?.role === 'creator' && activeTab === 'schedule' && (
                    <button
                      onClick={() => setShowAddSchedule(true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <FiPlus className="text-lg" />
                      <span>Tambah Jadwal</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="p-4 lg:p-6">
              {activeTab === 'schedule' && (
                <ScheduleList 
                  schedules={schedules}
                  user={user}
                  profile={profile}
                  userClass={userClass}
                  onScheduleUpdate={refreshData}
                  isOnline={isOnline}
                />
              )}

              {activeTab === 'members' && (
                <MemberManagement 
                  user={user}
                  profile={profile}
                  userClass={userClass}
                  members={members}
                  onMemberUpdate={refreshData}
                  isOnline={isOnline}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADD SCHEDULE MODAL */}
      {showAddSchedule && (
        <AddSchedule 
          user={user}
          profile={profile}
          userClass={userClass}
          onClose={() => setShowAddSchedule(false)}
          onScheduleAdded={(newSchedule) => {
            setSchedules(prev => [...prev, newSchedule]);
            setShowAddSchedule(false);
            setLastUpdated(new Date());
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;