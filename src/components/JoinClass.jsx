import React, { useState, useEffect } from 'react';
import { FiSearch, FiUsers, FiClock, FiCheck, FiX, FiUserPlus, FiLoader, FiBook, FiAlertCircle } from 'react-icons/fi';
import { 
  searchClasses, 
  requestJoinClass, 
  getCurrentUser,
  formatSupabaseError,
  getMembershipStatus
} from '../lib/supabase';

const JoinClass = ({ onClassJoined }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [joiningClassId, setJoiningClassId] = useState(null);

  // Load current user
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { user, error } = await getCurrentUser();
        if (error) {
          throw new Error(formatSupabaseError(error));
        }
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading user:', error);
        setError('Gagal memuat data pengguna');
      }
    };
    loadCurrentUser();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);
    setSearchPerformed(true);
    
    try {
      const { data, error: searchError } = await searchClasses(searchTerm.trim());
      
      if (searchError) {
        throw new Error(formatSupabaseError(searchError));
      }
      
      // Format data from classes_with_stats view
      const formattedResults = data?.map(classData => ({
        id: classData.id,
        name: classData.name,
        description: classData.description,
        prodi: classData.prodi,
        creator: classData.creator_name || 'Unknown',
        creator_id: classData.creator_id,
        member_limit: classData.member_limit,
        current_members: classData.approved_members || 0,
        remaining_quota: classData.remaining_quota || classData.member_limit,
        is_full: classData.is_full || false,
        created_at: classData.created_at,
        status: classData.is_active ? 'active' : 'inactive'
      })) || [];
      
      // Check existing membership status for each class
      if (currentUser) {
        const resultsWithStatus = await Promise.all(
          formattedResults.map(async (classData) => {
            try {
              const { data: membership } = await getMembershipStatus(currentUser.id, classData.id);
              return {
                ...classData,
                membershipStatus: membership?.status || null
              };
            } catch (error) {
              return {
                ...classData,
                membershipStatus: null
              };
            }
          })
        );
        setSearchResults(resultsWithStatus);
      } else {
        setSearchResults(formattedResults);
      }
      
    } catch (error) {
      console.error('Error searching classes:', error);
      setError(error.message);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRequest = async (classData) => {
    if (!currentUser) {
      setError('Anda harus login terlebih dahulu');
      return;
    }

    // Check if already a member or has pending request
    if (classData.membershipStatus) {
      if (classData.membershipStatus === 'approved') {
        setError('Anda sudah menjadi anggota kelas ini');
        return;
      } else if (classData.membershipStatus === 'pending') {
        setError('Anda sudah mengirim permintaan ke kelas ini. Menunggu persetujuan admin.');
        return;
      } else if (classData.membershipStatus === 'rejected') {
        setError('Permintaan Anda telah ditolak oleh admin kelas ini');
        return;
      }
    }

    // Check if class is full
    if (classData.is_full) {
      setError(`Kelas ${classData.name} sudah penuh (${classData.member_limit}/${classData.member_limit} anggota)`);
      return;
    }

    // Show confirmation alert
    const isConfirmed = window.confirm(
      `Yakin ingin bergabung dengan kelas "${classData.name}"?\n\n` +
      `Prodi: ${classData.prodi}\n` +
      `Pembuat: ${classData.creator}\n` +
      `Anggota: ${classData.current_members}/${classData.member_limit}\n\n` +
      `Permintaan akan dikirim ke admin untuk disetujui.`
    );

    if (!isConfirmed) {
      return;
    }

    setJoiningClassId(classData.id);
    setError(null);
    
    try {
      const { data, error: joinError } = await requestJoinClass(classData.id, currentUser.id);
      
      if (joinError) {
        // Check for specific error codes
        if (joinError.code === '23505') { // unique constraint violation
          throw new Error('Anda sudah mengirim permintaan atau sudah bergabung dengan kelas ini');
        }
        if (joinError.code === 'CLASS_FULL') {
          throw new Error(joinError.message);
        }
        throw new Error(formatSupabaseError(joinError));
      }
      
      // Update the search results to show pending status
      setSearchResults(prev => 
        prev.map(result => 
          result.id === classData.id 
            ? { ...result, membershipStatus: 'pending' }
            : result
        )
      );
      
    } catch (error) {
      console.error('Error joining class:', error);
      setError(error.message);
    } finally {
      setJoiningClassId(null);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const resetSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setSearchPerformed(false);
    setError(null);
  };

  const getJoinButtonState = (classData) => {
    if (joiningClassId === classData.id) {
      return { 
        text: 'Mengirim...', 
        disabled: true, 
        icon: FiClock, 
        className: 'bg-gray-400 text-gray-700 cursor-not-allowed' 
      };
    }
    
    if (classData.membershipStatus === 'approved') {
      return { 
        text: 'Sudah Bergabung', 
        disabled: true, 
        icon: FiCheck, 
        className: 'bg-green-200 text-green-700 cursor-not-allowed' 
      };
    }
    
    if (classData.membershipStatus === 'pending') {
      return { 
        text: 'Menunggu Persetujuan', 
        disabled: true, 
        icon: FiClock, 
        className: 'bg-yellow-200 text-yellow-700 cursor-not-allowed' 
      };
    }
    
    if (classData.membershipStatus === 'rejected') {
      return { 
        text: 'Ditolak', 
        disabled: true, 
        icon: FiX, 
        className: 'bg-red-200 text-red-700 cursor-not-allowed' 
      };
    }
    
    if (classData.is_full) {
      return { 
        text: 'Penuh', 
        disabled: true, 
        icon: FiX, 
        className: 'bg-gray-300 text-gray-500 cursor-not-allowed' 
      };
    }
    
    if (classData.status !== 'active') {
      return { 
        text: 'Tidak Aktif', 
        disabled: true, 
        icon: FiX, 
        className: 'bg-gray-300 text-gray-500 cursor-not-allowed' 
      };
    }
    
    return { 
      text: 'Gabung', 
      disabled: false, 
      icon: FiUserPlus, 
      className: 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
    };
  };

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
              <FiSearch className="text-white text-4xl" />
            </div>
            
            <h1 className="text-4xl font-bold mb-6 leading-tight">
              Temukan Kelas
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Yang Tepat
              </span>
            </h1>
            
            <p className="text-xl text-green-100 mb-12 leading-relaxed">
              Bergabunglah dengan kelas yang sesuai dengan minat dan kebutuhan pembelajaran Anda
            </p>

            {/* Feature Highlights */}
            <div className="space-y-6">
              <div className="flex items-center text-left">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <FiBook className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Pembelajaran Berkualitas</h3>
                  <p className="text-green-100 text-sm">Materi dan metode terdepan</p>
                </div>
              </div>
              
              <div className="flex items-center text-left">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <FiUsers className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Komunitas Aktif</h3>
                  <p className="text-green-100 text-sm">Belajar bersama teman sejawat</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Search Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Cari Kelas
              </h2>
              <p className="text-gray-600">
                Masukkan nama kelas atau program studi untuk mencari kelas yang tersedia
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2">
                  <FiX className="text-red-500" />
                  <p className="text-red-700 font-medium">Error</p>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 text-sm font-medium mt-2 hover:text-red-800"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Search Card */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 mb-8">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Masukkan nama kelas (contoh: R.1.H) atau prodi"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-500 focus:ring-opacity-20 focus:border-green-500 transition-all duration-200"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading || !searchTerm.trim()}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <FiLoader className="text-xl animate-spin" />
                  ) : (
                    'Cari'
                  )}
                </button>
                
                {searchTerm && (
                  <button
                    onClick={resetSearch}
                    className="text-gray-500 hover:text-gray-700 px-4 py-4 rounded-xl transition-all duration-200"
                    title="Reset pencarian"
                  >
                    <FiX className="text-xl" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {!isLoading && searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Hasil Pencarian ({searchResults.length} kelas)
                  </h2>
                  <button
                    onClick={resetSearch}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Pencarian baru
                  </button>
                </div>
                
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {searchResults.map((classData) => {
                    const buttonState = getJoinButtonState(classData);
                    const IconComponent = buttonState.icon;
                    
                    return (
                      <div key={classData.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-green-100 p-2 rounded-lg">
                                <FiUsers className="text-green-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">{classData.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <span>Dibuat oleh {classData.creator}</span>
                                  <span>•</span>
                                  <div className="flex items-center gap-1">
                                    <FiBook className="text-blue-500" />
                                    <span className="text-blue-600 font-medium">{classData.prodi}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-4">{classData.description}</p>
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <FiUsers className="text-green-500" />
                                <span>{classData.current_members}/{classData.member_limit} anggota</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${classData.remaining_quota > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={classData.remaining_quota > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {classData.remaining_quota > 0 
                                    ? `Sisa ${classData.remaining_quota} slot` 
                                    : 'Penuh'
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FiClock className="text-gray-400" />
                                <span>Dibuat {new Date(classData.created_at).toLocaleDateString('id-ID')}</span>
                              </div>
                            </div>
                            
                            {/* Status Indicators */}
                            {classData.membershipStatus === 'pending' && (
                              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                                <FiClock className="text-yellow-600 text-sm" />
                                <p className="text-yellow-700 text-sm">
                                  Permintaan sedang menunggu persetujuan admin
                                </p>
                              </div>
                            )}
                            
                            {classData.membershipStatus === 'approved' && (
                              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                                <FiCheck className="text-green-600 text-sm" />
                                <p className="text-green-700 text-sm">
                                  Anda sudah menjadi anggota kelas ini
                                </p>
                              </div>
                            )}
                            
                            {classData.membershipStatus === 'rejected' && (
                              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                                <FiX className="text-red-600 text-sm" />
                                <p className="text-red-700 text-sm">
                                  Permintaan ditolak oleh admin kelas
                                </p>
                              </div>
                            )}
                            
                            {/* Quota Warning */}
                            {classData.remaining_quota <= 3 && classData.remaining_quota > 0 && !classData.membershipStatus && (
                              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                                <FiAlertCircle className="text-yellow-600 text-sm" />
                                <p className="text-yellow-700 text-sm">
                                  Peringatan: Hanya tersisa {classData.remaining_quota} slot!
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleJoinRequest(classData)}
                            disabled={buttonState.disabled}
                            className={`font-semibold px-6 py-3 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg ${buttonState.className}`}
                          >
                            <IconComponent className="text-lg" />
                            <span>{buttonState.text}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isLoading && searchPerformed && searchResults.length === 0 && !error && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
                <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiX className="text-gray-500 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Kelas Tidak Ditemukan</h3>
                <p className="text-gray-600 mb-4">
                  Tidak ada kelas yang cocok dengan pencarian "{searchTerm}"
                </p>
                <p className="text-sm text-gray-500 mb-6">
                  Pastikan nama kelas atau prodi sudah benar atau coba kata kunci lain
                </p>
                <button
                  onClick={resetSearch}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Search Tips */}
            {!isLoading && !searchPerformed && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips Pencarian:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Format nama kelas:</h4>
                    <ul className="space-y-1">
                      <li>• R.1.A, R.1.B, R.1.C</li>
                      <li>• R.2.H, R.2.I, R.2.J</li>
                      <li>• R.3.X, R.3.Y, R.3.Z</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Contoh pencarian:</h4>
                    <ul className="space-y-1">
                      <li>• "R.1" untuk kelas tingkat 1</li>
                      <li>• "Teknik Informatika" untuk prodi</li>
                      <li>• "Matematika" untuk mata pelajaran</li>
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Info:</strong> Setiap kelas memiliki batas maksimal anggota. 
                    Pastikan masih tersedia slot sebelum mengirim permintaan bergabung.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col justify-center px-4 py-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Mobile Header */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              <FiSearch className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Cari Kelas</h1>
            <p className="text-gray-600 text-sm">
              Temukan kelas yang sesuai dengan kebutuhan Anda
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <FiX className="text-red-500 text-sm" />
                <p className="text-red-700 font-medium text-xs">Error</p>
              </div>
              <p className="text-red-600 text-xs mt-1">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-xs font-medium mt-2 hover:text-red-800"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Mobile Search Form */}
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="space-y-4">
                {/* Search Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Cari Kelas
                  </label>
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Nama kelas atau prodi"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all duration-200 text-gray-900 text-sm"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || !searchTerm.trim()}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <FiLoader className="text-lg animate-spin" />
                        <span className="text-sm">Mencari...</span>
                      </>
                    ) : (
                      <>
                        <FiSearch />
                        <span className="text-sm">Cari</span>
                      </>
                    )}
                  </button>
                  
                  {searchTerm && (
                    <button
                      onClick={resetSearch}
                      className="text-gray-500 hover:text-gray-700 px-3 py-3 rounded-xl transition-all duration-200"
                    >
                      <FiX className="text-lg" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Search Results */}
            {!isLoading && searchResults.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    Hasil ({searchResults.length})
                  </h2>
                  <button
                    onClick={resetSearch}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    Reset
                  </button>
                </div>
                
                <div className="max-h-80 overflow-y-auto space-y-3">
                  {searchResults.map((classData) => {
                    const buttonState = getJoinButtonState(classData);
                    const IconComponent = buttonState.icon;
                    
                    return (
                      <div key={classData.id} className="bg-white rounded-lg shadow-lg border border-gray-100 p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                            <FiUsers className="text-green-600 text-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm">{classData.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <FiBook className="text-blue-500" />
                              <span className="text-blue-600 font-medium">{classData.prodi}</span>
                            </div>
                            <p className="text-gray-600 text-xs mt-2 line-clamp-2">{classData.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                              <div className="flex items-center gap-1">
                                <FiUsers className="text-green-500" />
                                <span>{classData.current_members}/{classData.member_limit}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${classData.remaining_quota > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={classData.remaining_quota > 0 ? 'text-green-600' : 'text-red-600'}>
                                  {classData.remaining_quota > 0 
                                    ? `${classData.remaining_quota} slot` 
                                    : 'Penuh'
                                  }
                                </span>
                              </div>
                            </div>
                            
                            {/* Status Indicators Mobile */}
                            {classData.membershipStatus === 'pending' && (
                              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
                                <FiClock className="text-yellow-600 text-xs" />
                                <p className="text-yellow-700 text-xs">Menunggu persetujuan</p>
                              </div>
                            )}
                            
                            {classData.membershipStatus === 'approved' && (
                              <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center gap-2">
                                <FiCheck className="text-green-600 text-xs" />
                                <p className="text-green-700 text-xs">Sudah bergabung</p>
                              </div>
                            )}
                            
                            {classData.membershipStatus === 'rejected' && (
                              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-2">
                                <FiX className="text-red-600 text-xs" />
                                <p className="text-red-700 text-xs">Ditolak</p>
                              </div>
                            )}
                            
                            {classData.remaining_quota <= 3 && classData.remaining_quota > 0 && !classData.membershipStatus && (
                              <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2 flex items-center gap-2">
                                <FiAlertCircle className="text-yellow-600 text-xs" />
                                <p className="text-yellow-700 text-xs">Sisa {classData.remaining_quota} slot!</p>
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleJoinRequest(classData)}
                            disabled={buttonState.disabled}
                            className={`font-semibold px-3 py-2 rounded-lg transition-all duration-300 flex items-center gap-1 shadow-md text-xs flex-shrink-0 ${buttonState.className}`}
                          >
                            <IconComponent className="text-sm" />
                            <span className="hidden sm:inline">{buttonState.text}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mobile No Results */}
            {!isLoading && searchPerformed && searchResults.length === 0 && !error && (
              <div className="mt-6 bg-white rounded-lg shadow-lg border border-gray-100 p-6 text-center">
                <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FiX className="text-gray-500 text-lg" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak Ditemukan</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Tidak ada kelas "{searchTerm}"
                </p>
                <button
                  onClick={resetSearch}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300 text-sm"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Mobile Search Tips */}
            {!isLoading && !searchPerformed && (
              <div className="mt-6 bg-white rounded-lg shadow-lg border border-gray-100 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Tips Pencarian:</h3>
                <div className="space-y-3 text-xs text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Format kelas:</h4>
                    <p>R.1.A, R.1.B, R.2.H, R.3.X</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-1">Contoh:</h4>
                    <p>"R.1" atau "Teknik Informatika"</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-800">
                    <strong>Info:</strong> Pastikan slot masih tersedia sebelum bergabung.
                  </p>
                </div>
              </div>
            )}

            {/* Loading State Mobile */}
            {isLoading && (
              <div className="mt-6 flex flex-col items-center justify-center py-8">
                <FiLoader className="text-3xl text-green-500 mb-3 animate-spin" />
                <p className="text-gray-600 text-sm">Mencari kelas...</p>
              </div>
            )}

            {/* Mobile Footer */}
            <div className="text-center mt-6 space-y-2">
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

export default JoinClass;