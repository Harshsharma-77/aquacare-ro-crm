'use client';

import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Droplets,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { loginAdmin } from '@/lib/auth';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  shopName?: string;
  tagline?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  shopName = 'Alakh Kirpa RO Service & CRM',
  tagline = 'Authorized Multi-Brand RO Service Management System'
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = loginAdmin(username, password, rememberMe);
      setIsLoading(false);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.message || 'Invalid username or password');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-teal-500/20 to-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Branding Banner */}
        <div className="p-8 pb-6 text-center bg-gradient-to-b from-teal-50/80 to-transparent">
          <div className="w-14 h-14 bg-gradient-to-tr from-teal-600 to-cyan-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-teal-500/25 mb-4 animate-pulse">
            <Droplets className="w-8 h-8" />
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {shopName}
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {tagline}
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/80 text-teal-800 text-[11px] font-bold uppercase tracking-wider mt-3">
            <Lock className="w-3 h-3 text-teal-700" />
            <span>Secure Admin Portal</span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Username (e.g. admin)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Secret Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
              />
              <span>Remember this device for 30 days</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Security Notice */}
        <div className="px-8 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          <span>Protected with Session Encryption • Unauthorized Access Prohibited</span>
        </div>
      </div>
    </div>
  );
};
