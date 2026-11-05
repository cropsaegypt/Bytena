'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Heart, Lock, Eye, EyeOff, KeyRound, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { switchUser } = useUser();
  const [selectedUser, setSelectedUser] = useState<'fady' | 'rahma'>('fady');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flow steps: 'login' | 'change_password' | 'welcome'
  const [step, setStep] = useState<'login' | 'change_password' | 'welcome'>('login');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);

  const partnerName = selectedUser === 'fady' ? 'فادي' : 'رحمة';
  const partnerOther = selectedUser === 'fady' ? 'رحمة' : 'فادي';
  const partnerAvatar = selectedUser === 'fady' ? '👨🏻‍💻' : '👩🏻‍🍳';

  // 1. Handle Login
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

        // If entered with default password (dalida or initial) -> prompt to change password first!
        if (data.isDefaultPassword) {
          setStep('change_password');
        } else {
          // If already has private custom password -> go straight to warm welcome screen!
          setStep('welcome');
        }
      } else {
        setError(data.message || 'كلمة المرور غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف أو أرقام على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }

    setChangeLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStep('welcome');
      } else {
        setError(data.message || 'فشل تحديث كلمة المرور');
      }
    } catch {
      setError('حدث خطأ أثناء حفظ كلمة المرور');
    } finally {
      setChangeLoading(false);
    }
  };

  // 3. Final Enter Home
  const handleEnterHome = () => {
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 animate-fadeIn">
      <div className="w-full max-w-sm bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/10 space-y-6 text-center relative overflow-hidden">
        
        {/* Background ambient decorative glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-200/40 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl pointer-events-none"></div>

        {/* STEP 1: LOGIN FORM */}
        {step === 'login' && (
          <>
            {/* Brand Icon */}
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-brand-600 via-rose-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/25 animate-bounce">
              <Heart className="w-8 h-8 fill-white text-white" />
            </div>

            <div>
              <h1 className="text-2xl font-black text-neutral-800 tracking-tight">بيتنا ❤️</h1>
              <p className="text-xs text-neutral-500 mt-1 font-medium leading-relaxed">
                النظام العائلي المتكامل لفادي ورحمة
              </p>
              <span className="inline-block mt-2 text-[10px] bg-rose-50 text-brand-700 font-bold px-3 py-1 rounded-full border border-rose-100">
                🔒 محمي بكلمة مرور خاصة لحفظ خصوصيتكما
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
                  كلمة مرور حساب {partnerName}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="أدخل كلمة المرور..."
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

            <div className="pt-2 border-t border-neutral-100 text-[11px] text-neutral-400 font-medium">
              <span>🏡 بوابة آمنة ومخصصة لـ فادي ورحمة فقط</span>
            </div>
          </>
        )}

        {/* STEP 2: CHANGE PASSWORD SCREEN (Immediately upon default password entry) */}
        {step === 'change_password' && (
          <div className="space-y-5 text-right animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-neutral-800">
                تعيين كلمة مرورك الخاصة 🔐
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                أهلاً بيك يا <strong className="text-neutral-800 font-bold">{partnerName} {partnerAvatar}</strong>! عشان نضمن أقصى خصوصية، حدد كلمة مرورك السرية والجديدة التي لا يعرفها سواكما.
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  كلمة المرور الجديدة:
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="اكتب كلمة مرور جديدة..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-3.5 text-neutral-400 hover:text-neutral-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  تأكيد كلمة المرور:
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="أعد كتابة كلمة المرور..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                />
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={changeLoading}
                className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-brand-600/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{changeLoading ? 'جاري الحفظ...' : 'حفظ ومتابعة إلى بيتنا ✨'}</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: WARM & CHILL EGYPTIAN WELCOME SCREEN */}
        {step === 'welcome' && (
          <div className="py-6 space-y-6 text-center animate-in zoom-in-95 duration-500">
            {/* Romantic Partner Avatar Badge */}
            <div className="relative inline-block">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-rose-500 via-brand-500 to-amber-400 p-1 shadow-2xl shadow-brand-500/30">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl">
                  {partnerAvatar}
                </div>
              </div>
              <span className="absolute bottom-0 right-1 text-2xl animate-bounce">
                ❤️
              </span>
            </div>

            {/* Custom Warm Egyptian Greeting */}
            <div className="space-y-2.5">
              {selectedUser === 'fady' ? (
                <>
                  <div className="flex items-center justify-center gap-1 text-amber-600 text-xs font-extrabold">
                    <Sparkles className="w-4 h-4" />
                    <span>يا باشا مصر</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-black text-neutral-800 leading-tight">
                    نورت بيتك يا فادي يا غالي 👑❤️
                  </h2>
                  <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-xs mx-auto">
                    يا رب أيامك كلها خير وسعادة ورضا وراحة بال مع ست الكل <strong className="text-brand-600 font-bold">رحمة</strong>.. بيتنا منور بوجودك دايماً وسندنا وتاج راسنا يا بطل ✨
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-1 text-pink-600 text-xs font-extrabold">
                    <Sparkles className="w-4 h-4" />
                    <span>يا قمر بيتنا</span>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-black text-neutral-800 leading-tight">
                    يا أهلاً بست البنات رحمة 🌸✨
                  </h2>
                  <p className="text-xs text-neutral-600 font-medium leading-relaxed max-w-xs mx-auto">
                    نورتي بيتك يا ست الكل.. ربنا يديم الضحكة والبركة والدفا في حياتك مع حبيبك وسندك <strong className="text-brand-600 font-bold">فادي</strong>.. إيدك الحلوة هي سر جمال بيتنا ❤️
                  </p>
                </>
              )}
            </div>

            {/* Quote Card */}
            <div className="bg-rose-50/70 border border-rose-100 p-3 rounded-2xl text-[11px] text-brand-800 font-bold">
              <span>🏡 "بيتنا عامر دايماً بالحب والمودة والرحمة والخير"</span>
            </div>

            {/* Action Button */}
            <button
              onClick={handleEnterHome}
              className="w-full py-4 bg-gradient-to-r from-brand-600 via-rose-500 to-pink-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-brand-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              <span>دخول إلى بيتنا السعيد 🏡❤️</span>
              <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
