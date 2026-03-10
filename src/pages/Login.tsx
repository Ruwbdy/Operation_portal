import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TowerControl as Tower, Lock, User, Eye, EyeOff } from 'lucide-react';
import Toast from '../components/common/Toast';
import { login } from '../services/auth_service';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      setErrorToast('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        navigate('/');
      } else {
        setErrorToast(result.error || 'Invalid username or password');
      }
    } catch (error) {
      setErrorToast('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin(e as any);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-6 selection:bg-[#FFCC00] selection:text-black font-sans">
      {/* Toast Notifications */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center space-y-4 pointer-events-none">
        {errorToast && (
          <Toast type="error" message={errorToast} onClose={() => setErrorToast(null)} />
        )}
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFCC00]/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FFCC00]/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 border-4 border-[#FFCC00] animate-in fade-in zoom-in duration-500">

          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mb-4 shadow-lg">
              <Tower size={40} className="text-[#FFCC00]" />
            </div>
            <h1 className="text-2xl font-black text-black tracking-tight">MTN IN Portal</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Intelligent Network Operations</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <User size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Username"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FFCC00] focus:bg-white transition-all duration-200"
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-gray-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#FFCC00] focus:bg-white transition-all duration-200"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-[#FFCC00] hover:bg-yellow-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-black font-black text-sm rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-[0.98] mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8 font-medium">
            MTN Nigeria · Intelligent Network Support
          </p>
        </div>
      </div>
    </div>
  );
}