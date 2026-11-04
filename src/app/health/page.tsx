'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { formatArabicDate } from '@/lib/date-utils';
import PinKeypadModal from '@/components/Modals/PinKeypadModal';
import { 
  Activity, 
  Lock, 
  Unlock, 
  Scale, 
  Dumbbell, 
  Droplet, 
  FileText, 
  Plus, 
  ShieldCheck, 
  Flame, 
  TrendingDown, 
  CheckCircle2, 
  Eye, 
  Share2,
  Sparkles,
  X
} from 'lucide-react';

export default function HealthPage() {
  const { currentUser, isHealthUnlocked, lockHealth } = useUser();
  const [isPinModalOpen, setIsPinModalOpen] = useState(!isHealthUnlocked);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Modals
  const [isLogWeightOpen, setIsLogWeightOpen] = useState(false);
  const [isLogWorkoutOpen, setIsLogWorkoutOpen] = useState(false);
  const [isAddMedicalOpen, setIsAddMedicalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [newWeight, setNewWeight] = useState('');
  const [weightNotes, setWeightNotes] = useState('');

  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutCategory, setWorkoutCategory] = useState(currentUser.id === 'fady' ? 'GYM' : 'HOME');
  const [workoutDuration, setWorkoutDuration] = useState('45');
  const [workoutNotes, setWorkoutNotes] = useState('');

  const [medicalTitle, setMedicalTitle] = useState('');
  const [medicalType, setMedicalType] = useState('BLOOD_TEST');
  const [medicalSummary, setMedicalSummary] = useState('');
  const [medicalShare, setMedicalShare] = useState(false);

  const fetchHealthData = async () => {
    try {
      const res = await fetch(`/api/health?userId=${currentUser.id}&requesterId=${currentUser.id}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHealthUnlocked) {
      fetchHealthData();
    }
  }, [currentUser.id, isHealthUnlocked]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Water Drink Action
  const handleDrinkWater = async (amount: number = 250) => {
    try {
      setData((prev: any) => ({
        ...prev,
        totalWaterToday: (prev.totalWaterToday || 0) + amount,
      }));

      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_water',
          userId: currentUser.id,
          amountMl: amount,
        }),
      });
      showNotification(`تم تسجيل ${amount} مل ماء بنجاح! 💧`);
    } catch (e) {
      fetchHealthData();
    }
  };

  // Log Weight
  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;

    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_weight',
          userId: currentUser.id,
          weightKg: newWeight,
          notes: weightNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('تم تسجيل الوزن الجديد بنجاح! ⚖️');
        setIsLogWeightOpen(false);
        setNewWeight('');
        fetchHealthData();
      }
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  // Log Workout
  const handleLogWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutTitle) return;

    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_workout',
          userId: currentUser.id,
          title: workoutTitle,
          category: workoutCategory,
          durationMins: workoutDuration,
          notes: workoutNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('عاش يا بطل! تم تسجيل التمرين وكسبت 20 نقطة 💪');
        setIsLogWorkoutOpen(false);
        setWorkoutTitle('');
        fetchHealthData();
      }
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  // Add Medical Record
  const handleAddMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicalTitle) return;

    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_medical_record',
          userId: currentUser.id,
          title: medicalTitle,
          testType: medicalType,
          testSummaryOrText: medicalSummary,
          isSharedWithPartner: medicalShare,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('تم حفظ التحليل الطبي في سجلك الخاص بأمان 🔒');
        setIsAddMedicalOpen(false);
        setMedicalTitle('');
        setMedicalSummary('');
        fetchHealthData();
      }
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  // Toggle Sharing with Partner
  const handleToggleSharing = async () => {
    if (!data?.profile) return;
    const currentShared = data.profile.isSharedWithPartner;

    try {
      const res = await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_share',
          userId: currentUser.id,
          isSharedWithPartner: !currentShared,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData((prev: any) => ({
          ...prev,
          profile: json.profile,
        }));
        showNotification(
          !currentShared
            ? 'تم تفعيل مشاركة الملف الصحي مع شريكك بنجاح 🤝'
            : 'تم إيقاف مشاركة الملف الصحي وجعله خاصاً بك تماماً 🔒'
        );
      }
    } catch (e) {
      alert('خطأ');
    }
  };

  // 1. If not unlocked, render secure locked screen
  if (!isHealthUnlocked) {
    return (
      <div className="py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-50 text-brand-600 flex items-center justify-center shadow-inner">
          <Lock className="w-10 h-10 stroke-[2.2]" />
        </div>
        <h2 className="text-xl font-black text-neutral-800">الملف الصحي والتحاليل الطبية</h2>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
          حفاظاً على خصوصية {currentUser.displayName}، الملف الصحي والوزن والتحاليل مشفرة ومحمية برمز الـ PIN الخاص بك.
        </p>

        <button
          onClick={() => setIsPinModalOpen(true)}
          className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
        >
          أدخل رمز الـ PIN لفتح الملف 🔓
        </button>

        <PinKeypadModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onSuccess={() => {
            setIsPinModalOpen(false);
            fetchHealthData();
          }}
        />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-neutral-500 font-bold">
        جاري فك تشفير الملف الصحي... 🩺
      </div>
    );
  }

  const { profile, weightLogs, workoutLogs, medicalRecords, totalWaterToday } = data;
  const waterTarget = profile?.dailyWaterTargetMl || 2500;
  const waterPercent = Math.min(100, Math.round((totalWaterToday / waterTarget) * 100));

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-neutral-800 flex items-center gap-2">
            <span>يلا ناكل صحي & لياقتنا</span>
            <Activity className="w-5 h-5 text-brand-600" />
          </h1>
          <p className="text-xs text-neutral-500">
            ملف {currentUser.displayName} الصحي الخاص 🔒
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Lock again button */}
          <button
            onClick={lockHealth}
            className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-colors"
            title="قفل الملف الصحي مجدداً"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center animate-slideDown">
          {notification}
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-gradient-to-l from-brand-600 to-rose-500 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-100 bg-black/15 px-2.5 py-0.5 rounded-full">
              {currentUser.id === 'fady' ? 'برنامج الجيم وبناء العضلات' : 'برنامج اللياقة المنزلية والتغذية'}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black">{profile.currentWeightKg}</span>
              <span className="text-sm font-bold text-rose-100">كجم</span>
            </div>
            <p className="text-[11px] text-rose-100 mt-1">
              الهدف: <span className="font-extrabold text-white">{profile.targetWeightKg} كجم</span> • الطول: <span className="font-extrabold text-white">{profile.heightCm} سم</span>
            </p>
          </div>

          {/* Privacy Sharing Toggle */}
          <button
            onClick={handleToggleSharing}
            className={`px-3 py-1.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              profile.isSharedWithPartner
                ? 'bg-emerald-500/80 text-white'
                : 'bg-white/20 text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{profile.isSharedWithPartner ? 'مشارك مع الشريك' : 'خاص تماماً'}</span>
          </button>
        </div>

        {/* Nutritional Targets Grid */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/20 text-center text-xs">
          <div>
            <span className="block text-[10px] text-rose-100">السعرات</span>
            <span className="font-extrabold text-white">{profile.dailyCalorieTarget}</span>
          </div>
          <div>
            <span className="block text-[10px] text-rose-100">البروتين</span>
            <span className="font-extrabold text-white">{profile.macrosProteinG}g</span>
          </div>
          <div>
            <span className="block text-[10px] text-rose-100">الكارب</span>
            <span className="font-extrabold text-white">{profile.macrosCarbsG}g</span>
          </div>
          <div>
            <span className="block text-[10px] text-rose-100">الدهون</span>
            <span className="font-extrabold text-white">{profile.macrosFatG}g</span>
          </div>
        </div>
      </div>

      {/* Water Tracker Widget */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Droplet className="w-4 h-4 text-cyan-500" />
            <h3 className="text-xs font-extrabold text-neutral-800">متابعة شرب المياه</h3>
          </div>
          <span className="text-xs font-extrabold text-cyan-600">
            {totalWaterToday} / {waterTarget} مل ({waterPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${waterPercent}%` }}
          />
        </div>

        {/* Quick Cups */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-neutral-400">سجل كوباً بلمسة واحدة:</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleDrinkWater(250)}
              className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              +250 مل 💧
            </button>
            <button
              onClick={() => handleDrinkWater(500)}
              className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              +500 مل 💧💧
            </button>
          </div>
        </div>
      </div>

      {/* Weight History & Logger */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-brand-600" />
            <h3 className="text-xs font-extrabold text-neutral-800">سجل تطور الوزن</h3>
          </div>
          <button
            onClick={() => setIsLogWeightOpen(true)}
            className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> تسجيل قياس جديد
          </button>
        </div>

        <div className="space-y-2">
          {weightLogs.slice(0, 4).map((log: any) => (
            <div
              key={log.id}
              className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-black text-neutral-800">{log.weightKg} كجم</span>
                {log.notes && <span className="text-[10px] text-neutral-500 mr-2">({log.notes})</span>}
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">
                {new Date(log.loggedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Workouts History */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Dumbbell className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-extrabold text-neutral-800">سجل التمارين الرياضية</h3>
          </div>
          <button
            onClick={() => setIsLogWorkoutOpen(true)}
            className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> تسجيل تمرين
          </button>
        </div>

        <div className="space-y-2">
          {workoutLogs.slice(0, 3).map((w: any) => (
            <div
              key={w.id}
              className="p-3 bg-neutral-50 border border-neutral-100 rounded-2xl flex items-center justify-between"
            >
              <div>
                <h4 className="font-extrabold text-xs text-neutral-800">{w.title}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                  <span>{w.durationMins} دقيقة</span>
                  <span>•</span>
                  <span>🔥 {w.burnedCalories} سعرة محروقة</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                +20 نقطة
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Medical Records Vault */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-extrabold text-neutral-800">التحاليل والتقارير الطبية 🔒</h3>
          </div>
          <button
            onClick={() => setIsAddMedicalOpen(true)}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة فحص
          </button>
        </div>

        <div className="space-y-2">
          {medicalRecords.length === 0 ? (
            <p className="text-xs text-neutral-400 py-2 text-center">لا توجد تقارير طبية مسجلة بعد</p>
          ) : (
            medicalRecords.map((rec: any) => (
              <div
                key={rec.id}
                className="p-3 bg-neutral-50 border border-neutral-100 rounded-2xl space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-neutral-800">{rec.title}</h4>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {new Date(rec.testDate).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                {rec.aiSummary && (
                  <p className="text-[11px] text-neutral-600 leading-relaxed bg-white p-2 rounded-xl border border-neutral-200/60">
                    💡 {rec.aiSummary}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: LOG WEIGHT */}
      {isLogWeightOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleLogWeight}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-neutral-800">تسجيل وزن جديد ⚖️</h3>
              <button
                type="button"
                onClick={() => setIsLogWeightOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">الوزن الحالي (كجم)</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="مثال: 85.5"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-lg font-black text-center text-brand-600 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">ملاحظات (اختياري)</label>
              <input
                type="text"
                placeholder="على الريق، بعد التمرين..."
                value={weightNotes}
                onChange={(e) => setWeightNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                حفظ القياس
              </button>
              <button
                type="button"
                onClick={() => setIsLogWeightOpen(false)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: LOG WORKOUT */}
      {isLogWorkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleLogWorkout}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-neutral-800">تسجيل تمرين رياضي 💪</h3>
              <button
                type="button"
                onClick={() => setIsLogWorkoutOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">اسم التمرين / العضلة</label>
              <input
                type="text"
                required
                placeholder="مثال: بنش وترايسبس، كارديو منزلي..."
                value={workoutTitle}
                onChange={(e) => setWorkoutTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">النوع</label>
                <select
                  value={workoutCategory}
                  onChange={(e) => setWorkoutCategory(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  <option value="GYM">جيم وأوزان 🏋🏻‍♂️</option>
                  <option value="HOME">تمارين منزلية 🧘🏻‍♀️</option>
                  <option value="CARDIO">كارديو وجري 🏃🏻</option>
                  <option value="WALKING">مشي 🚶🏻</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">المدة (دقيقة)</label>
                <input
                  type="number"
                  value={workoutDuration}
                  onChange={(e) => setWorkoutDuration(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-neutral-200 text-xs text-center font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                تسجيل التمرين (+20 نقطة) 🏆
              </button>
              <button
                type="button"
                onClick={() => setIsLogWorkoutOpen(false)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD MEDICAL RECORD */}
      {isAddMedicalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleAddMedical}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-neutral-800">إضافة فحص أو تحليل طبي 🩺</h3>
              <button
                type="button"
                onClick={() => setIsAddMedicalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">اسم الفحص أو التحليل</label>
              <input
                type="text"
                required
                placeholder="مثال: تحليل وظائف كبد وكلى، فحص فيتامين د..."
                value={medicalTitle}
                onChange={(e) => setMedicalTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">ملخص النتيجة أو الأرقام الرئيسية</label>
              <textarea
                rows={3}
                placeholder="مثال: الكوليسترول 170، السكر التراكمي 5.2، النسبة طبيعية..."
                value={medicalSummary}
                onChange={(e) => setMedicalSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-100">
              <input
                type="checkbox"
                id="shareMedical"
                checked={medicalShare}
                onChange={(e) => setMedicalShare(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <label htmlFor="shareMedical" className="text-xs font-bold text-neutral-700 cursor-pointer">
                السماح لشريكي برؤية هذا الفحص
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                حفظ في السجل الطبي
              </button>
              <button
                type="button"
                onClick={() => setIsAddMedicalOpen(false)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
