import React, { useState, useEffect } from 'react';
import { 
  FiSettings, 
  FiSave, 
  FiX, 
  FiEdit2, 
  FiBook,
  FiFileText,
  
  FiLoader,
  FiCheck,
  FiAlertCircle,
  FiArrowLeft,
  FiUsers,
  FiCalendar,
  FiInfo,
  FiShield
} from 'react-icons/fi';
import {
  getClassWithStats,
  updateClass,
  formatSupabaseError,
  isClassCreator
} from '../lib/supabase';

const ClassSettingsPage = ({ user, classId, onBack }) => {
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prodi: ''
  });

  // Available program studi options
  const prodiOptions = [
    'Teknik Informatika',
    'Sistem Informasi',
    'Teknik Komputer',
    'Matematika',
    'Fisika',
    'Kimia',
    'Biologi',
    'Teknik Sipil',
    'Teknik Mesin',
    'Teknik Elektro',
    'Manajemen',
    'Akuntansi',
    'Ekonomi'
  ];

  // Load class data and check permissions
  useEffect(() => {
    if (classId && user?.id) {
      loadClassData();
      checkCreatorPermission();
    }
  }, [classId, user?.id]);

  const checkCreatorPermission = async () => {
    try {
      const { isCreator: creatorStatus, error } = await isClassCreator(user.id, classId);
      if (error) {
        console.error('Error checking creator permission:', error);
        setError('Tidak dapat memverifikasi izin akses');
        return;
      }
      
      setIsCreator(creatorStatus);
      
      if (!creatorStatus) {
        setError('Anda tidak memiliki izin untuk mengakses pengaturan kelas ini');
      }
    } catch (error) {
      console.error('Error checking creator permission:', error);
      setError('Terjadi kesalahan saat memverifikasi izin');
    }
  };

  const loadClassData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: classError } = await getClassWithStats(classId);
      
      if (classError) {
        throw new Error(formatSupabaseError(classError));
      }
      
      if (!data) {
        throw new Error('Kelas tidak ditemukan');
      }
      
      setClassData(data);
      
      // Initialize form data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        prodi: data.prodi || 'Teknik Informatika'
      });
      
    } catch (error) {
      console.error('Error loading class:', error);
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
    if (!user || !isCreator) {
      setError('Anda tidak memiliki izin untuk mengubah kelas ini');
      return;
    }

    if (!formData.name.trim()) {
      setError('Nama kelas tidak boleh kosong');
      return;
    }

    if (!formData.description.trim()) {
      setError('Deskripsi kelas tidak boleh kosong');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const updateData = {
        name: formData.name.trim().toUpperCase(),
        description: formData.description.trim(),
        prodi: formData.prodi
      };
      
      const { data, error: updateError } = await updateClass(classId, updateData);
      
      if (updateError) {
        throw new Error(formatSupabaseError(updateError));
      }
      
      // Update local state
      setClassData(prev => ({
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
      console.error('Error updating class:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    
    // Reset form data
    if (classData) {
      setFormData({
        name: classData.name || '',
        description: classData.description || '',
        prodi: classData.prodi || 'Teknik Informatika'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-purple-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="text-4xl text-emerald-500 animate-spin" />
          <p className="text-gray-600 text-center">Memuat pengaturan kelas...</p>
        </div>
      </div>
    );
  }

  // Show error if not creator or no access
  if (!isCreator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <FiShield className="text-4xl text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Akses Ditolak</h2>
            <p className="text-gray-600 mb-6">
              Hanya pembuat kelas yang dapat mengakses pengaturan kelas ini.
            </p>
            <button
              onClick={onBack}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <FiArrowLeft />
              Kembali
            </button>
          </div>
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
            <h1 className="text-lg font-bold text-gray-900">Pengaturan Kelas</h1>
            <p className="text-gray-600 text-sm">{classData?.name}</p>
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
                <FiArrowLeft className="text-xl" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan Kelas</h1>
                <p className="text-gray-600 text-sm">Kelola informasi kelas {classData?.name}</p>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2"
              >
                <FiEdit2 className="text-sm" />
                Edit Kelas
              </button>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <FiCheck className="text-green-500 flex-shrink-0" />
                <p className="text-green-700 font-medium">Pengaturan kelas berhasil diperbarui!</p>
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

          {/* Class Settings Content */}
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Class Stats Section - Mobile: Full width, Desktop: Left column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6 lg:mb-0">
                {/* Stats Header */}
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiSettings className="text-white text-2xl" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {formData.name || classData?.name}
                    </h2>
                    <p className="text-emerald-100 text-sm">
                      {formData.prodi || classData?.prodi}
                    </p>
                  </div>
                </div>

                {/* Stats Info */}
                <div className="p-6 space-y-4">
                  <div className="bg-emerald-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiUsers className="text-emerald-500" />
                      <span className="font-medium text-emerald-900 text-sm">Anggota</span>
                    </div>
                    <p className="text-emerald-700 font-bold">
                      {classData?.approved_members || 0} / {classData?.member_limit || 30}
                    </p>
                    <p className="text-emerald-600 text-xs">
                      {classData?.pending_members || 0} menunggu persetujuan
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCalendar className="text-gray-500" />
                      <span className="font-medium text-gray-700 text-sm">Dibuat</span>
                    </div>
                    <p className="text-gray-900 text-sm">
                      {formatDate(classData?.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Settings - Mobile: Full width, Desktop: Right columns */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 lg:p-8">
                  {isEditing ? (
                    /* Edit Form */
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Edit Informasi Kelas</h3>
                        <p className="text-gray-600 text-sm">Ubah detail kelas yang dapat dilihat anggota</p>
                      </div>

                      {/* Class Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nama Kelas *
                        </label>
                        <div className="relative">
                          <FiBook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Contoh: R.1.H"
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 transition-all duration-200 uppercase"
                            required
                          />
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                          Nama kelas akan otomatis dikonversi ke huruf kapital.
                        </p>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deskripsi Kelas *
                        </label>
                        <div className="relative">
                          <FiFileText className="absolute left-3 top-3 text-gray-400" />
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Deskripsi singkat tentang kelas ini..."
                            rows="4"
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 transition-all duration-200 resize-none"
                            required
                          />
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                          Berikan deskripsi yang jelas untuk membantu calon anggota memahami kelas.
                        </p>
                      </div>

                      {/* Program Studi */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Program Studi *
                        </label>
                        <div className="relative">
                          <FiUsers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <select
                            name="prodi"
                            value={formData.prodi}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-20 focus:border-emerald-500 transition-all duration-200 appearance-none bg-white"
                            required
                          >
                            {prodiOptions.map(prodi => (
                              <option key={prodi} value={prodi}>
                                {prodi}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                          Pilih program studi yang sesuai dengan kelas ini.
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
                        <h3 className="text-lg font-semibold text-gray-900">Informasi Kelas</h3>
                        <p className="text-gray-600 text-sm">Detail informasi kelas yang saat ini aktif</p>
                      </div>

                      {/* Class Info Grid */}
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <FiBook className="text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">Nama Kelas</span>
                          </div>
                          <p className="text-gray-900 font-bold text-lg">{classData?.name}</p>
                        </div>
                        
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <FiFileText className="text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">Deskripsi</span>
                          </div>
                          <p className="text-gray-900 leading-relaxed">{classData?.description}</p>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <FiUsers className="text-gray-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">Program Studi</span>
                          </div>
                          <p className="text-gray-900 font-medium">{classData?.prodi}</p>
                        </div>
                      </div>

                      {/* Class Statistics */}
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">Statistik Kelas</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-emerald-50 rounded-lg">
                            <p className="text-emerald-600 text-2xl font-bold">{classData?.approved_members || 0}</p>
                            <p className="text-emerald-700 text-sm font-medium">Anggota Aktif</p>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <p className="text-yellow-600 text-2xl font-bold">{classData?.pending_members || 0}</p>
                            <p className="text-yellow-700 text-sm font-medium">Menunggu</p>
                          </div>
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <p className="text-red-600 text-2xl font-bold">{classData?.member_limit || 30}</p>
                            <p className="text-red-700 text-sm font-medium">Batas Maksimal</p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <p className="text-purple-600 text-2xl font-bold">{classData?.remaining_quota || 0}</p>
                            <p className="text-purple-700 text-sm font-medium">Sisa Kuota</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Information Section */}
          {!isEditing && (
            <div className="mt-6 bg-gradient-to-r from-emerald-50 to-emerald-50 rounded-2xl p-6 border border-emerald-100">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="bg-emerald-500 p-3 rounded-xl">
                  <FiInfo className="text-white text-lg" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-900 mb-2">Informasi Penting</h4>
                  <div className="grid sm:grid-cols-2 gap-2 text-emerald-700 text-sm">
                    <div>• Perubahan akan terlihat oleh semua anggota</div>
                    <div>• Nama kelas harus unik</div>
                    <div>• Batas anggota tidak dapat diubah</div>
                    <div>• Anggota yang sudah bergabung tidak terpengaruh</div>
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

export default ClassSettingsPage;