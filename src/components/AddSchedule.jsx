// ==========================================
// components/AddSchedule.js - Supabase Integrated Add Schedule Modal
// ==========================================
import React, { useState } from 'react';
import { FiX, FiCalendar, FiClock, FiBook, FiPlus, FiAlertCircle } from 'react-icons/fi';
import { createSchedule, formatSupabaseError } from '../lib/supabase';

const AddSchedule = ({ user, profile, userClass, onClose, onScheduleAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'homework'
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Judul tidak boleh kosong';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Judul minimal 3 karakter';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Judul maksimal 100 karakter';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Deskripsi tidak boleh kosong';
    } else if (formData.description.length < 5) {
      newErrors.description = 'Deskripsi minimal 5 karakter';
    } else if (formData.description.length > 500) {
      newErrors.description = 'Deskripsi maksimal 500 karakter';
    }

    if (!formData.date) {
      newErrors.date = 'Tanggal tidak boleh kosong';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Tanggal tidak boleh di masa lalu';
      }

      // Check if date is more than 1 year in future
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (selectedDate > oneYearFromNow) {
        newErrors.date = 'Tanggal tidak boleh lebih dari 1 tahun ke depan';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Waktu tidak boleh kosong';
    }

    if (!['homework', 'exam'].includes(formData.type)) {
      newErrors.type = 'Jenis kegiatan tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      // Prepare schedule data for Supabase
      const scheduleData = {
        class_id: userClass.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        time: formData.time,
        type: formData.type,
        created_by: user.id
      };

      const { data, error } = await createSchedule(scheduleData);

      if (error) {
        setApiError(formatSupabaseError(error));
        setIsLoading(false);
        return;
      }

      // Success - call callback and close modal
      if (onScheduleAdded) {
        onScheduleAdded(data);
      }
      
      onClose();

    } catch (error) {
      console.error('Error creating schedule:', error);
      setApiError('Terjadi kesalahan saat menyimpan jadwal. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const maxDate = oneYearFromNow.toISOString().split('T')[0];

  const scheduleTypes = [
    {
      id: 'homework',
      label: 'Pekerjaan Rumah',
      description: 'PR, Tugas, Presentasi',
      icon: FiBook,
      color: 'orange'
    },
    {
      id: 'exam',
      label: 'Pelajaran',
      description: 'Mata Kuliah',
      icon: FiCalendar,
      color: 'red'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <FiPlus className="text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tambah Jadwal Baru</h2>
                <p className="text-white">
                  Kelas {userClass?.name} • oleh {profile?.full_name || user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* API Error */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-red-800 font-medium text-sm mb-1">
                      Gagal Menyimpan Jadwal
                    </h4>
                    <p className="text-red-700 text-sm">{apiError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Judul Jadwal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Contoh: PR Matematika, Ujian Fisika"
                disabled={isLoading}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-opacity-20 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.title 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.title && (
                <p className="mt-2 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.title.length}/100 karakter
              </p>
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
                placeholder="Jelaskan detail jadwal, materi, atau instruksi..."
                rows={4}
                disabled={isLoading}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-opacity-20 transition-all duration-200 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed ${
                  errors.description 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {errors.description && (
                <p className="mt-2 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.description.length}/500 karakter
              </p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tanggal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    min={today}
                    max={maxDate}
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-opacity-20 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                      errors.date 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.date && (
                  <p className="mt-2 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Waktu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-opacity-20 transition-all duration-200 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                      errors.time 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                    }`}
                  />
                </div>
                {errors.time && (
                  <p className="mt-2 text-sm text-red-600">{errors.time}</p>
                )}
              </div>
            </div>

            {/* Type - Responsive Layout */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Jenis Kegiatan <span className="text-red-500">*</span>
              </label>
              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scheduleTypes.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = formData.type === type.id;
                  
                  return (
                    <label 
                      key={type.id}
                      className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isLoading ? 'cursor-not-allowed opacity-50' : 'hover:shadow-md'
                      } ${
                        isSelected
                          ? type.color === 'orange'
                            ? 'border-orange-300 bg-orange-50 shadow-md'
                            : 'border-red-300 bg-red-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={type.id}
                        checked={isSelected}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3 w-full">
                        <div className={`p-3 rounded-lg transition-all duration-200 ${
                          isSelected 
                            ? type.color === 'orange'
                              ? 'bg-orange-500 shadow-lg' 
                              : 'bg-red-500 shadow-lg'
                            : 'bg-gray-200'
                        }`}>
                          <IconComponent className={`text-xl ${
                            isSelected ? 'text-white' : 'text-gray-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold text-sm mb-1 ${
                            isSelected ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {type.label}
                          </p>
                          <p className={`text-xs ${
                            isSelected ? 'text-gray-700' : 'text-gray-500'
                          }`}>
                            {type.description}
                          </p>
                        </div>
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className={`w-3 h-3 rounded-full ${
                            type.color === 'orange' ? 'bg-orange-500' : 'bg-red-500'
                          }`}></div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Preview */}
            {formData.title && formData.date && formData.time && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Preview Jadwal
                </h4>
                <div className="text-sm text-emerald-800 space-y-1">
                  <p><strong>Judul:</strong> {formData.title}</p>
                  <p><strong>Tanggal:</strong> {new Date(formData.date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                  <p><strong>Waktu:</strong> {formData.time}</p>
                  <p><strong>Jenis:</strong> {scheduleTypes.find(t => t.id === formData.type)?.label}</p>
                  <p><strong>Deskripsi:</strong> {formData.description.slice(0, 100)}{formData.description.length > 100 ? '...' : ''}</p>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title || !formData.description || !formData.date || !formData.time}
                className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <FiPlus className="text-lg" />
                    <span>Tambah Jadwal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Database Status */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Terhubung ke Supabase Database
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSchedule;