'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { formatArabicDate, formatCurrency, getGreetingByTime } from '@/lib/date-utils';
import { 
  UtensilsCrossed, 
  ShoppingCart, 
  Wallet, 
  Moon, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ChevronLeft, 
  Plus, 
  Droplet, 
  Flame, 
  Award,
  Clock,
  ArrowUpRight
} from 'lucide-react';

const DEFAULT_DASHBOARD_DATA = {
  householdName: 'بيتنا - فادي ورحمة ❤️',
  monthlyBudget: 16000,
  totalSpent: 1270,
  remainingBudget: 14730,
  mealPlans: [
    {
      id: 'm1',
      mealType: 'BREAKFAST',
      recipe: { title: 'شوفان بالحليب والموز والعسل 🍳', calories: 380, proteinG: 18 },
      status: 'PREPARED',
      notes: 'فطار صحي وخفيف',
    },
    {
      id: 'm2',
      mealType: 'LUNCH',
      recipe: { title: 'مكرونة بالبشاميل بلدي أصلية 🍲', calories: 580, proteinG: 32 },
      status: 'PLANNED',
      notes: 'فادي طلبها ورحمة عملتها بكل حب ❤️',
    },
    {
      id: 'm3',
      mealType: 'DINNER',
      customName: 'سلطة جبنة قريش بزيت الزيتون والزعتر 🥗',
      status: 'PLANNED',
      notes: 'عشاء خفيف ومريح',
    },
  ],
  pendingShopping: [
    { id: 's1', name: 'لبن حليب طبيعي (المراعي / جهينة)', needBuyQty: 2, unit: 'لتر' },
    { id: 's2', name: 'لحم مفروم بلدي قليل الدهن', needBuyQty: 1, unit: 'كجم' },
    { id: 's3', name: 'مسحوق غسيل أوتوماتيك أريال', needBuyQty: 1, unit: 'عبوة' },
  ],
  prayerRecord: {
    fajr: true,
    dhuhr: true,
    asr: false,
    maghrib: false,
    isha: false,
  },
  tasks: [
    { id: 't1', title: 'مسح وترتيب الصالة وتلميع الطاولات', isCompleted: true, pointsReward: 15 },
    { id: 't2', title: 'شراء طلبات السوبرماركت وحمل النواقص', isCompleted: false, pointsReward: 25 },
    { id: 't3', title: 'تفريغ وتعبئة غسالة الأطباق', isCompleted: false, pointsReward: 15 },
  ],
  totalPoints: 120,
  totalWaterToday: 1500,
  todayWorkout: { title: 'تمرين بنش وترايسبس بالجيم 💪' },
  advice: {
    speaker: 'أم محمود',
    avatar: '👵🏼',
    quote: 'صباح الفل يا ست الكل! يومنا النهارده هادي، متشيليش هم المطبخ وفادي مبسوط جداً بالبشاميل ❤️',
  },
};

export default function HomeDashboard() {
  const { currentUser, openQuickAction } = useUser();
  const [data, setData] = useState<any>(DEFAULT_DASHBOARD_DATA);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`/api/home?userId=${currentUser.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.warn('Dashboard background update:', err);
    }
  };

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('baytna_logged_in');
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    fetchDashboard();
  }, [currentUser.id]);

  // Fast toggle prayer directly from dashboard
  const handleTogglePrayer = async (field: string, currentVal: boolean) => {
    try {
      // Optimistic update
      setData((prev: any) => ({
        ...prev,
        prayerRecord: {
          ...prev.prayerRecord,
          [field]: !currentVal,
        },
        totalPoints: !currentVal ? prev.totalPoints + 10 : prev.totalPoints,
      }));

      await fetch('/api/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          field,
          value: !currentVal,
        }),
      });
    } catch (e) {
      fetchDashboard();
    }
  };

  // Fast toggle task directly from dashboard
  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    try {
      setData((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) => t.id === taskId ? { ...t, isCompleted: !isCompleted } : t),
        totalPoints: !isCompleted ? prev.totalPoints + 15 : prev.totalPoints,
      }));

      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_task',
          taskId,
          isCompleted: !isCompleted,
          userId: currentUser.id,
        }),
      });
    } catch (e) {
      fetchDashboard();
    }
  };

  // Fast toggle shopping item
  const handleToggleShopping = async (itemId: string, isPurchased: boolean) => {
    try {
      setData((prev: any) => ({
        ...prev,
        pendingShopping: prev.pendingShopping.filter((s: any) => s.id !== itemId),
        totalPoints: !isPurchased ? prev.totalPoints + 10 : prev.totalPoints,
      }));

      await fetch('/api/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_purchase',
          id: itemId,
          isPurchased: !isPurchased,
          purchasedByUserId: currentUser.id,
        }),
      });
    } catch (e) {
      fetchDashboard();
    }
  };

  if (loading || !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-neutral-500 font-bold">جاري تحميل يوميات بيتنا الجميلة...</p>
      </div>
    );
  }

  const budgetPercent = Math.min(100, Math.round((data.totalSpent / data.monthlyBudget) * 100));

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      
      {/* 1. Header Greeting & Date */}
      <section className="bg-gradient-to-l from-rose-500 via-brand-600 to-rose-700 rounded-3xl p-5 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden">
        <div className="absolute -left-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none"></div>
        
        <div className="flex items-start justify-between gap-2 relative z-10">
          <div className="min-w-0">
            <span className="text-[11px] font-bold tracking-wider text-rose-100 bg-black/15 px-2.5 py-1 rounded-full backdrop-blur-sm">
              {formatArabicDate(new Date())}
            </span>
            <h1 className="text-lg sm:text-xl font-black mt-2 tracking-tight truncate">
              {getGreetingByTime(currentUser.displayName)}
            </h1>
            <p className="text-xs text-rose-100 mt-1 font-medium truncate">
              جاهزين ليوم جميل ومنظم في بيتنا؟ ❤️
            </p>
          </div>

          {/* Points Pill */}
          <Link
            href="/prayers"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-2xl border border-white/20 text-xs font-bold transition-transform active:scale-95 shrink-0"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>{data.totalPoints} نقطة</span>
          </Link>
        </div>

        {/* Smart Advice Banner from Om Mahmoud / Coach */}
        {data.advice && (
          <div className="mt-4 p-3 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-start gap-2.5">
            <span className="text-2xl">{data.advice.avatar}</span>
            <div className="flex-1">
              <span className="text-[10px] font-extrabold uppercase text-amber-200 tracking-wider">
                رسالة {data.advice.speaker}
              </span>
              <p className="text-xs leading-relaxed text-white font-medium mt-0.5">
                "{data.advice.quote}"
              </p>
            </div>
          </div>
        )}
      </section>

      {/* 2. Today's Meals Carousel */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-brand-600" />
            <h2 className="text-sm font-extrabold text-neutral-800">وجبات اليوم في المطبخ</h2>
          </div>
          <Link href="/kitchen" className="text-xs text-brand-600 font-bold flex items-center hover:underline">
            جدول الأسبوع <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {['BREAKFAST', 'LUNCH', 'DINNER'].map((type) => {
            const plan = data.mealPlans?.find((m: any) => m.mealType === type);
            const label = type === 'BREAKFAST' ? 'الإفطار 🍳' : type === 'LUNCH' ? 'الغداء 🍲' : 'العشاء 🥗';
            
            return (
              <div
                key={type}
                className="bg-neutral-50/80 border border-neutral-200/70 rounded-2xl p-3 hover:border-brand-200 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-neutral-500">{label}</span>
                  {plan && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                      جاهزة للتجهيز
                    </span>
                  )}
                </div>

                {plan ? (
                  <div>
                    <h3 className="font-extrabold text-sm text-neutral-800 leading-snug">
                      {plan.recipe?.title || plan.customName}
                    </h3>
                    {plan.notes && (
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                        {plan.notes}
                      </p>
                    )}
                    {plan.recipe && (
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500 font-medium">
                        <span>🔥 {plan.recipe.calories} كالوري</span>
                        <span>🥩 {plan.recipe.proteinG} جم بروتين</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2 text-center">
                    <p className="text-xs text-neutral-400">لم تُحدد وجبة بعد</p>
                    <Link
                      href="/kitchen"
                      className="inline-block mt-1 text-[11px] font-bold text-brand-600 hover:underline"
                    >
                      + اختيار وجبة
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Budget & Shopping Mini-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* Budget Widget */}
        <section className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-extrabold text-neutral-800">ميزانية الشهر</h3>
            </div>
            <Link href="/finance" className="text-xs text-brand-600 font-bold hover:underline">
              التفاصيل
            </Link>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[11px] text-neutral-400 font-medium">المتبقي بأمان</p>
              <p className="text-xl font-black text-emerald-600 tracking-tight">
                {formatCurrency(data.remainingBudget)}
              </p>
            </div>
            <div className="text-left">
              <p className="text-[11px] text-neutral-400 font-medium">المصروف الفعلي</p>
              <p className="text-sm font-bold text-neutral-700">
                {formatCurrency(data.totalSpent)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="w-full h-2.5 bg-neutral-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPercent > 80 ? 'bg-rose-500' : 'bg-brand-500'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
              <span>تم استهلاك {budgetPercent}% من الميزانية</span>
              <span>الهدف: {formatCurrency(data.monthlyBudget)}</span>
            </div>
          </div>
        </section>

        {/* Shopping Widget */}
        <section className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-extrabold text-neutral-800">نواقص البيت الحرجة</h3>
            </div>
            <Link href="/shopping" className="text-xs text-emerald-700 font-bold hover:underline">
              القائمة كاملة
            </Link>
          </div>

          <div className="space-y-2">
            {data.pendingShopping && data.pendingShopping.length > 0 ? (
              data.pendingShopping.slice(0, 3).map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleShopping(item.id, false)}
                  className="flex items-center justify-between p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-all border border-neutral-100"
                >
                  <div className="flex items-center gap-2">
                    <Circle className="w-4 h-4 text-neutral-400 hover:text-emerald-500" />
                    <span className="text-xs font-bold text-neutral-800">{item.name}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-medium bg-white px-2 py-0.5 rounded-lg border border-neutral-200/60">
                    {item.needBuyQty} {item.unit}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 py-3 text-center">
                مفيش أي نواقص مسجلة حالياً، البيت عامر ومكتمل! ✨
              </p>
            )}
          </div>
        </section>

      </div>

      {/* 4. Prayers & Dhikr Checklist */}
      <section className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-neutral-800">صلواتنا وأذكارنا اليوم ({currentUser.displayName})</h3>
          </div>
          <Link href="/prayers" className="text-xs text-indigo-600 font-bold hover:underline">
            السجل
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { key: 'fajr', label: 'الفجر' },
            { key: 'dhuhr', label: 'الظهر' },
            { key: 'asr', label: 'العصر' },
            { key: 'maghrib', label: 'المغرب' },
            { key: 'isha', label: 'العشاء' },
          ].map(({ key, label }) => {
            const isDone = data.prayerRecord?.[key];
            return (
              <button
                key={key}
                onClick={() => handleTogglePrayer(key, !!isDone)}
                className={`py-2 px-1 rounded-2xl border transition-all flex flex-col items-center gap-1 active:scale-95 ${
                  isDone
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold'
                    : 'bg-neutral-50/70 border-neutral-200 text-neutral-500 font-medium hover:border-neutral-300'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Circle className="w-4 h-4 text-neutral-300" />
                )}
                <span className="text-[11px]">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Today's Household Chores */}
      <section className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-extrabold text-neutral-800">مهام ونظافة البيت</h3>
          </div>
          <span className="text-xs text-neutral-400">إنجاز المهام = مكافآت ونقاط 🎁</span>
        </div>

        <div className="space-y-2">
          {data.tasks && data.tasks.length > 0 ? (
            data.tasks.map((task: any) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id, task.isCompleted)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                  task.isCompleted
                    ? 'bg-neutral-50/50 border-neutral-200 text-neutral-400 line-through'
                    : 'bg-white border-neutral-200/80 hover:border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {task.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-300 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-neutral-800">{task.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    +{task.pointsReward} نقطة
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-400 py-2 text-center">لا توجد مهام معلقة اليوم</p>
          )}
        </div>
      </section>

      {/* 6. Health & Workout Quick Card */}
      <section className="bg-neutral-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">💪</span>
            <div>
              <h3 className="text-sm font-extrabold">صحتك ولياقتك اليوم</h3>
              <p className="text-[11px] text-neutral-400">خاص بـ {currentUser.displayName}</p>
            </div>
          </div>
          <Link
            href="/health"
            className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-xl text-neutral-200 font-bold transition-colors"
          >
            الملف الصحي الكامل 🔒
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400">شرب المياه اليوم</p>
              <p className="text-base font-extrabold text-white">
                {data.totalWaterToday || 0} <span className="text-xs font-normal">مل</span>
              </p>
            </div>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-400">تمرين اليوم</p>
              <p className="text-xs font-extrabold text-white truncate max-w-[110px]">
                {data.todayWorkout ? data.todayWorkout.title : 'لم يُسجل بعد'}
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
