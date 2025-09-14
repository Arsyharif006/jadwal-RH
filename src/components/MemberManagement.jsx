// ==========================================
// components/MemberManagement.js - Responsive Supabase Member Management
// ==========================================
import React, { useState, useEffect } from 'react';
import { 
  FiUser, 
  FiUserPlus, 
  FiCheck, 
  FiX, 
  FiClock,
  FiMail,
  FiCalendar,
  FiUsers,
  FiAlertCircle,
  FiRefreshCw,
  FiTrash2,
  
  FiChevronDown,
  FiMoreVertical
} from 'react-icons/fi';
import { LuCrown } from "react-icons/lu";
import { 
  getClassMembers, 
  updateMemberStatus, 
  formatSupabaseError,
  subscribeToClassMembers 
} from '../lib/supabase';

const MemberManagement = ({ user, profile, userClass, members, onMemberUpdate, isOnline }) => {
  const [activeTab, setActiveTab] = useState('approved');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingMembers, setProcessingMembers] = useState(new Set());
  const [expandedMembers, setExpandedMembers] = useState(new Set());

  // Filter members by status
  const approvedMembers = members.filter(member => member.status === 'approved');
  const pendingMembers = members.filter(member => member.status === 'pending');
  const rejectedMembers = members.filter(member => member.status === 'rejected');

  const handleApproveMember = async (memberId) => {
    if (!isOnline) {
      setError('Tidak dapat memproses anggota saat offline');
      return;
    }

    setProcessingMembers(prev => new Set([...prev, memberId]));
    setError('');

    try {
      const { data, error: updateError } = await updateMemberStatus(memberId, 'approved');
      
      if (updateError) {
        setError(formatSupabaseError(updateError));
      } else {
        // Refresh member data
        if (onMemberUpdate) {
          onMemberUpdate();
        }
      }
    } catch (error) {
      console.error('Error approving member:', error);
      setError('Terjadi kesalahan saat menyetujui anggota');
    } finally {
      setProcessingMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const handleRejectMember = async (memberId) => {
    if (!isOnline) {
      setError('Tidak dapat memproses anggota saat offline');
      return;
    }

    const member = members.find(m => m.id === memberId);
    const memberName = member?.full_name || member?.email || 'anggota ini';

    if (!window.confirm(`Apakah Anda yakin ingin menolak ${memberName}?`)) {
      return;
    }

    setProcessingMembers(prev => new Set([...prev, memberId]));
    setError('');

    try {
      const { data, error: updateError } = await updateMemberStatus(memberId, 'rejected');
      
      if (updateError) {
        setError(formatSupabaseError(updateError));
      } else {
        // Refresh member data
        if (onMemberUpdate) {
          onMemberUpdate();
        }
      }
    } catch (error) {
      console.error('Error rejecting member:', error);
      setError('Terjadi kesalahan saat menolak anggota');
    } finally {
      setProcessingMembers(prev => {
        const newSet = new Set(prev);
        newSet.delete(memberId);
        return newSet;
      });
    }
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Tidak diketahui';
    
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isCreator = (member) => {
    return member.user_id === userClass?.creator_id || 
           member.role === 'creator';
  };

  const canManageMembers = profile?.role === 'creator' && 
                          user?.id === userClass?.creator_id;

  // Generate avatar from first letter of first name
  const getAvatarInitial = (member) => {
    const name = member.full_name || member.email || 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  // Generate consistent color based on name
  const getAvatarColor = (member) => {
    const name = member.full_name || member.email || 'U';
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

  const toggleMemberExpanded = (memberId) => {
    setExpandedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const tabs = [
    { 
      id: 'approved', 
      label: 'Aktif', 
      fullLabel: 'Anggota Aktif',
      icon: FiUsers, 
      count: approvedMembers.length 
    },
    { 
      id: 'pending', 
      label: 'Pending', 
      fullLabel: 'Menunggu Persetujuan',
      icon: FiClock, 
      count: pendingMembers.length,
      badge: pendingMembers.length > 0 && canManageMembers
    },
    ...(canManageMembers ? [{
      id: 'rejected', 
      label: 'Ditolak', 
      fullLabel: 'Ditolak',
      icon: FiX, 
      count: rejectedMembers.length
    }] : [])
  ];

  const MemberCard = ({ member, status, showActions = false }) => {
    const memberIsCreator = isCreator(member);
    const isProcessing = processingMembers.has(member.id);
    const isExpanded = expandedMembers.has(member.id);

    return (
      <div className={`bg-white border rounded-lg transition-all duration-200 hover:shadow-md ${
        status === 'pending' ? 'border-yellow-200 lg:border-2' : 
        status === 'rejected' ? 'border-red-200 lg:border-2 opacity-75' : 
        'border-gray-200'
      }`}>
        {/* MOBILE LAYOUT */}
        <div className="lg:hidden">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 bg-gradient-to-r ${getAvatarColor(member)} rounded-full flex items-center justify-center text-white font-semibold shadow-md`}>
                  {getAvatarInitial(member)}
                </div>
                {memberIsCreator && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                    <LuCrown className="text-white text-xs" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {member.full_name || member.email}
                  </h3>
                  {memberIsCreator && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0">
                      Pembuat
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-xs truncate">{member.email}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {status === 'pending' ? 'Mengajukan' : 
                   status === 'rejected' ? 'Ditolak' : 'Bergabung'} {formatJoinDate(member.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {status === 'approved' && (
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                    Aktif
                  </div>
                )}
                {status === 'pending' && !canManageMembers && (
                  <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                    Pending
                  </div>
                )}
                {status === 'rejected' && (
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                    Ditolak
                  </div>
                )}
                
                <button
                  onClick={() => toggleMemberExpanded(member.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FiChevronDown className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>

            {/* Mobile Actions */}
            {showActions && canManageMembers && status === 'pending' && (isExpanded || true) && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleRejectMember(member.id)}
                  disabled={isProcessing || !isOnline}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  ) : (
                    <FiX />
                  )}
                  <span>Tolak</span>
                </button>
                <button
                  onClick={() => handleApproveMember(member.id)}
                  disabled={isProcessing || !isOnline}
                  className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                  ) : (
                    <FiCheck />
                  )}
                  <span>Setujui</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden lg:block p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-12 h-12 bg-gradient-to-r ${getAvatarColor(member)} rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md`}>
                  {getAvatarInitial(member)}
                </div>
                {memberIsCreator && (
                  <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                    <LuCrown className="text-white text-xs" />
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {member.full_name || member.email}
                  </h3>
                  {memberIsCreator && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                      Pembuat Kelas
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <FiMail className="text-xs" />
                    {member.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar className="text-xs" />
                    {status === 'pending' ? 'Mengajukan' : 
                     status === 'rejected' ? 'Ditolak' : 'Bergabung'} {formatJoinDate(member.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {status === 'approved' && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Aktif
                </div>
              )}
              
              {status === 'pending' && canManageMembers && (
                <>
                  <button
                    onClick={() => handleRejectMember(member.id)}
                    disabled={isProcessing || !isOnline}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    ) : (
                      <FiX className="text-lg" />
                    )}
                    <span>Tolak</span>
                  </button>
                  <button
                    onClick={() => handleApproveMember(member.id)}
                    disabled={isProcessing || !isOnline}
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    ) : (
                      <FiCheck className="text-lg" />
                    )}
                    <span>Setujui</span>
                  </button>
                </>
              )}

              {status === 'pending' && !canManageMembers && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  Menunggu Persetujuan
                </div>
              )}

              {status === 'rejected' && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                  Ditolak
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-red-800 font-medium text-sm mb-1">
                Terjadi Kesalahan
              </h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-600"
            >
              <FiX />
            </button>
          </div>
        </div>
      )}

      {/* Offline Warning */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 lg:p-4 mb-4 lg:mb-6">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-yellow-600" />
            <div>
              <h4 className="text-yellow-800 font-medium text-sm lg:text-base">Mode Offline</h4>
              <p className="text-yellow-700 text-xs lg:text-sm">
                Fitur pengelolaan anggota tidak tersedia saat offline
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STATS */}
      <div className="lg:hidden grid grid-cols-3 gap-2 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="bg-blue-500 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiUsers className="text-white text-sm" />
          </div>
          <p className="text-blue-900 font-bold text-lg">{approvedMembers.length}</p>
          <p className="text-blue-700 text-xs">Aktif</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="bg-yellow-500 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiClock className="text-white text-sm" />
          </div>
          <p className="text-yellow-900 font-bold text-lg">{pendingMembers.length}</p>
          <p className="text-yellow-700 text-xs">Pending</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
          <div className="bg-orange-500 w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2">
            <FiCalendar className="text-white text-sm" />
          </div>
          <p className="text-orange-900 font-bold text-lg">{members.length}</p>
          <p className="text-orange-700 text-xs">Total</p>
        </div>
      </div>

      {/* DESKTOP STATS */}
      <div className="hidden lg:grid grid-cols-3 gap-6 mb-6">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <FiUsers className="text-white text-lg" />
            </div>
            <div>
              <p className="text-emerald-900 font-semibold text-lg">{approvedMembers.length}</p>
              <p className="text-emerald-700 text-sm">Anggota Aktif</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <FiClock className="text-white text-lg" />
            </div>
            <div>
              <p className="text-yellow-900 font-semibold text-lg">{pendingMembers.length}</p>
              <p className="text-yellow-700 text-sm">Menunggu Persetujuan</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <FiCalendar className="text-white text-lg" />
            </div>
            <div>
              <p className="text-green-900 font-semibold text-lg">{members.length}</p>
              <p className="text-green-700 text-sm">Total Permintaan</p>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE TABS */}
      <div className="lg:hidden flex space-x-1 mb-4 overflow-x-auto">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap text-sm ${
                activeTab === tab.id
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <IconComponent className="text-sm" />
              <span>{tab.label}</span>
              <span className={`bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-0.5 min-w-[18px] text-center ${
                activeTab === tab.id ? 'bg-emerald-200 text-emerald-800' : ''
              }`}>
                {tab.count}
              </span>
              {tab.badge && (
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* DESKTOP TABS */}
      <div className="hidden lg:flex space-x-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <IconComponent className="text-lg" />
              <span>{tab.fullLabel}</span>
              <span className={`bg-gray-200 text-gray-700 text-xs rounded-full px-2 py-1 min-w-[20px] text-center ${
                activeTab === tab.id ? 'bg-emerald-200 text-emerald-800' : ''
              }`}>
                {tab.count}
              </span>
              {tab.badge && (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'approved' && (
        <div>
          {approvedMembers.length > 0 ? (
            <div className="space-y-3 lg:space-y-4">
              {approvedMembers.map((member) => (
                <MemberCard key={member.id} member={member} status="approved" />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 lg:py-12">
              <div className="bg-gray-100 w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiUsers className="text-gray-400 text-lg lg:text-2xl" />
              </div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">Belum ada anggota</h3>
              <p className="text-gray-600 text-sm">
                Anggota yang disetujui akan muncul di sini
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pending' && (
        <div>
          {pendingMembers.length > 0 ? (
            <div className="space-y-4">
              {/* Info Banner - Desktop only */}
              {canManageMembers && (
                <div className="hidden lg:block bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <FiAlertCircle className="text-yellow-600 text-lg mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">Permintaan Bergabung</h4>
                      <p className="text-yellow-800 text-sm">
                        Tinjau dan setujui anggota baru yang ingin bergabung ke kelas Anda. 
                        Anggota yang disetujui akan dapat melihat semua jadwal.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 lg:space-y-4">
                {pendingMembers.map((member) => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    status="pending" 
                    showActions={true}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 lg:py-12">
              <div className="bg-gray-100 w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiClock className="text-gray-400 text-lg lg:text-2xl" />
              </div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">Tidak ada permintaan</h3>
              <p className="text-gray-600 text-sm">
                {canManageMembers 
                  ? 'Permintaan bergabung dari anggota baru akan muncul di sini'
                  : 'Tidak ada permintaan yang sedang diproses'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rejected' && canManageMembers && (
        <div>
          {rejectedMembers.length > 0 ? (
            <div className="space-y-4">
              {/* Info Banner - Desktop only */}
              <div className="hidden lg:block bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FiX className="text-red-600 text-lg mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900 mb-1">Anggota yang Ditolak</h4>
                    <p className="text-red-800 text-sm">
                      Daftar anggota yang permintaan bergabungnya telah ditolak.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 lg:space-y-4">
                {rejectedMembers.map((member) => (
                  <MemberCard key={member.id} member={member} status="rejected" />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 lg:py-12">
              <div className="bg-gray-100 w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiX className="text-gray-400 text-lg lg:text-2xl" />
              </div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">Tidak ada anggota yang ditolak</h3>
              <p className="text-gray-600 text-sm">
                Anggota yang ditolak akan muncul di sini
              </p>
            </div>
          )}
        </div>
      )}

      {/* CLASS INFO FOOTER */}
      <div className="mt-6 lg:mt-8 bg-gray-50 rounded-lg p-3 lg:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-0 text-xs lg:text-sm text-gray-600">
          <div className="flex flex-wrap items-center gap-2 lg:gap-4">
            <span>Kelas: <strong>{userClass?.name}</strong></span>
            <span className="hidden lg:inline">•</span>
            <span>Dibuat: {formatJoinDate(userClass?.created_at)}</span>
            <span className="hidden lg:inline">•</span>
            <span>
              Peran: <strong>{profile?.role === 'creator' ? 'Pembuat jadwal' : 'Anggota'}</strong>
            </span>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
            <div className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            {canManageMembers && pendingMembers.length > 0 && (
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                {pendingMembers.length} Menunggu
              </div>
            )}
          </div>
        </div>

        {/* Additional Actions for Creators */}
        {canManageMembers && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 text-xs lg:text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FiUsers className="text-emerald-500" />
                <span>
                  {approvedMembers.length} anggota aktif dari {members.length} total permintaan
                </span>
              </div>
              
              {pendingMembers.length > 0 && (
                <div className="flex items-center gap-2">
                  <FiClock className="text-yellow-500" />
                  <span>
                    {pendingMembers.length} permintaan menunggu persetujuan Anda
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions - Mobile Only */}
      {canManageMembers && pendingMembers.length > 0 && (
        <div className="lg:hidden mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-emerald-900 text-sm">Permintaan Baru</h4>
              <p className="text-emerald-700 text-xs">
                {pendingMembers.length} anggota menunggu persetujuan
              </p>
            </div>
            <button
              onClick={() => setActiveTab('pending')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              Tinjau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;