// ==========================================
// components/RoleSelection.js - Enhanced Supabase Integrated Role Selection
// ==========================================
import React, { useState } from 'react';
import { FiUsers, FiUser, FiChevronRight, FiAlertCircle, FiCheck, FiSettings, FiCalendar, FiLock, FiX } from 'react-icons/fi';
import { updateProfile, formatSupabaseError } from '../lib/supabase';

const RoleSelection = ({ user, profile, onRoleSelect }) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

  const handleRoleSelect = (role) => {
    setPendingRole(role);
    setShowConfirmPopup(true);
  };

  const confirmRoleSelection = async () => {
    setShowConfirmPopup(false);
    setIsLoading(true);
    setSelectedRole(pendingRole);
    setError(null);
    
    try {
      // Update profile with selected role in Supabase
      const { data, error: updateError } = await updateProfile(user.id, { role: pendingRole });
      
      if (updateError) {
        setError(formatSupabaseError(updateError));
        setIsLoading(false);
        setSelectedRole('');
        return;
      }

      // Small delay for better UX
      setTimeout(() => {
        onRoleSelect(pendingRole);
        setIsLoading(false);
      }, 1200);

    } catch (error) {
      console.error('Role selection error:', error);
      setError('Terjadi kesalahan saat menyimpan role. Silakan coba lagi.');
      setIsLoading(false);
      setSelectedRole('');
    }
  };

  const cancelRoleSelection = () => {
    setShowConfirmPopup(false);
    setPendingRole(null);
  };

  const roleOptions = [
    {
      id: 'creator',
      title: 'Pembuat Jadwal',
      shortTitle: 'Pembuat Jadwal',
      description: 'Buat dan kelola jadwal kelas, tambahkan anggota, dan atur kegiatan pembelajaran',
      shortDescription: 'Kelola jadwal dan anggota kelas',
      icon: FiUsers,
      color: 'from-blue-500 to-indigo-600',
      hoverColor: 'hover:from-blue-600 hover:to-indigo-700',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      shadowColor: 'shadow-blue-100',
      features: ['Buat jadwal baru', 'Kelola anggota kelas', 'Edit dan hapus jadwal', 'Approve anggota baru']
    },
    {
      id: 'member',
      title: 'Anggota Kelas',
      shortTitle: 'Anggota',
      description: 'Lihat jadwal pelajaran, bergabung dengan kelas, dan tetap update dengan kegiatan',
      shortDescription: 'Akses jadwal dan bergabung kelas',
      icon: FiUser,
      color: 'from-green-500 to-emerald-600',
      hoverColor: 'hover:from-green-600 hover:to-emerald-700',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      shadowColor: 'shadow-green-100',
      features: ['Lihat jadwal terkini', 'Bergabung kelas', 'Notifikasi realtime', 'Akses jadwal offline']
    }
  ];

  // Confirmation Popup Component
  const ConfirmationPopup = () => {
    if (!showConfirmPopup || !pendingRole) return null;
    
    const roleData = roleOptions.find(r => r.id === pendingRole);
    const IconComponent = roleData.icon;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className={`bg-gradient-to-r ${roleData.color} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <IconComponent className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Konfirmasi Pilihan</h3>
                  <p className="text-sm opacity-90">{roleData.title}</p>
                </div>
              </div>
              <button 
                onClick={cancelRoleSelection}
                className="text-white/70 hover:text-white transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Apakah Anda yakin?
              </h4>
              <p className="text-gray-600 text-sm">
                {roleData.description}
              </p>
            </div>

            {/* Warning Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-100 p-1 rounded-full flex-shrink-0">
                  <FiLock className="text-yellow-600 text-sm" />
                </div>
                <div>
                  <h5 className="text-yellow-800 font-medium text-sm mb-1">
                    PERINGATAN PENTING
                  </h5>
                  <ul className="text-yellow-700 text-xs space-y-1">
                    <li>• Setelah memilih, peran TIDAK DAPAT DIUBAH lagi</li>
                    <li>• Untuk mengubah peran, Anda harus:</li>
                    <li className="ml-4">- Ganti akun Google yang berbeda, atau</li>
                    <li className="ml-4">- Hubungi admin untuk bantuan</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Features Preview */}
            <div className="mb-6">
              <h5 className="text-sm font-medium text-gray-900 mb-3">Yang dapat Anda lakukan:</h5>
              <div className="space-y-2">
                {roleData.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center text-xs text-gray-600">
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${roleData.id === 'creator' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={cancelRoleSelection}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200"
              >
                Batal
              </button>
              <button
                onClick={confirmRoleSelection}
                className={`flex-1 bg-gradient-to-r ${roleData.color} ${roleData.hoverColor} text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl`}
              >
                Ya, Pilih {roleData.shortTitle}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    const roleData = roleOptions.find(r => r.id === selectedRole);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className={`bg-gradient-to-r ${roleData?.color || 'from-green-500 to-emerald-600'} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl`}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-3 border-white"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Menyiapkan Akun Anda
          </h2>
          <p className="text-gray-600 mb-6">
            Peran: {selectedRole === 'creator' ? 'Pembuat Jadwal' : 'Anggota Kelas'}
          </p>
          <div className="bg-white border border-green-200 rounded-xl p-4 max-w-sm mx-auto shadow-lg">
            <div className="flex items-center justify-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-green-700 text-sm font-medium">
                Menyimpan peran ke database...
              </p>
            </div>
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <FiLock className="text-yellow-600 text-xs" />
                <p className="text-yellow-700 text-xs">
                  peran akan dikunci setelah tersimpan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Desktop Layout */}
        <div className="hidden lg:flex min-h-screen">
          {/* Left Side - Welcome Section */}
          <div className="flex-1 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex flex-col justify-center items-center p-12 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 max-w-lg text-center">
              {/* User Avatar */}
              <div className="bg-white/20 backdrop-blur-sm w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <span className="text-2xl font-bold text-white">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              
              <h1 className="text-4xl font-bold mb-6 leading-tight">
                Selamat Datang,
                <span className="block text-3xl bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mt-2">
                  {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Pengguna'}!
                </span>
              </h1>
              
              <p className="text-xl text-green-100 mb-12 leading-relaxed">
                Pilih peran Anda untuk memulai perjalanan dalam mengelola jadwal pelajaran yang lebih efisien
              </p>

              {/* Welcome Features */}
              <div className="space-y-6">
                <div className="flex items-center text-left">
                  <div className="bg-white/20 p-3 rounded-xl mr-4">
                    <FiCalendar className="text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Jadwal Terintegrasi</h3>
                    <p className="text-green-100 text-sm">Sinkronisasi realtime di semua device</p>
                  </div>
                </div>
                
                <div className="flex items-center text-left">
                  <div className="bg-white/20 p-3 rounded-xl mr-4">
                    <FiUsers className="text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Kolaborasi Tim</h3>
                    <p className="text-green-100 text-sm">Bekerja sama dengan mudah</p>
                  </div>
                </div>

                <div className="flex items-center text-left">
                  <div className="bg-white/20 p-3 rounded-xl mr-4">
                    <FiLock className="text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Peran Permanen</h3>
                    <p className="text-green-100 text-sm">Pilihan peran tidak dapat diubah</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Role Selection */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-lg">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Pilih Peran Anda
                </h2>
                <p className="text-gray-600 text-lg">
                  Tentukan bagaimana Anda ingin menggunakan aplikasi
                </p>
              </div>

              {/* Warning Alert */}
              <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 flex items-start gap-3">
                <FiLock className="text-yellow-600 text-xl flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-yellow-800 font-medium text-sm mb-1">
                    Pilihan Permanen
                  </h3>
                  <p className="text-yellow-700 text-sm">
                    Setelah memilih, peran tidak dapat diubah. Pastikan pilihan Anda sudah tepat.
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 rounded-lg p-4 flex items-start gap-3">
                  <FiAlertCircle className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-red-800 font-medium text-sm mb-1">
                      Gagal Menyimpan Peran
                    </h3>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Role Cards - Desktop */}
              <div className="space-y-4">
                {roleOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div
                      key={option.id}
                      className={`bg-white rounded-2xl shadow-lg border ${option.borderColor} overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:${option.shadowColor}`}
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`${option.bgColor} p-4 rounded-xl border ${option.borderColor}`}>
                            <IconComponent className={`text-2xl ${option.iconColor}`} />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                              {option.title}
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {option.description}
                            </p>
                            
                            {/* Features */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {option.features.map((feature, index) => (
                                <div key={index} className="flex items-center text-sm text-gray-500">
                                  <FiCheck className={`text-xs mr-2 ${option.iconColor}`} />
                                  {feature}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleRoleSelect(option.id)}
                          disabled={isLoading}
                          className={`w-full bg-gradient-to-r ${option.color} ${option.hoverColor} text-white font-semibold py-4 px-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2`}
                        >
                          <span>Pilih sebagai {option.title}</span>
                          <FiChevronRight className="text-lg" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Info */}
              <div className="text-center mt-6 space-y-2">
                <p className="text-sm text-gray-500">
                  Untuk mengubah peran: ganti akun Google atau hubungi admin
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Database Online
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden min-h-screen flex flex-col justify-center px-4 py-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Mobile Header */}
            <div className="text-center">
              {/* User Avatar */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                <span className="text-xl font-bold text-white">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Selamat Datang!
              </h1>
              <p className="text-gray-600 text-sm mb-1">
                Halo, {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Pengguna'}
              </p>
              <p className="text-gray-500 text-sm">
                Pilih peran Anda untuk memulai
              </p>
            </div>

            {/* Warning Alert - Mobile */}
            <div className="w-full max-w-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FiLock className="text-yellow-600 text-sm flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-700 text-xs font-medium mb-1">
                    Pilihan Permanen
                  </p>
                  <p className="text-yellow-600 text-xs">
                    peran tidak dapat diubah setelah dipilih
                  </p>
                </div>
              </div>
            </div>

            {/* Error Alert - Mobile */}
            {error && (
              <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="text-red-500 text-sm flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-700 text-xs font-medium mb-1">
                      Gagal Menyimpan
                    </p>
                    <p className="text-red-600 text-xs">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Role Cards - Mobile */}
            <div className="w-full max-w-sm space-y-4">
              {roleOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div
                    key={option.id}
                    className={`bg-white rounded-2xl shadow-lg border ${option.borderColor} overflow-hidden`}
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`${option.bgColor} p-3 rounded-xl border ${option.borderColor}`}>
                          <IconComponent className={`text-xl ${option.iconColor}`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">
                            {option.shortTitle}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {option.shortDescription}
                          </p>
                        </div>
                      </div>

                      {/* Mobile Features */}
                      <div className="space-y-2 mb-6">
                        {option.features.slice(0, 2).map((feature, index) => (
                          <div key={index} className="flex items-center text-xs text-gray-500">
                            <div className={`w-1.5 h-1.5 rounded-full mr-2 ${option.id === 'creator' ? 'bg-blue-400' : 'bg-green-400'}`}></div>
                            {feature}
                          </div>
                        ))}
                        {option.features.length > 2 && (
                          <p className="text-xs text-gray-400">
                            +{option.features.length - 2} fitur lainnya
                          </p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleRoleSelect(option.id)}
                        disabled={isLoading}
                        className={`w-full bg-gradient-to-r ${option.color} ${option.hoverColor} text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                      >
                        <span>Pilih {option.shortTitle}</span>
                        <FiChevronRight className="text-lg" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Footer */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <FiSettings className="text-gray-400 text-sm" />
                <p className="text-xs text-gray-500">
                  Ubah: ganti akun atau contact admin
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Database Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Popup */}
      <ConfirmationPopup />
    </>
  );
};

export default RoleSelection;