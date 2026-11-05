'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { 
  Home, 
  UtensilsCrossed, 
  WalletCards, 
  Activity, 
  Sparkles, 
  Plus,
  Moon
} from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { openQuickAction } = useUser();

  const isAssistantOrLogin = pathname === '/assistant' || pathname === '/login';

  const navItems = [
    { label: 'الرئيسية', href: '/', icon: Home },
    { label: 'مطبخنا', href: '/kitchen', icon: UtensilsCrossed },
    { 
      label: 'طلبات ومصاريف', 
      href: '/shopping', 
      icon: WalletCards, 
      matchHrefs: ['/shopping', '/finance'] 
    },
    { label: 'صحتنا', href: '/health', icon: Activity },
    { label: 'صلاتنا', href: '/prayers', icon: Moon },
    { label: 'زوزو 🌸', href: '/assistant', icon: Sparkles },
  ];

  if (pathname === '/login') return null;

  return (
    <>
      {/* Floating Action Button (FAB) - Hidden on Assistant page so it never covers the Send button */}
      {!isAssistantOrLogin && (
        <div className="fixed bottom-20 left-4 z-40 md:left-8">
          <button
            onClick={openQuickAction}
            className="w-12 h-12 p-3 rounded-full bg-gradient-to-r from-brand-600 to-rose-500 text-white shadow-xl shadow-brand-500/35 hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white"
            title="إجراء سريع"
            aria-label="إجراء سريع"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Main Bottom App Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 glass-nav border-t border-neutral-200/80 px-1 py-1 transition-all w-full max-w-full">
        <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl mx-auto flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.matchHrefs
              ? item.matchHrefs.includes(pathname)
              : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-brand-600 font-extrabold scale-105'
                    : 'text-neutral-400 hover:text-neutral-600 font-medium'
                }`}
              >
                <div className={`p-1 sm:p-1.5 rounded-xl transition-colors ${isActive ? 'bg-rose-50' : ''}`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                </div>
                <span className="text-[9px] sm:text-[10px] mt-0.5 tracking-tight font-bold truncate max-w-full text-center">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-brand-600 rounded-full absolute -bottom-0.5"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
