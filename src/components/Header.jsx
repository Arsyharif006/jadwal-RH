import React, { useState, useEffect, useRef } from 'react';
import { 
  FiCalendar, 
  FiUser, 
  FiLogOut, 
  FiChevronDown, 
  FiSettings, 
  FiBell,
  FiWifi,
  FiWifiOff,
  FiMenu,
  FiX,
  FiMoreVertical
} from 'react-icons/fi';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
  signOut,
  formatSupabaseError
} from '../lib/supabase';

const Header = ({ 
  user, 
  profile, 
  userClass, 
  onLogout, 
  onNavigateToProfile,
  onNavigateToSettings,
  members = [] // Add members prop to properly determine Peran
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Refs untuk positioning dropdown
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Properly determine if user is creator
  const isCreator = userClass?.creator_id === user?.id;

  // Load notifications
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      setupNotificationSubscription();
    }
  }, [user?.id]);

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

  // Update last updated time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await getUserNotifications(user.id, 10);
      
      if (error) {
        console.error('Error loading notifications:', formatSupabaseError(error));
        return;
      }

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const setupNotificationSubscription = () => {
    if (!user?.id) return;

    const subscription = subscribeToNotifications(user.id, (payload) => {
      console.log('New notification:', payload);
      
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new, ...prev.slice(0, 9)]); // Keep latest 10
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      const { error } = await markNotificationRead(notificationId);
      
      if (!error) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id || unreadCount === 0) return;

    setLoading(true);
    try {
      const { error } = await markAllNotificationsRead(user.id);
      
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    if (onNavigateToProfile) {
      onNavigateToProfile();
    }
  };

  const handleSettingsClick = () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    if (onNavigateToSettings) {
      onNavigateToSettings();
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
    
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Logout error:', formatSupabaseError(error));
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Call parent logout handler regardless of signOut result
      onLogout();
    }
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diff = now - notificationTime;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}j`;
    return `${days}h`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'schedule':
        return 'bg-blue-500';
      case 'member':
        return 'bg-green-500';
      case 'system':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

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

  const closeAllMenus = () => {
    setShowUserMenu(false);
    setShowNotifications(false);
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* MOBILE HEADER */}
          <div className="lg:hidden flex items-center justify-between h-14">
            {/* Left Side - Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center shadow-md">
                <FiCalendar className="text-white text-sm" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Jadwal</h1>
                <p className="text-gray-600 text-xs -mt-1">
                  {userClass?.name || 'Loading...'}
                </p>
              </div>
            </div>

            {/* Right Side - Mobile Actions */}
            <div className="flex items-center gap-2">
              {/* Online Status (Mobile) */}
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>

              {/* Notifications (Mobile) */}
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowMobileMenu(false);
                }}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Notifikasi"
              >
                <FiBell className="text-lg" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => {
                  setShowMobileMenu(!showMobileMenu);
                  setShowNotifications(false);
                }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                {showMobileMenu ? <FiX className="text-lg" /> : <FiMoreVertical className="text-lg" />}
              </button>
            </div>
          </div>

          {/* DESKTOP HEADER */}
          <div className="hidden lg:flex items-center justify-between h-16">
            {/* Logo & Class Info */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg">
                <FiCalendar className="text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Jadwal Pelajaran</h1>
                <p className="text-gray-600 text-sm">
                  Kelas {userClass?.name || 'Loading...'}
                </p>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  title="Notifikasi"
                >
                  <FiBell className="text-xl" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <div className={`w-8 h-8 bg-gradient-to-r ${getAvatarColor()} rounded-full flex items-center justify-center text-white font-semibold shadow-md`}>
                    {getAvatarInitial()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 text-sm">
                      {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-gray-600 text-xs capitalize">
                      {isCreator ? 'Pembuat Jadwal' : 'Anggota'}
                    </p>
                  </div>
                  <FiChevronDown className={`text-gray-400 transition-transform duration-200 ${
                    showUserMenu ? 'rotate-180' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP - Class Info Bar */}
          <div className="hidden lg:block border-t border-gray-200 py-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <FiWifi className="text-green-500" />
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <FiWifiOff className="text-red-500" />
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>Offline</span>
                    </>
                  )}
                </div>
                <span>•</span>
                <span>
                  Terakhir update: {lastUpdated.toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                {userClass && (
                  <>
                    <span>•</span>
                    <span>Kelas: <strong>{userClass.name}</strong></span>
                  </>
                )}
              </div>
              
              <div className="text-gray-600">
                <span className="font-medium">Peran:</span> 
                <span className="ml-1 capitalize">
                  {isCreator ? 'Pembuat Jadwal' : 'Anggota'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU OVERLAY */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-x-0 top-14 bg-white border-b border-gray-200 shadow-lg z-40">
          <div className="p-4">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
              <div className={`w-10 h-10 bg-gradient-to-r ${getAvatarColor()} rounded-full flex items-center justify-center text-white font-semibold shadow-md`}>
                {getAvatarInitial()}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-gray-600 text-sm">{user?.email}</p>
                <p className="text-gray-500 text-xs capitalize">
                  {isCreator ? 'Pembuat Jadwal' : 'Anggota'}
                </p>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-1">
              <button 
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <FiUser className="text-lg" />
                <span>Profil Saya</span>
              </button>
              
              {/* Settings menu only for creators */}
              {isCreator && onNavigateToSettings && (
                <button 
                  onClick={handleSettingsClick}
                  className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
                >
                  <FiSettings className="text-lg" />
                  <span>Pengaturan Kelas</span>
                </button>
              )}

              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <FiLogOut className="text-lg" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            {/* Mobile Status Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <FiWifi className="text-green-500" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <FiWifiOff className="text-red-500" />
                      <span>Offline</span>
                    </>
                  )}
                </div>
                <span>
                  Update: {lastUpdated.toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP USER DROPDOWN - Fixed positioning */}
      {showUserMenu && (
        <div className="hidden lg:block fixed w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
             style={{
               top: userMenuRef.current ? userMenuRef.current.getBoundingClientRect().bottom + 8 : 'auto',
               right: userMenuRef.current ? window.innerWidth - userMenuRef.current.getBoundingClientRect().right : 'auto'
             }}>
          <div className="p-4 border-b border-gray-200">
            <div>
              <p className="font-semibold text-gray-900">
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-gray-600 text-sm">{user?.email}</p>
              <p className="text-gray-500 text-xs capitalize mt-1">
                {isCreator ? 'Pembuat Jadwal' : 'Anggota'}
              </p>
            </div>
          </div>

          <div className="p-2">
            <button 
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
            >
              <FiUser className="text-lg" />
              <span>Profil Saya</span>
            </button>
            
            {/* Settings menu only for creators */}
            {isCreator && (
              <button 
                onClick={handleSettingsClick}
                className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                <FiSettings className="text-lg" />
                <span>Pengaturan Kelas</span>
              </button>
            )}
          </div>

          <div className="border-t border-gray-200 p-2">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <FiLogOut className="text-lg" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS DROPDOWN - Fixed positioning */}
      {showNotifications && (
        <div className={`bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-hidden z-50 ${
          window.innerWidth >= 1024 
            ? 'hidden lg:block fixed w-80' 
            : 'absolute inset-x-4 top-16 max-w-sm mx-auto'
        }`}
        style={window.innerWidth >= 1024 && notificationRef.current ? {
          top: notificationRef.current.getBoundingClientRect().bottom + 8,
          right: window.innerWidth - notificationRef.current.getBoundingClientRect().right
        } : {}}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifikasi</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Tandai semua'}
                </button>
              )}
            </div>
          </div>
          
          {notifications.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getNotificationIcon(notification.type)}`}></div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm truncate ${
                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h4>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <FiBell className="text-2xl mx-auto mb-2 opacity-50" />
              <p className="text-sm">Tidak ada notifikasi</p>
            </div>
          )}
        </div>
      )}

      {/* CLICK OUTSIDE OVERLAY */}
      {(showUserMenu || showNotifications || showMobileMenu) && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={closeAllMenus}
        />
      )}
    </>
  );
};

export default Header;