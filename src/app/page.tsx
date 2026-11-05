'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { formatArabicDate, formatCurrency, getGreetingByTime } from '@/lib/date-utils';
import { triggerLoveNotification } from '@/lib/love-notifications';
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
  ArrowUpRight,
  Trash2
} from 'lucide-react';

const DEFAULT_DASHBOARD_DATA = {
  householdName: 'بيتنا - فادي ورحمة ❤️',
  monthlyBudget: 16000,
  totalSpent: 0,
  remainingBudget: 16000,
  mealPlans: [],
  pendingShopping: [],
  prayerRecord: {
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  },
  tasks: [],
  totalPoints: 0,
  totalWaterToday: 0,
  todayWorkout: null,
  advice: {
    speaker: 'زوزو',
    avatar: '🌸',
    quote: 'صباح الفل والياسمين! يومكم جميل وسعيد ومبارك في بيتنا الدافئ يا فادي ويا رحمة ❤️',
  },
};

export default function HomeDashboard() {
  const { currentUser, openQuickAction } = useUser();
  const [data, setData] = useState<any>(DEFAULT_DASHBOARD_DATA);
  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  const todayDateStr = new Date().toISOString().split('T')[0];
  const prayerCacheKey = `baytna_prayers_${currentUser.id}_${todayDateStr}`;

  const fetchDashboard = async () => {
    // Immediate local cache check for prayers
    if (typeof window !== 'undefined') {
      try {
        const cachedPrayers = localStorage.getItem(prayerCacheKey);
        if (cachedPrayers) {
          const parsed = JSON.parse(cachedPrayers);
          setData((prev: any) => ({
            ...prev,
            prayerRecord: { ...prev.prayerRecord, ...parsed },
          }));
        }
      } catch {}
    }

    try {
      const res = await fetch(`/api/home?userId=${currentUser.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        let mergedPrayers = json.data.prayerRecord;
        if (typeof window !== 'undefined') {
          const cachedPrayers = localStorage.getItem(prayerCacheKey);
          if (cachedPrayers) {
            const parsed = JSON.parse(cachedPrayers);
            mergedPrayers = {
              ...mergedPrayers,
              fajr: mergedPrayers.fajr || parsed.fajr,
              dhuhr: mergedPrayers.dhuhr || parsed.dhuhr,
              asr: mergedPrayers.asr || parsed.asr,
              maghrib: mergedPrayers.maghrib || parsed.maghrib,
              isha: mergedPrayers.isha || parsed.isha,
            };
          }
        }
        setData({
          ...json.data,
          prayerRecord: mergedPrayers,
        });
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
      const newVal = !currentVal;
      // Optimistic update
      setData((prev: any) => {
        const updatedPrayers = {
          ...prev.prayerRecord,
          [field]: newVal,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(prayerCacheKey, JSON.stringify(updatedPrayers));
        }
        return {
          ...prev,
          prayerRecord: updatedPrayers,
          totalPoints: newVal ? prev.totalPoints + 10 : prev.totalPoints,
        };
      });

      // Send love notification to partner when a prayer is completed
      if (newVal) {
        const prayerNames: Record<string, string> = {
          fajr: 'صلاة الفجر',
          dhuhr: 'صلاة الظهر',
          asr: 'صلاة العصر',
          maghrib: 'صلاة المغرب',
          isha: 'صلاة العشاء',
        };
        const isFady = currentUser.id === 'fady';
        triggerLoveNotification({
          type: 'PRAYER_COMPLETED',
          fromUserId: isFady ? 'fady' : 'rahma',
          toUserId: isFady ? 'rahma' : 'fady',
          title: isFady ? 'دعوة حلوة ليكي من فادي 🤲❤️' : 'دعوة من قلب رحمة لـ فادي 🤲✨',
          body: isFady
            ? `فادي صلى ${prayerNames[field] || 'الصلاة'} ودعالكم ربنا يديم حبكم وبركة بيتكم يا ست الكل 🌸`
            : `رحمة صلت ${prayerNames[field] || 'الصلاة'} ودعتلك ربنا يفتحها في وشك ويحفظك ليها يا سندي يا غالي 💕`,
          emoji: '🤲',
        });
      }

      await fetch('/api/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          field,
          value: newVal,
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

  // Add task directly from dashboard
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_task',
          title: newTaskTitle.trim(),
          pointsReward: 15,
          assignedToUserId: currentUser.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewTaskTitle('');
        setIsAddingTask(false);
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete task directly from dashboard
  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل تريد حذف هذه المهمة؟')) return;
    try {
      setData((prev: any) => ({
        ...prev,
        tasks: prev.tasks.filter((t: any) => t.id !== taskId),
      }));
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_task',
          taskId,
        }),
      });
    } catch (err) {
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
          <button
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="text-xs text-brand-600 font-bold hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة مهمة
          </button>
        </div>

        {isAddingTask && (
          <form onSubmit={handleAddTask} className="flex gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
            <input
              type="text"
              placeholder="اسم المهمة الجديدة (مثال: ترتيب المطبخ)..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 active:scale-95 transition-all"
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="px-2 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
            >
              إلغاء
            </button>
          </form>
        )}

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
                <div className="flex items-center gap-2.5 min-w-0">
                  {task.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-neutral-300 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-neutral-800 truncate">{task.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                    +{task.pointsReward} نقطة
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTask(task.id, e)}
                    className="p-1 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="حذف المهمة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center">
              <p className="text-xs text-neutral-400">لا توجد مهام معلقة اليوم، البيت نظيف ومرتب! ✨</p>
              <button
                onClick={() => setIsAddingTask(true)}
                className="mt-1 text-[11px] font-bold text-brand-600 hover:underline"
              >
                + إضافة مهمة منزلية جديدة
              </button>
            </div>
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
