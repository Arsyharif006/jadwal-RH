// ==========================================
// components/CreateClass.js - Enhanced Supabase Integrated Class Creation
// ==========================================
import React, { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiAlertCircle, FiInfo, FiBook, FiUsers, FiEdit3 } from 'react-icons/fi';
import { createClass, searchClasses, formatSupabaseError } from '../lib/supabase';

const CreateClass = ({ user, profile, onClassCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    member_limit: 30,
    prodi: 'Teknik Informatika'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  // Daftar program studi yang tersedia
  const prodiOptions = [
    'Teknik Informatika',
    'Sistem Informasi',
    'Teknik Komputer',
    'Manajemen Informatika',
    'Teknik Elektro',
    'Teknik Mesin',
    'Teknik Sipil',
    'Akuntansi',
    'Manajemen',
    'Ekonomi',
    'Bahasa Inggris',
    'Matematika',
    'Fisika',
    'Kimia',
    'Biologi'
  ];

  // Check for duplicate class name
  const checkDuplicateName = async (className) => {
    if (!className.trim()) return false;
    
    setCheckingDuplicate(true);
    
    try {
      const { data, error } = await searchClasses(className);
      
      if (error) {
        console.error('Duplicate check error:', error);
        return false;
      }

      // Check if any class has exact same name
      const isDuplicate = data?.some(cls => 
        cls.name.toUpperCase() === className.toUpperCase()
      );
      
      setCheckingDuplicate(false);
      return isDuplicate;
    } catch (error) {
      console.error('Duplicate check error:', error);
      setCheckingDuplicate(false);
      return false;
    }
  };

  const validateForm = async () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama kelas tidak boleh kosong';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Nama kelas minimal 3 karakter';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Nama kelas maksimal 50 karakter';
    } else {
      // Check for duplicate name
      const isDuplicate = await checkDuplicateName(formData.name);
      if (isDuplicate) {
        newErrors.name = 'Nama kelas sudah digunakan, pilih nama lain';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi tidak boleh kosong';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Deskripsi minimal 10 karakter';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Deskripsi maksimal 500 karakter';
    }

    if (!formData.member_limit || formData.member_limit < 5) {
      newErrors.member_limit = 'Batas anggota minimal 5 orang';
    } else if (formData.member_limit > 100) {
      newErrors.member_limit = 'Batas anggota maksimal 100 orang';
    }

    if (!formData.prodi.trim()) {
      newErrors.prodi = 'Program studi harus dipilih';
    }

    setError(Object.values(newErrors)[0] || '');
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle number input for member_limit
    if (name === 'member_limit') {
      const numValue = parseInt(value) || '';
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleCreateClass = async () => {
    const isValid = await validateForm();
    if (!isValid || checkingDuplicate) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Prepare class data for Supabase
      const classData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        member_limit: formData.member_limit,
        prodi: formData.prodi.trim(),
        creator_id: user.id
      };

      const { data, error: createError } = await createClass(classData);
      
      if (createError) {
        setError(formatSupabaseError(createError));
        setIsLoading(false);
        return;
      }

      // Success - show success state
      setSuccess('Kelas berhasil dibuat!');
      
      // Wait a bit to show success message then redirect
      setTimeout(() => {
        onClassCreated(data);
      }, 2000);

    } catch (error) {
      console.error('Class creation error:', error);
      setError('Terjadi kesalahan saat membuat kelas. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
            <div className="bg-green-100 w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4 lg:mb-6 animate-pulse">
              <FiCheck className="text-green-600 text-2xl lg:text-3xl" />
            </div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-3">Kelas Berhasil Dibuat!</h2>
            <p className="text-gray-600 mb-4 text-sm lg:text-base">
              Kelas <strong>{formData.name.toUpperCase()}</strong> telah dibuat dan siap digunakan.
            </p>
            <div className="bg-green-50 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
              <div className="text-xs lg:text-sm text-green-800 space-y-1">
                <p><strong>Nama:</strong> {formData.name.toUpperCase()}</p>
                <p><strong>Prodi:</strong> {formData.prodi}</p>
                <p><strong>Anggota:</strong> {formData.member_limit} orang</p>
                <p><strong>Deskripsi:</strong> {formData.description.slice(0, 60)}...</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 lg:h-6 lg:w-6 border-b-2 border-blue-500"></div>
              <p className="text-xs lg:text-sm font-medium">Mengarahkan ke dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Side - Info Section */}
        <div className="flex-1 bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 flex flex-col justify-center items-center p-12 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-lg text-center">
            <div className="bg-white/20 backdrop-blur-sm w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <FiPlus className="text-white text-4xl" />
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Buat Kelas
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Impian Anda
              </span>
            </h1>
            
            <p className="text-xl text-green-100 mb-12 leading-relaxed">
              Mulai perjalanan pembelajaran yang terorganisir dengan membuat kelas yang sesuai kebutuhan Anda
            </p>

            {/* Feature Highlights */}
            <div className="space-y-6">
              <div className="flex items-center text-left">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <FiBook className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Kelola Mudah</h3>
                  <p className="text-green-100 text-sm">Atur jadwal dan anggota dengan praktis</p>
                </div>
              </div>
              
              <div className="flex items-center text-left">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <FiUsers className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Kolaborasi Aktif</h3>
                  <p className="text-green-100 text-sm">Libatkan semua anggota kelas</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Informasi Kelas
              </h2>
              <p className="text-gray-600">
                Halo {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}! Lengkapi detail kelas Anda
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
              <div className="space-y-6">
                {/* Class Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Kelas <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Contoh: R.1.H, XI-IPA-1"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900"
                      disabled={checkingDuplicate}
                    />
                    {checkingDuplicate && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Program Studi & Member Limit Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Program Studi <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="prodi"
                      value={formData.prodi}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 bg-white"
                    >
                      {prodiOptions.map((prodi) => (
                        <option key={prodi} value={prodi}>
                          {prodi}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Batas Anggota <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="member_limit"
                      value={formData.member_limit}
                      onChange={handleInputChange}
                      min="5"
                      max="100"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi Kelas <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Jelaskan tentang kelas ini..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 resize-none"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Min. 10 karakter</span>
                    <span className={`text-xs ${
                      formData.description.length >= 10 && formData.description.length <= 500 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                    }`}>
                      {formData.description.length}/500
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleCreateClass}
                disabled={isLoading || checkingDuplicate}
                className="w-full mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Membuat Kelas...
                  </>
                ) : checkingDuplicate ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Mengecek...
                  </>
                ) : (
                  <>
                    <FiCheck />
                    Buat Kelas
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col justify-center px-4 py-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Mobile Header */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <FiPlus className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Buat Kelas Baru</h1>
            <p className="text-gray-600 text-sm">
              Halo {profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0]}!
            </p>
          </div>

          {/* Mobile Form */}
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="space-y-4">
                {/* Class Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Kelas <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Contoh: R.1.H"
                      className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 text-sm"
                      disabled={checkingDuplicate}
                    />
                    {checkingDuplicate && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Program Studi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Program Studi <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="prodi"
                    value={formData.prodi}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 bg-white text-sm"
                  >
                    {prodiOptions.map((prodi) => (
                      <option key={prodi} value={prodi}>
                        {prodi}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Member Limit */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batas Anggota <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="member_limit"
                    value={formData.member_limit}
                    onChange={handleInputChange}
                    min="5"
                    max="100"
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Jelaskan tentang kelas..."
                    className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 resize-none text-sm"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">Min. 10</span>
                    <span className="text-xs text-gray-400">
                      {formData.description.length}/500
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5 text-sm" />
                    <p className="text-xs text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleCreateClass}
                disabled={isLoading || checkingDuplicate}
                className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-sm">Membuat...</span>
                  </>
                ) : checkingDuplicate ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span className="text-sm">Mengecek...</span>
                  </>
                ) : (
                  <>
                    <FiCheck />
                    <span className="text-sm">Buat Kelas</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile Footer */}
            <div className="text-center mt-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-400">Database Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClass;