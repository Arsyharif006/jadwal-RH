import React, { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiSave, 
  FiX, 
  FiEdit2, 
  FiMail,
  FiCalendar,
  FiShield,
  FiLoader,
  FiCheck,
  FiAlertCircle,
  FiArrowLeft,
  FiSmartphone,
  FiMonitor
} from 'react-icons/fi';
import {
  getCurrentUser,
  getProfile,
  updateProfile,
  formatSupabaseError
} from '../lib/supabase';

const ProfilePage = ({ onBack }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state - only full name can be edited
  const [formData, setFormData] = useState({
    full_name: ''
  });

  // Load user data
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { user, error: userError } = await getCurrentUser();
      if (userError) {
        throw new Error(formatSupabaseError(userError));
      }
      
      if (!user) {
        throw new Error('User not found');
      }
      
      setUser(user);
      
      const { data: profileData, error: profileError } = await getProfile(user.id);
      if (profileError) {
        console.error('Profile error:', formatSupabaseError(profileError));
        // Create default profile data if not found
        setProfile({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'member',
          created_at: user.created_at
        });
      } else {
        setProfile(profileData);
      }
      
      // Initialize form data
      setFormData({
        full_name: profileData?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      });
      
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user || !formData.full_name.trim()) {
      setError('Nama lengkap tidak boleh kosong');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const updateData = {
        full_name: formData.full_name.trim()
      };
      
      const { data, error: updateError } = await updateProfile(user.id, updateData);
      
      if (updateError) {
        throw new Error(formatSupabaseError(updateError));
      }
      
      // Update local state
      setProfile(prev => ({
        ...prev,
        ...updateData
      }));
      
      setSuccess(true);
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    
    // Reset form data
    if (profile) {
      setFormData({
        full_name: profile.full_name || ''
      });
    }
  };

  // Generate avatar from first letter of first name
  const getAvatarInitial = () => {
    const name = formData.full_name || profile?.full_name || user?.email || 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  // Generate consistent color based on name
  const getAvatarColor = () => {
    const name = formData.full_name || profile?.full_name || user?.email || 'U';
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="text-4xl text-emerald-500 animate-spin" />
          <p className="text-gray-600 text-center">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-purple-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
            title="Kembali"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Profil Saya</h1>
            <p className="text-gray-600 text-sm">Kelola informasi profil</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
            >
              <FiEdit2 className="text-sm" />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                title="Kembali"
              >
                <FiX className="text-xl" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
                <p className="text-gray-600 text-sm">Kelola informasi profil Anda</p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2"
              >
                <FiEdit2 className="text-sm" />
                Edit Profil
              </button>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <FiCheck className="text-green-500 flex-shrink-0" />
                <p className="text-green-700 font-medium">Profil berhasil diperbarui!</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-700 font-medium">Error</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 text-sm font-medium hover:text-red-800"
                >
                  <FiX />
                </button>
              </div>
            </div>
          )}

          {/* Profile Content */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Avatar Section - Mobile: Full width, Desktop: Left column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6 lg:mb-0">
                {/* Avatar Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-8 lg:py-12">
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar - Auto generated from name */}
                    <div className={`w-20 h-20 lg:w-24 lg:h-24 ${getAvatarColor()} rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white mb-4`}>
                      <span className="text-2xl lg:text-4xl font-bold">
                        {getAvatarInitial()}
                      </span>
                    </div>
                    
                    <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">
                      {formData.full_name || profile?.full_name || 'User'}
                    </h2>
                    <p className="text-emerald-100 text-sm">
                      {profile?.role === 'creator' ? 'Pembuat Jadwal' : 'Anggota Kelas'}
                    </p>
                  </div>
                </div>

                {/* Avatar Info */}
                <div className="p-6">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <h4 className="font-medium text-emerald-900 mb-2 text-sm">Avatar Otomatis</h4>
                    <p className="text-emerald-700 text-xs leading-relaxed">
                      Avatar dibuat otomatis dari huruf pertama nama Anda dengan warna yang unik.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Mobile: Full width, Desktop: Right columns */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 lg:p-8">
                  {isEditing ? (
                    /* Edit Form */
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Edit Profil</h3>
                        <p className="text-gray-600 text-sm">Ubah informasi profil Anda</p>
                      </div>

                      {/* Full Name - Only editable field */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Lengkap *
                        </label>
                        <div className="relative">
                          <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            placeholder="Masukkan nama lengkap"
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 transition-all duration-200"
                            required
                          />
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                          Avatar akan diperbarui otomatis berdasarkan huruf pertama nama Anda.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSaving ? (
                            <>
                              <FiLoader className="animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <FiSave />
                              Simpan Perubahan
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <FiX />
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View Mode */
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Informasi Profil</h3>
                        <p className="text-gray-600 text-sm">Detail informasi akun Anda</p>
                      </div>

                      {/* User Info Grid */}
                      <div className="grid sm:grid-cols-2 gap-4 lg:gap-6">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <FiMail className="text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">Email</span>
                          </div>
                          <p className="text-gray-900 font-medium break-all">{user?.email}</p>
                          <p className="text-gray-500 text-xs mt-1">Email tidak dapat diubah</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <FiShield className="text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">Peran</span>
                          </div>
                          <p className="text-gray-900 font-medium">
                            {profile?.role === 'creator' ? 'Pembuat Jadwal' : 'Anggota Kelas'}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 sm:col-span-2">
                          <div className="flex items-center gap-3 mb-2">
                            <FiCalendar className="text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">Bergabung Sejak</span>
                          </div>
                          <p className="text-gray-900 font-medium">
                            {formatDate(profile?.created_at || user?.created_at)}
                          </p>
                        </div>
                      </div>

                      {/* Account Status */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Status Akun</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-gray-700">Status Akun:</span>
                            <span className="text-green-600 font-medium">Aktif</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <span className="text-gray-700">Email:</span>
                            <span className="text-green-600 font-medium">
                              {user?.email_confirmed_at ? 'Terverifikasi' : 'Belum Verifikasi'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          {!isEditing && (
            <div className="mt-6 bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500 p-3 rounded-xl">
                    <FiMonitor className="text-white text-lg" />
                  </div>
                  <div className="lg:hidden">
                    <FiSmartphone className="text-emerald-500 text-2xl" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-900 mb-2">Tips Profil</h4>
                  <div className="grid sm:grid-cols-2 gap-2 text-emerald-700 text-sm">
                    <div>• Gunakan nama asli untuk pengenalan</div>
                    <div>• Avatar dibuat otomatis dari nama</div>
                    <div>• Email tidak dapat diubah</div>
                    <div>• Warna avatar unik untuk setiap nama</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;