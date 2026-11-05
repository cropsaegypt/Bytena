'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { FileText, Heart, LogOut } from 'lucide-react';
import SendLoveModal from '@/components/Modals/SendLoveModal';

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, switchUser } = useUser();
  const [isLoveModalOpen, setIsLoveModalOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('baytna_logged_in');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full max-w-full glass-nav border-b border-rose-100/60 px-2.5 sm:px-4 py-2 transition-all">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        
        {/* Right side: Brand & Welcome */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-base sm:text-lg text-neutral-800 tracking-tight">بيتنا</span>
              <span className="text-[10px] bg-rose-100 text-brand-700 px-1.5 py-0.5 rounded-full font-bold">
                ❤️ <span className="hidden sm:inline">فادي ورحمة</span>
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-neutral-500 font-medium leading-none">مدير شؤون البيت والحياة</p>
          </div>
        </Link>

        {/* Center/Left side: User Switcher & Actions */}
        {!isLoginPage && (
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* User Switcher Pill */}
            <div className="bg-neutral-100 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl flex items-center gap-0.5 sm:gap-1 border border-neutral-200/60 shadow-inner">
              <button
                onClick={() => switchUser('fady')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  currentUser.id === 'fady'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span>👨🏻‍💻</span>
                <span>فادي</span>
              </button>
              <button
                onClick={() => switchUser('rahma')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                  currentUser.id === 'rahma'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <span>👩🏻‍🍳</span>
                <span>رحمة</span>
              </button>
            </div>

            {/* Love Pulse Button */}
            <button
              onClick={() => setIsLoveModalOpen(true)}
              title="إرسال نبضة حب فورية ❤️"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-brand-500 text-white flex items-center justify-center shadow-md shadow-rose-500/25 hover:scale-105 active:scale-95 transition-all border border-white/40 shrink-0"
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white animate-pulse" />
            </button>

            {/* Weekly Report Shortcut (Desktop/Tablet) */}
            <Link
              href="/reports"
              title="تقرير الأسبوع"
              className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 items-center justify-center border border-amber-200/60 transition-colors shrink-0"
            >
              <FileText className="w-4 h-4" />
            </Link>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="تسجيل الخروج وقفل التطبيق"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-neutral-100 hover:bg-rose-50 text-neutral-500 hover:text-rose-600 flex items-center justify-center border border-neutral-200/60 transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Love Pulse Modal */}
      <SendLoveModal
        isOpen={isLoveModalOpen}
        onClose={() => setIsLoveModalOpen(false)}
      />
    </header>
  );
}
