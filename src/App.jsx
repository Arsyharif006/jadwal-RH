// ==========================================
// App.js - Main Application Component
// ==========================================
import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { getCurrentUser } from './lib/supabase';
import Login from './components/Login';
import RoleSelection from './components/RoleSelection';
import CreateClass from './components/CreateClass';
import JoinClass from './components/JoinClass';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import ClassSettingsPage from './components/ClassSettingsPage';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userClass, setUserClass] = useState(null);
  const [appState, setAppState] = useState('loading'); // loading, login, roleSelect, createClass, joinClass, dashboard, profile, classSettings
  const [loading, setLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const { user, error } = await getCurrentUser();
      
      if (error || !user) {
        setAppState('login');
      } else {
        await loadUserData(user);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setAppState('login');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (user) => {
    try {
      // Get user profile
      const { getProfile, getUserClasses } = await import('./lib/supabase');
      const { data: profile, error: profileError } = await getProfile(user.id);
      
      if (profileError) {
        console.error('Profile load error:', profileError);
        setAppState('roleSelect');
        return;
      }

      setCurrentUser(user);
      setUserProfile(profile);

      // Check if user has a role
      if (!profile.role) {
        setAppState('roleSelect');
        return;
      }

      // Get user's classes
      const { data: userClasses, error: classError } = await getUserClasses(user.id);
      
      if (classError) {
        console.error('Classes load error:', classError);
      }

      if (userClasses && userClasses.length > 0) {
        setUserClass(userClasses[0].classes);
        setAppState('dashboard');
      } else {
        // User has role but no class
        setAppState(profile.role === 'creator' ? 'createClass' : 'joinClass');
      }
    } catch (error) {
      console.error('User data load error:', error);
      setAppState('login');
    }
  };

  const handleLogin = async (user) => {
    await loadUserData(user);
  };

  const handleRoleSelect = async (role) => {
    try {
      const { updateProfile } = await import('./lib/supabase');
      const { data, error } = await updateProfile(currentUser.id, { role });
      
      if (error) {
        console.error('Role update error:', error);
        return;
      }

      setUserProfile({ ...userProfile, role });
      setAppState(role === 'creator' ? 'createClass' : 'joinClass');
    } catch (error) {
      console.error('Role selection error:', error);
    }
  };

  const handleClassCreated = (newClass) => {
    setUserClass(newClass);
    setAppState('dashboard');
  };

  const handleClassJoined = (joinedClass) => {
    setUserClass(joinedClass);
    setAppState('dashboard');
  };

  const handleNavigateToProfile = () => {
    setAppState('profile');
  };

  const handleNavigateToSettings = () => {
    // Only allow creators to access settings
    if (userProfile?.role === 'creator' && userClass?.creator_id === currentUser?.id) {
      setAppState('classSettings');
    } else {
      console.error('Access denied: Only class creators can access settings');
    }
  };

  const handleBackFromProfile = () => {
    setAppState('dashboard');
  };

  const handleBackFromSettings = () => {
    setAppState('dashboard');
  };

  const handleProfileUpdated = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  const handleClassUpdated = (updatedClass) => {
    setUserClass(updatedClass);
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import('./lib/supabase');
      await signOut();
      
      setCurrentUser(null);
      setUserProfile(null);
      setUserClass(null);
      setAppState('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderCurrentView = () => {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat aplikasi...</p>
          </div>
        </div>
      );
    }

    switch (appState) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      
      case 'roleSelect':
        return (
          <RoleSelection 
            user={currentUser} 
            profile={userProfile}
            onRoleSelect={handleRoleSelect} 
          />
        );
      
      case 'createClass':
        return (
          <CreateClass 
            user={currentUser} 
            profile={userProfile}
            onClassCreated={handleClassCreated} 
          />
        );
      
      case 'joinClass':
        return (
          <JoinClass 
            user={currentUser} 
            profile={userProfile}
            onClassJoined={handleClassJoined} 
          />
        );
      
      case 'dashboard':
        return (
          <Dashboard 
            user={currentUser} 
            profile={userProfile}
            userClass={userClass} 
            onLogout={handleLogout}
            onNavigateToProfile={handleNavigateToProfile}
            onNavigateToSettings={handleNavigateToSettings}
          />
        );
      
      case 'profile':
        return (
          <ProfilePage 
            user={currentUser}
            profile={userProfile}
            onBack={handleBackFromProfile}
            onProfileUpdated={handleProfileUpdated}
          />
        );
      
      case 'classSettings':
        return (
          <ClassSettingsPage 
            user={currentUser}
            classId={userClass?.id}
            onBack={handleBackFromSettings}
          />
        );
      
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        {renderCurrentView()}
      </div>
    </AppProvider>
  );
}

export default App;