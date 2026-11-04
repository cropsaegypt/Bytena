'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { Bell, FileText, Heart, Sparkles } from 'lucide-react';

export default function TopBar() {
  const { currentUser, switchUser } = useUser();

  return (
    <header className="sticky top-0 z-40 w-full glass-nav border-b border-rose-100/60 px-4 py-2.5 transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Right side: Brand & Welcome */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-rose-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Heart className="w-5 h-5 fill-white text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-lg text-neutral-800 tracking-tight">بيتنا</span>
              <span className="text-[10px] bg-rose-100 text-brand-700 px-1.5 py-0.5 rounded-full font-bold">❤️ فادي ورحمة</span>
            </div>
            <p className="text-[11px] text-neutral-500 font-medium leading-none">مدير شؤون البيت والحياة</p>
          </div>
        </Link>

        {/* Center/Left side: User Switcher & Actions */}
        <div className="flex items-center gap-2">
          {/* User Switcher Pill */}
          <div className="bg-neutral-100 p-1 rounded-2xl flex items-center gap-1 border border-neutral-200/60 shadow-inner">
            <button
              onClick={() => switchUser('fady')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentUser.id === 'fady'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <span className="text-sm">👨🏻‍💻</span>
              <span>فادي</span>
            </button>
            <button
              onClick={() => switchUser('rahma')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                currentUser.id === 'rahma'
                  ? 'bg-white text-brand-600 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <span className="text-sm">👩🏻‍🍳</span>
              <span>رحمة</span>
            </button>
          </div>

          {/* Weekly Report Shortcut */}
          <Link
            href="/reports"
            title="تقرير الأسبوع"
            className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center border border-amber-200/60 transition-colors"
          >
            <FileText className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </header>
  );
}
