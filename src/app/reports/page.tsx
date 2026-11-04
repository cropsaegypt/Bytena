'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { formatCurrency } from '@/lib/date-utils';
import { 
  FileText, 
  Sparkles, 
  Wallet, 
  Dumbbell, 
  UtensilsCrossed, 
  CheckCircle2, 
  Award, 
  ArrowRight,
  Heart
} from 'lucide-react';

export default function ReportsPage() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.report);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-neutral-500 font-bold">
        جاري تلخيص إنجازات أسبوعنا الجميل... 📊
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-neutral-800">أسبوعنا كان عامل إيه؟ ❤️</h1>
            <p className="text-[11px] text-neutral-500">التقرير العائلي الأسبوعي لبيت فادي ورحمة</p>
          </div>
        </div>

        <span className="text-[10px] bg-rose-100 text-brand-700 font-bold px-2.5 py-1 rounded-full">
          {data.period}
        </span>
      </div>

      {/* Om Mahmoud Verdict Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👵🏼</span>
          <h2 className="text-xs font-black text-amber-900">رأي وتشجيع أم محمود</h2>
        </div>
        <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
          "{data.omMahmoudVerdict}"
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        
        {/* Total Spent */}
        <div className="p-4 bg-white border border-neutral-200/80 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-bold">مصروفات الأسبوع</span>
            <Wallet className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-lg font-black text-neutral-800">
            {formatCurrency(data.totalWeeklySpent)}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">ضمن حدود الميزانية المحددة 🎯</span>
        </div>

        {/* Completed Tasks */}
        <div className="p-4 bg-white border border-neutral-200/80 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-bold">مهام البيت المنجزة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-neutral-800">{data.completedTasks} مهام</p>
          <span className="text-[10px] text-neutral-500 font-medium">البيت رايق ونظيف ✨</span>
        </div>

        {/* Workouts Combined */}
        <div className="p-4 bg-white border border-neutral-200/80 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-bold">تمارين الرياضة</span>
            <Dumbbell className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg font-black text-neutral-800">
            {data.fadyWorkouts + data.rahmaWorkouts} تمارين
          </p>
          <span className="text-[10px] text-neutral-500 font-medium">
            فادي: {data.fadyWorkouts} • رحمة: {data.rahmaWorkouts}
          </span>
        </div>

        {/* Meals Cooked */}
        <div className="p-4 bg-white border border-neutral-200/80 rounded-3xl shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-bold">وجبات حضرناها</span>
            <UtensilsCrossed className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-black text-neutral-800">{data.mealsCount} وجبات</p>
          <span className="text-[10px] text-neutral-500 font-medium">أكل بيتي صحي ولذيذ 🍲</span>
        </div>

      </div>

      {/* Points & Achievements Leaderboard */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="text-xs font-black text-neutral-800">نقاط وتشجيع الأسبوع</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
            <span className="text-2xl">👨🏻‍💻</span>
            <p className="text-xs font-extrabold text-neutral-800 mt-1">فادي</p>
            <p className="text-base font-black text-brand-600 mt-0.5">+{data.fadyPoints} نقطة</p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 text-center">
            <span className="text-2xl">👩🏻‍🍳</span>
            <p className="text-xs font-extrabold text-neutral-800 mt-1">رحمة</p>
            <p className="text-base font-black text-brand-600 mt-0.5">+{data.rahmaPoints} نقطة</p>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500 text-center pt-1 leading-relaxed">
          كل نقطة بتعبر عن مجهود ومحبة وتفاهم في بناء بيت دافئ وسعيد ❤️
        </p>
      </div>

    </div>
  );
}
