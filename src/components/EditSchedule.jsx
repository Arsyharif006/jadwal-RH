import React, { useState, useEffect } from 'react';
import { 
  updateSchedule, 
  formatSupabaseError 
} from '../lib/supabase';
import { FiX, FiCalendar, FiClock, FiBook, FiEdit, FiSave, FiWifiOff } from 'react-icons/fi';

const EditSchedule = ({ schedule, classId, onClose, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    schedule_date: '',
    schedule_time: '',
    type: 'homework'
  });
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Initialize form with existing schedule data
  useEffect(() => {
    if (schedule) {
      setFormData({
        title: schedule.title || '',
        description: schedule.description || '',
        schedule_date: schedule.schedule_date || '',
        schedule_time: schedule.schedule_time || '',
        type: schedule.type || 'homework'
      });
    }
  }, [schedule]);

  // Check if form has changes
  useEffect(() => {
    if (schedule) {
      const changed = 
        formData.title !== schedule.title ||
        formData.description !== (schedule.description || '') ||
        formData.schedule_date !== schedule.schedule_date ||
        formData.schedule_time !== schedule.schedule_time ||
        formData.type !== schedule.type;
      setHasChanges(changed);
    }
  }, [formData, schedule]);

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

    if (!formData.schedule_date) {
      newErrors.schedule_date = 'Tanggal tidak boleh kosong';
    } else {
      const selectedDate = new Date(formData.schedule_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Allow past dates for editing existing schedules
      // Only warn if it's more than 30 days in the past
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      if (selectedDate < thirtyDaysAgo) {
        newErrors.schedule_date = 'Tanggal terlalu jauh di masa lalu';
      }
    }

    if (!formData.schedule_time) {
      newErrors.schedule_time = 'Waktu tidak boleh kosong';
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      alert('Tidak dapat menyimpan perubahan saat offline');
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await updateSchedule(schedule.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        schedule_date: formData.schedule_date,
        schedule_time: formData.schedule_time,
        type: formData.type
      });

      if (error) {
        throw new Error(formatSupabaseError(error));
      }

      // Call parent callbacks
      if (onUpdate) {
        onUpdate();
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating schedule:', error);
      alert('Gagal menyimpan perubahan: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return '';
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScheduleTypeLabel = (type) => {
    switch (type) {
      case 'homework': return 'Pekerjaan Rumah';
      case 'exam': return 'Pelajaran';
      default: return 'Kegiatan';
    }
  };

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
                <FiEdit className="text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Edit Jadwal</h2>
                <p className="text-white">
                  {getScheduleTypeLabel(schedule?.type)} • ID: {schedule?.id}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-all duration-200"
              title="Tutup"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Offline Warning */}
        {!isOnline && (
          <div className="bg-yellow-50 border-b border-yellow-200 p-4">
            <div className="flex items-center gap-2">
              <FiWifiOff className="text-yellow-600" />
              <p className="text-yellow-800 font-medium">Mode Offline</p>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Tidak dapat menyimpan perubahan saat offline
            </p>
          </div>
        )}

        {/* Original Schedule Info */}
        <div className="bg-gray-50 border-b p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Jadwal Asli:</h4>
          <div className="text-sm text-gray-600">
            <p><strong>Judul:</strong> {schedule?.title}</p>
            <p><strong>Waktu:</strong> {formatDateTime(schedule?.schedule_date, schedule?.schedule_time)}</p>
            <p><strong>Dibuat:</strong> {schedule?.created_at ? 
              new Date(schedule.created_at).toLocaleDateString('id-ID') : 'N/A'}</p>
            <p><strong>Diperbarui:</strong> {schedule?.updated_at ? 
              new Date(schedule.updated_at).toLocaleDateString('id-ID') : 'Belum pernah'}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
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
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-opacity-20 transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 ${
                  errors.title 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500'
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
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-opacity-20 transition-all duration-200 resize-none disabled:opacity-50 disabled:bg-gray-100 ${
                  errors.description 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500'
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
                    name="schedule_date"
                    value={formData.schedule_date}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-opacity-20 transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 ${
                      errors.schedule_date 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                  />
                </div>
                {errors.schedule_date && (
                  <p className="mt-2 text-sm text-red-600">{errors.schedule_date}</p>
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
                    name="schedule_time"
                    value={formData.schedule_time}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:ring-4 focus:ring-opacity-20 transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 ${
                      errors.schedule_time 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                        : 'border-gray-200 focus:border-orange-500 focus:ring-orange-500'
                    }`}
                  />
                </div>
                {errors.schedule_time && (
                  <p className="mt-2 text-sm text-red-600">{errors.schedule_time}</p>
                )}
              </div>
            </div>

            {/* Type - Responsive Layout like AddSchedule */}
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
            </div>

            {/* Changes Summary */}
            {hasChanges && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Perubahan yang akan disimpan:
                </h4>
                <div className="text-sm text-emerald-800 space-y-1">
                  {formData.title !== schedule?.title && (
                    <p>• Judul: "{schedule?.title}" → "{formData.title}"</p>
                  )}
                  {formData.description !== (schedule?.description || '') && (
                    <p>• Deskripsi: "{schedule?.description}" → "{formData.description}"</p>
                  )}
                  {formData.schedule_date !== schedule?.schedule_date && (
                    <p>• Tanggal: {schedule?.schedule_date} → {formData.schedule_date}</p>
                  )}
                  {formData.schedule_time !== schedule?.schedule_time && (
                    <p>• Waktu: {schedule?.schedule_time} → {formData.schedule_time}</p>
                  )}
                  {formData.type !== schedule?.type && (
                    <p>• Jenis: {getScheduleTypeLabel(schedule?.type)} → {getScheduleTypeLabel(formData.type)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="w-full sm:flex-1 bg-gray-200 text-gray-800 py-4 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading || !hasChanges || !isOnline}
                className="w-full sm:flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <FiSave className="text-lg" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSchedule;