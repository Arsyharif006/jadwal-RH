// ==========================================
// components/Login.js - Enhanced Supabase Integrated Login
// ==========================================
import React, { useState } from 'react';
import { FiCalendar, FiShield, FiUsers, FiClock } from 'react-icons/fi';
import { signInWithGoogle, formatSupabaseError } from '../lib/supabase';

const Login = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error: authError } = await signInWithGoogle();

      if (authError) {
        setError(formatSupabaseError(authError));
        setIsLoading(false);
        return;
      }

      // Tidak redirect → tampilkan pesan sukses saja
      setSuccess(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      setError('Terjadi kesalahan saat login');
      setIsLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" className="mr-3">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 relative">
      {/* Desktop Layout */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left Side - Hero Section */}
        <div className="flex-1 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 flex flex-col justify-center items-center p-12 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 max-w-lg text-center">
            <div className="bg-white/20 backdrop-blur-sm w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <FiCalendar className="text-white text-4xl" />
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Kelola Jadwal Beta
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Pelajaran
              </span>
            </h1>
            
            <p className="text-xl text-green-100 mb-12 leading-relaxed">
              Platform modern untuk mengelola jadwal kelas dengan fitur realtime dan kolaborasi tim yang mudah
            </p>

            {/* Feature Highlights */}
            <div className="space-y-6">
              <div className="flex items-center text-left">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <FiClock className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Sinkronisasi Realtime</h3>
                  <p className="text-green-100 text-sm">Update otomatis di semua perangkat</p>
                </div>
              </div>
              
              <div className="flex items-center text-left">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <FiUsers className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Kolaborasi Tim</h3>
                  <p className="text-green-100 text-sm">Kelola jadwal bersama dengan mudah</p>
                </div>
              </div>
              
              <div className="flex items-center text-left">
                <div className="bg-white/20 p-3 rounded-xl mr-4">
                  <FiShield className="text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold">Data Aman</h3>
                  <p className="text-green-100 text-sm">Keamanan data terjamin</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Selamat Datang Kembali
              </h2>
              <p className="text-gray-600 text-lg">
                Masuk untuk mengakses dashboard Anda
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Google Login Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-3"></div>
                    <span>Sedang Masuk...</span>
                  </>
                ) : (
                  <>
                    <GoogleIcon />
                    <span className="text-base">Lanjutkan dengan Google</span>
                  </>
                )}
              </button>

              {isLoading && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Menghubungkan dengan Google...
                  </p>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-center text-sm text-gray-500">
                  Dengan masuk, Anda menyetujui{' '}
                  <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                    syarat dan ketentuan
                  </a>{' '}
                  kami
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col justify-between px-6 py-12">
        {/* Mobile Content */}
        <div className="flex flex-col items-center space-y-8 flex-grow justify-center">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <FiCalendar className="text-white text-3xl" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Jadwal Pelajaran
            </h1>
            
            <p className="text-gray-600 text-lg mb-8">
              Kelola jadwal pelajaran kelas Anda dengan mudah dan realtime
            </p>
          </div>

          {/* Login Section */}
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Selamat Datang
              </h2>
              <p className="text-gray-600">
                Masuk untuk mengakses jadwal pelajaran Anda
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Google Login Button - Clean Design */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-medium py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-3"></div>
                  <span>Sedang Masuk...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span className="text-base">Lanjutkan dengan Google</span>
                </>
              )}
            </button>

            {isLoading && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Menghubungkan dengan Google...
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500">
                Dengan masuk, Anda menyetujui{' '}
                <a href="#" className="text-green-600 hover:text-green-700 font-medium">
                  syarat dan ketentuan
                </a>{' '}
                kami
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Footer - Creator and Version Info */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-1">
              <span>Dibuat oleh</span>
              <span className="font-semibold text-green-600">arsyrf</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>Versi Beta</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">3.2.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;