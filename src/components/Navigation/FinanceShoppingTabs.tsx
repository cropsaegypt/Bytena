'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Wallet } from 'lucide-react';

export default function FinanceShoppingTabs() {
  const pathname = usePathname();
  const isShopping = pathname === '/shopping';
  const isFinance = pathname === '/finance';

  return (
    <div className="bg-neutral-100/90 p-1.5 rounded-2xl border border-neutral-200/70 mb-3 shadow-inner flex items-center justify-between gap-1.5">
      <Link
        href="/shopping"
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
          isShopping
            ? 'bg-white text-brand-600 shadow-md shadow-brand-900/5 scale-[1.01]'
            : 'text-neutral-500 hover:text-neutral-800 font-bold'
        }`}
      >
        <ShoppingCart className={`w-4 h-4 ${isShopping ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span>طلبات البيت 🛒</span>
      </Link>

      <Link
        href="/finance"
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-black transition-all ${
          isFinance
            ? 'bg-white text-brand-600 shadow-md shadow-brand-900/5 scale-[1.01]'
            : 'text-neutral-500 hover:text-neutral-800 font-bold'
        }`}
      >
        <Wallet className={`w-4 h-4 ${isFinance ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
        <span>الميزانية والمصاريف 💰</span>
      </Link>
    </div>
  );
}
