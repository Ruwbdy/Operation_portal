import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TowerControl as Tower, Lock, User, Eye, EyeOff } from 'lucide-react';
import Toast from '../components/common/Toast';
import { AUTH_CREDENTIALS } from '../services/api_definitions';

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
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check credentials
      if (username === AUTH_CREDENTIALS.username && password === AUTH_CREDENTIALS.password) {
        // Store auth token/flag in localStorage
        localStorage.setItem('mtn_in_auth', 'true');
        localStorage.setItem('mtn_in_user', username);
        
        // Navigate to dashboard
        navigate('/');
      } else {
        setErrorToast('Invalid username or password');
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
          {/* Logo & Title */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="bg-[#FFCC00] p-3 rounded-2xl shadow-lg">
                <Tower className="w-10 h-10 text-black" />
              </div>
              <span className="text-3xl font-black text-black tracking-tighter uppercase italic">
                MTN IN
              </span>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
              Command Hub Portal
            </p>
            <div className="mt-6 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">
                System Online
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter username"
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] focus:bg-white transition-all placeholder:text-gray-300"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter password"
                  className="w-full pl-14 pr-14 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-black font-bold text-sm focus:outline-none focus:border-[#FFCC00] focus:bg-white transition-all placeholder:text-gray-300"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 px-8 py-5 bg-black text-[#FFCC00] rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl border-2 border-transparent hover:border-[#FFCC00]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-[#FFCC00] border-t-transparent rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </span>
              ) : (
                'Access Portal'
              )}
            </button>
          </form>

          {/* Credentials Hint (Development Only) */}
          <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-100 rounded-xl">
            <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider mb-2">
              Development Credentials
            </p>
            <div className="space-y-1 text-[10px] font-bold text-blue-700">
              <p>Username: <span className="text-blue-900">XXX</span></p>
              <p>Password: <span className="text-blue-900">XXX</span></p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">
              Secure Access Portal v5.4
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">
            Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}