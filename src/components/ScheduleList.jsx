import React, { useState, useMemo } from 'react';
import { 
  deleteSchedule as deleteScheduleSupabase, 
  formatSupabaseError 
} from '../lib/supabase';
import EditSchedule from './EditSchedule';
import { 
  FiCalendar, 
  FiClock, 
  FiBook, 
  FiEdit, 
  FiTrash, 
  FiUser,
  FiFilter,
  FiSearch,
  FiLoader,
  FiWifiOff,
  FiChevronLeft,
  FiChevronRight,
  FiMoreVertical,
  FiChevronDown,
  FiAlertCircle,
  FiX
} from 'react-icons/fi';

const ScheduleList = ({ schedules = [], user, profile, userClass, onScheduleUpdate, isOnline }) => {
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [filter, setFilter] = useState('all'); // all, homework, exam
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, title, type
  const [deleting, setDeleting] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const isClassCreator = profile?.role === 'creator';

  // Filter and sort schedules
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(schedule => {
        // Filter by type
        if (filter !== 'all' && schedule.type !== filter) return false;
        
        // Filter by search term
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            schedule.title.toLowerCase().includes(searchLower) ||
            (schedule.description && schedule.description.toLowerCase().includes(searchLower))
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return new Date(a.schedule_date + ' ' + a.schedule_time) - new Date(b.schedule_date + ' ' + b.schedule_time);
          case 'title':
            return a.title.localeCompare(b.title);
          case 'type':
            return a.type.localeCompare(b.type);
          default:
            return 0;
        }
      });
  }, [schedules, filter, searchTerm, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedules = filteredSchedules.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, sortBy]);

  const handleDelete = async (scheduleId) => {
    if (!isOnline) {
      alert('Tidak dapat menghapus jadwal saat offline');
      return;
    }

    if (window.confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) {
      setDeleting(scheduleId);
      try {
        const { error } = await deleteScheduleSupabase(scheduleId);
        
        if (error) {
          throw new Error(formatSupabaseError(error));
        }
        
        if (onScheduleUpdate) {
          onScheduleUpdate();
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Gagal menghapus jadwal: ' + error.message);
      } finally {
        setDeleting(null);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hari ini';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Besok';
    } else {
      return date.toLocaleDateString('id-ID', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
    }
  };

  const formatDateShort = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hari ini';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Besok';
    } else {
      return date.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'short'
      });
    }
  };

  const getScheduleTypeColor = (type) => {
    switch (type) {
      case 'homework':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          border: 'border-orange-200',
          label: 'PR',
          icon: FiBook
        };
      case 'exam':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          border: 'border-red-200',
          label: 'Pelajaran',
          icon: FiCalendar
        };
      default:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          border: 'border-blue-200',
          label: 'Pelajaran',
          icon: FiCalendar
        };
    }
  };

  const getTimeStatus = (date, time) => {
    const scheduleDateTime = new Date(date + 'T' + time);
    const now = new Date();
    
    if (scheduleDateTime < now) {
      return { status: 'past', color: 'text-gray-500', label: 'Selesai', bg: 'bg-gray-100' };
    } else if (scheduleDateTime.toDateString() === now.toDateString()) {
      return { status: 'today', color: 'text-green-600', label: 'Hari ini', bg: 'bg-green-100' };
    } else {
      return { status: 'upcoming', color: 'text-blue-600', label: 'Mendatang', bg: 'bg-blue-100' };
    }
  };

  const toggleCardExpansion = (scheduleId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scheduleId)) {
        newSet.delete(scheduleId);
      } else {
        newSet.add(scheduleId);
      }
      return newSet;
    });
  };

  // Empty state
  if (schedules.length === 0) {
    return (
      <div className="text-center py-8 lg:py-12">
        <div className="bg-gray-100 w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCalendar className="text-gray-500 text-2xl lg:text-3xl" />
        </div>
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">Belum ada jadwal</h3>
        <p className="text-gray-600 text-sm lg:text-base mb-6 max-w-md mx-auto">
          {isClassCreator 
            ? 'Mulai tambahkan jadwal pelajaran untuk kelas Anda'
            : 'Jadwal pelajaran akan muncul di sini ketika pembuat jadwal menambahkannya'
          }
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Offline Warning */}
      {!isOnline && (
        <div className="mb-4 lg:mb-6 p-3 lg:p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <FiWifiOff className="text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 font-medium text-sm lg:text-base">Mode Offline</p>
              <p className="text-yellow-700 text-xs lg:text-sm mt-1">
                Beberapa fitur seperti edit dan hapus tidak tersedia saat offline
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE: Compact Filters */}
      <div className="lg:hidden mb-4">
        {/* Search */}
        <div className="relative mb-3">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari jadwal..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700"
          >
            <FiFilter />
            <span>Filter & Urutkan</span>
            <FiChevronDown className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="text-xs text-gray-600">
            {filteredSchedules.length} jadwal
          </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-3">
            {/* Type Filter */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Jenis:</label>
              <div className="flex gap-1">
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'homework', label: 'PR' },
                  { key: 'exam', label: 'Pelajaran' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all duration-200 ${
                      filter === option.key
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">Urutkan:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-200 rounded px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Tanggal</option>
                <option value="title">Judul</option>
                <option value="type">Jenis</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP: Full Filters */}
      <div className="hidden lg:block mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari jadwal..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>
          
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'homework', label: 'PR' },
              { key: 'exam', label: 'Pelajaran' }
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                  filter === option.key
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-gray-700">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Tanggal</option>
              <option value="title">Judul</option>
              <option value="type">Jenis</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Menampilkan {filteredSchedules.length} dari {schedules.length} jadwal
        </div>
      </div>

      {/* MOBILE: Schedule Cards - Compact Layout */}
      <div className="lg:hidden space-y-3">
        {paginatedSchedules.map((schedule) => {
          const typeColor = getScheduleTypeColor(schedule.type);
          const timeStatus = getTimeStatus(schedule.schedule_date, schedule.schedule_time);
          const TypeIcon = typeColor.icon;
          const isExpanded = expandedCards.has(schedule.id);
          
          return (
            <div
              key={schedule.id}
              className={`bg-white border rounded-lg shadow-sm transition-all duration-200 ${
                timeStatus.status === 'past' ? 'opacity-75' : ''
              }`}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`p-1.5 rounded ${typeColor.bg}`}>
                      <TypeIcon className={`text-sm ${typeColor.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {schedule.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeColor.bg} ${typeColor.text}`}>
                          {typeColor.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${timeStatus.bg} ${timeStatus.color}`}>
                          {timeStatus.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isClassCreator && isOnline && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingSchedule(schedule)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <FiEdit className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          disabled={deleting === schedule.id}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                        >
                          {deleting === schedule.id ? (
                            <FiLoader className="text-sm animate-spin" />
                          ) : (
                            <FiTrash className="text-sm" />
                          )}
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => toggleCardExpansion(schedule.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <FiChevronDown className={`text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Time and Date - Always Visible */}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <FiCalendar className="text-blue-500" />
                    <span>{formatDateShort(schedule.schedule_date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FiClock className="text-green-500" />
                    <span>{schedule.schedule_time}</span>
                  </div>
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    {schedule.description && (
                      <p className="text-gray-600 text-sm">
                        {schedule.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <FiUser className="text-purple-500" />
                      <span>
                        {schedule.creator_name || 
                         schedule.profiles?.full_name || 
                         schedule.created_by_name ||
                         profile?.full_name ||
                         'Tidak diketahui'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP: Schedule Cards - Full Layout */}
      <div className="hidden lg:block space-y-4">
        {paginatedSchedules.map((schedule) => {
          const typeColor = getScheduleTypeColor(schedule.type);
          const timeStatus = getTimeStatus(schedule.schedule_date, schedule.schedule_time);
          const TypeIcon = typeColor.icon;
          
          return (
            <div
              key={schedule.id}
              className={`bg-white border-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
                timeStatus.status === 'past' ? 'opacity-75' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${typeColor.bg}`}>
                        <TypeIcon className={`text-lg ${typeColor.text}`} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColor.bg} ${typeColor.text} ${typeColor.border} border`}>
                        {typeColor.label}
                      </span>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${timeStatus.bg} ${timeStatus.color}`}>
                        {timeStatus.label}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {schedule.title}
                    </h3>
                    
                    {schedule.description && (
                      <p className="text-gray-600 mb-3">
                        {schedule.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {isClassCreator && isOnline && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setEditingSchedule(schedule)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                        title="Edit jadwal"
                      >
                        <FiEdit className="text-lg" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule.id)}
                        disabled={deleting === schedule.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                        title="Hapus jadwal"
                      >
                        {deleting === schedule.id ? (
                          <FiLoader className="text-lg animate-spin" />
                        ) : (
                          <FiTrash className="text-lg" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Schedule Details */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-blue-500" />
                    <span className="font-medium">
                      {formatDate(schedule.schedule_date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FiClock className="text-green-500" />
                    <span className="font-medium">
                      {schedule.schedule_time}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FiUser className="text-purple-500" />
                    <span className="font-medium">
                      {schedule.creator_name || 
                       schedule.profiles?.full_name || 
                       schedule.created_by_name ||
                       profile?.full_name ||
                       'Tidak diketahui'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* No results */}
      {filteredSchedules.length === 0 && schedules.length > 0 && (
        <div className="text-center py-8">
          <div className="bg-gray-100 w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiSearch className="text-gray-500 text-lg lg:text-2xl" />
          </div>
          <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">Tidak ada hasil</h3>
          <p className="text-gray-600 text-sm lg:text-base">
            Tidak ditemukan jadwal yang sesuai dengan filter atau pencarian Anda
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 lg:mt-8">
          {/* Mobile Pagination */}
          <div className="lg:hidden flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <FiChevronLeft className="text-sm" />
              <span>Sebelum</span>
            </button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <span>Selanjutnya</span>
              <FiChevronRight className="text-sm" />
            </button>
          </div>

          {/* Desktop Pagination */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Menampilkan {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredSchedules.length)} dari {filteredSchedules.length} jadwal
              </span>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per halaman:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronLeft />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2;
                })
                .map((page, index, pages) => (
                  <React.Fragment key={page}>
                    {index > 0 && pages[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <EditSchedule
          schedule={editingSchedule}
          classId={userClass?.id}
          onClose={() => setEditingSchedule(null)}
          onUpdate={() => {
            setEditingSchedule(null);
            if (onScheduleUpdate) {
              onScheduleUpdate();
            }
          }}
        />
      )}
    </div>
  );
};

export default ScheduleList;