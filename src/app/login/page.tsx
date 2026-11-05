'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Heart, Lock, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { switchUser } = useUser();
  const [selectedUser, setSelectedUser] = useState<'fady' | 'rahma'>('fady');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUser,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        switchUser(selectedUser);
        localStorage.setItem('baytna_logged_in', 'true');
        localStorage.setItem('baytna_active_user', selectedUser);
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 animate-fadeIn">
      <div className="w-full max-w-sm bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/10 space-y-6 text-center">
        
        {/* Brand Icon */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 animate-bounce">
          <Heart className="w-8 h-8 fill-white text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-neutral-800 tracking-tight">بيتنا ❤️</h1>
          <p className="text-xs text-neutral-500 mt-1 font-medium leading-relaxed">
            النظام العائلي الخاص بفادي ورحمة
          </p>
          <span className="inline-block mt-2 text-[10px] bg-rose-50 text-brand-700 font-bold px-3 py-1 rounded-full border border-rose-100">
            🔒 مغلق بكلمة مرور خاصة لحماية خصوصيتكما
          </span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-right">
          
          {/* User Selector */}
          <div>
            <label className="block text-xs font-extrabold text-neutral-700 mb-2 text-center">
              مين اللي هيسجل الدخول؟
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-2xl border border-neutral-200/80">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser('fady');
                  setPassword('');
                  setError(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  selectedUser === 'fady'
                    ? 'bg-white text-brand-600 shadow-md scale-[1.02]'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className="text-base">👨🏻‍💻</span>
                <span>فادي</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedUser('rahma');
                  setPassword('');
                  setError(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                  selectedUser === 'rahma'
                    ? 'bg-white text-brand-600 shadow-md scale-[1.02]'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span className="text-base">👩🏻‍🍳</span>
                <span>رحمة</span>
              </button>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-extrabold text-neutral-700 mb-1">
              كلمة مرور حساب {selectedUser === 'fady' ? 'فادي' : 'رحمة'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="أدخل كلمة المرور الخاصة بك..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3.5 text-neutral-400 hover:text-neutral-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 text-center animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-rose-500 hover:from-brand-700 hover:to-rose-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-brand-500/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? 'جاري التحقق...' : 'دخول إلى بيتنا ❤️'}</span>
          </button>
        </form>

        <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-400 space-y-1">
          <p>كلمة المرور المبدئية لحساب فادي: <span className="font-mono font-bold text-neutral-700">fady2026</span></p>
          <p>كلمة المرور المبدئية لحساب رحمة: <span className="font-mono font-bold text-neutral-700">rahma2026</span></p>
          <p className="text-[10px] text-neutral-400">(يمكنكما تغييرها لأي كلمة سرية لا يعرفها سواكما من الإعدادات)</p>
        </div>

      </div>
    </div>
  );
}
