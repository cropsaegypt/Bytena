'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { formatArabicDate } from '@/lib/date-utils';
import PinKeypadModal from '@/components/Modals/PinKeypadModal';
import {
  getLocalHealthData,
  saveLocalHealthData,
  mergeHealthData,
} from '@/lib/client-sync';
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
  Key,
  X,
  Trash2,
  Settings,
  Heart,
  Check
} from 'lucide-react';

const DEFAULT_HEALTH_DATA = {
  profile: {
    heightCm: 175,
    currentWeightKg: null,
    targetWeightKg: null,
    dailyCalorieTarget: 2200,
    dailyWaterTargetMl: 3000,
    macrosProteinG: 140,
    macrosCarbsG: 210,
    macrosFatG: 60,
    isSharedWithPartner: true,
    user: { displayName: 'فادي', avatar: '👨🏻‍💻' },
  },
  weightLogs: [],
  workoutLogs: [],
  totalWaterToday: 0,
  medicalRecords: [],
};

export default function HealthPage() {
  const { currentUser, isHealthUnlocked, lockHealth } = useUser();
  const [isPinModalOpen, setIsPinModalOpen] = useState(!isHealthUnlocked);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(DEFAULT_HEALTH_DATA);
  
  // Modals
  const [isLogWeightOpen, setIsLogWeightOpen] = useState(false);
  const [isLogWorkoutOpen, setIsLogWorkoutOpen] = useState(false);
  const [isAddMedicalOpen, setIsAddMedicalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form states
  const [newWeight, setNewWeight] = useState('');
  const [weightNotes, setWeightNotes] = useState('');

  // Edit Profile / Start From Scratch state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editCurrentWeight, setEditCurrentWeight] = useState('');
  const [editTargetWeight, setEditTargetWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');

  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutCategory, setWorkoutCategory] = useState(currentUser.id === 'fady' ? 'GYM' : 'HOME');
  const [workoutDuration, setWorkoutDuration] = useState('45');
  const [workoutNotes, setWorkoutNotes] = useState('');

  const [medicalTitle, setMedicalTitle] = useState('');
  const [medicalType, setMedicalType] = useState('BLOOD_TEST');
  const [medicalSummary, setMedicalSummary] = useState('');
  const [medicalShare, setMedicalShare] = useState(false);

  // Change PIN modal state
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [changePinError, setChangePinError] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinError(null);

    const cleanNew = newPinInput.trim();
    const cleanConfirm = confirmPinInput.trim();

    if (cleanNew.length !== 4 || !/^\d{4}$/.test(cleanNew)) {
      setChangePinError('رمز الـ PIN يجب أن يتكون من 4 أرقام بالضبط');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setChangePinError('الرمزان غير متطابقين، يرجى التأكد وإعادة الكتابة');
      return;
    }

    setIsSavingPin(true);
    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          newPin: cleanNew,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('تم تعيين رمز الـ PIN الجديد بنجاح! 🔒');
        setIsChangePinOpen(false);
        setNewPinInput('');
        setConfirmPinInput('');
      } else {
        setChangePinError(json.message || 'حدث خطأ أثناء تغيير الرمز');
      }
    } catch {
      setChangePinError('تعذر الاتصال بالخادم، حاول مرة أخرى');
    } finally {
      setIsSavingPin(false);
    }
  };

  const fetchHealthData = async () => {
    // 1. Instant local storage cache recovery
    const local = getLocalHealthData(currentUser.id);
    if (local && (local.currentWeightKg || (local.weightLogs && local.weightLogs.length > 0))) {
      setData((prev: any) => ({
        ...prev,
        profile: {
          ...(prev?.profile || {}),
          currentWeightKg: local.currentWeightKg ?? prev?.profile?.currentWeightKg,
          targetWeightKg: local.targetWeightKg ?? prev?.profile?.targetWeightKg,
          heightCm: local.heightCm ?? prev?.profile?.heightCm,
        },
        weightLogs: local.weightLogs || [],
        workoutLogs: local.workoutLogs || [],
        totalWaterToday: Math.max(local.totalWaterToday || 0, prev?.totalWaterToday || 0),
      }));
    }

    try {
      const res = await fetch(`/api/health?userId=${currentUser.id}&requesterId=${currentUser.id}`);
      const json = await res.json();
      if (json.success) {
        const merged = mergeHealthData(currentUser.id, json);
        setData((prev: any) => ({
          ...prev,
          profile: {
            ...(json.profile || {}),
            currentWeightKg: merged.currentWeightKg ?? json.profile?.currentWeightKg,
            targetWeightKg: merged.targetWeightKg ?? json.profile?.targetWeightKg,
            heightCm: merged.heightCm ?? json.profile?.heightCm,
          },
          weightLogs: merged.weightLogs,
          workoutLogs: merged.workoutLogs,
          totalWaterToday: merged.totalWaterToday,
          medicalRecords: json.medicalRecords || [],
        }));
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
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const curW = parseFloat(editCurrentWeight);
    const tarW = parseFloat(editTargetWeight);
    const h = parseFloat(editHeight);

    if (isNaN(curW) && isNaN(tarW) && isNaN(h)) return;

    // Optimistic & local update
    const updatedProfile = {
      ...(data?.profile || {}),
      currentWeightKg: !isNaN(curW) ? curW : data?.profile?.currentWeightKg,
      targetWeightKg: !isNaN(tarW) ? tarW : data?.profile?.targetWeightKg,
      heightCm: !isNaN(h) ? h : data?.profile?.heightCm,
    };

    let updatedWeightLogs = data?.weightLogs || [];
    if (!isNaN(curW)) {
      const newLog = {
        id: 'w_' + Date.now(),
        weightKg: curW,
        loggedAt: new Date().toISOString(),
        notes: 'تسجيل القياس الأولي',
      };
      updatedWeightLogs = [newLog, ...updatedWeightLogs];
    }

    const updatedData = {
      ...data,
      profile: updatedProfile,
      weightLogs: updatedWeightLogs,
    };
    setData(updatedData);
    saveLocalHealthData(currentUser.id, {
      ...updatedProfile,
      weightLogs: updatedWeightLogs,
      workoutLogs: data?.workoutLogs || [],
      totalWaterToday: data?.totalWaterToday || 0,
    });
    setIsEditProfileOpen(false);
    showNotification('تم حفظ قياساتك وأهدافك الصحية بنجاح! 🎯✨');

    try {
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          userId: currentUser.id,
          currentWeightKg: editCurrentWeight,
          targetWeightKg: editTargetWeight,
          heightCm: editHeight,
        }),
      });
      fetchHealthData();
    } catch {}
  };

  const handleDeleteWeight = async (id: string) => {
    if (!confirm('هل تريد حذف قياس الوزن هذا؟')) return;

    setData((prev: any) => {
      const updated = (prev?.weightLogs || []).filter((w: any) => w.id !== id);
      const local = getLocalHealthData(currentUser.id);
      saveLocalHealthData(currentUser.id, { ...local, weightLogs: updated });
      return { ...prev, weightLogs: updated };
    });
    showNotification('تم حذف قياس الوزن بنجاح 🗑️');

    try {
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_weight', id, userId: currentUser.id }),
      });
      fetchHealthData();
    } catch {}
  };

  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('هل تريد حذف هذا التمرين؟')) return;
    try {
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_workout', id, userId: currentUser.id }),
      });
      showNotification('تم حذف التمرين بنجاح 🗑️');
      fetchHealthData();
    } catch {}
  };

  const handleDeleteMedical = async (id: string) => {
    if (!confirm('هل تريد حذف هذا التقرير الطبي؟')) return;
    try {
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_medical', id, userId: currentUser.id }),
      });
      showNotification('تم حذف التقرير الطبي 🗑️');
      fetchHealthData();
    } catch {}
  };

  // Water Drink Action
  const handleDrinkWater = async (amount: number = 250) => {
    try {
      setData((prev: any) => {
        const nextTotal = (prev.totalWaterToday || 0) + amount;
        const local = getLocalHealthData(currentUser.id);
        saveLocalHealthData(currentUser.id, { ...local, totalWaterToday: nextTotal });
        return {
          ...prev,
          totalWaterToday: nextTotal,
        };
      });
      showNotification(`تم تسجيل ${amount} مل ماء بنجاح! 💧`);

      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_water',
          userId: currentUser.id,
          amountMl: amount,
        }),
      });
    } catch (e) {
      fetchHealthData();
    }
  };

  // Log Weight
  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight) return;
    const numericWeight = parseFloat(newWeight);
    if (isNaN(numericWeight)) return;

    const newLogItem = {
      id: 'w_' + Date.now(),
      weightKg: numericWeight,
      loggedAt: new Date().toISOString(),
      notes: weightNotes.trim() || undefined,
    };

    // Optimistic & Local Storage
    setData((prev: any) => {
      const updatedLogs = [newLogItem, ...(prev?.weightLogs || [])];
      const updatedProfile = {
        ...(prev?.profile || {}),
        currentWeightKg: numericWeight,
      };
      saveLocalHealthData(currentUser.id, {
        ...updatedProfile,
        weightLogs: updatedLogs,
        workoutLogs: prev?.workoutLogs || [],
        totalWaterToday: prev?.totalWaterToday || 0,
      });
      return {
        ...prev,
        profile: updatedProfile,
        weightLogs: updatedLogs,
      };
    });

    setIsLogWeightOpen(false);
    setNewWeight('');
    setWeightNotes('');
    showNotification(`تم تسجيل وزنك الجديد (${numericWeight} كجم) بنجاح! ⚖️`);

    try {
      await fetch('/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'log_weight',
          userId: currentUser.id,
          weightKg: numericWeight,
          notes: weightNotes.trim(),
        }),
      });
      fetchHealthData();
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
          onSuccess={(isDefaultPin) => {
            setIsPinModalOpen(false);
            fetchHealthData();
            if (isDefaultPin) {
              setNewPinInput('');
              setConfirmPinInput('');
              setChangePinError(null);
              setIsChangePinOpen(true);
            }
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
          {/* Change PIN button */}
          <button
            onClick={() => {
              setNewPinInput('');
              setConfirmPinInput('');
              setChangePinError(null);
              setIsChangePinOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold flex items-center gap-1 transition-all"
            title="تغيير رمز الـ PIN"
          >
            <Key className="w-3.5 h-3.5 text-brand-600" />
            <span>تغيير الـ PIN</span>
          </button>

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
      <div className="bg-gradient-to-l from-brand-600 to-rose-500 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-rose-100 bg-black/15 px-2.5 py-0.5 rounded-full">
              {currentUser.id === 'fady' ? 'برنامج الجيم وبناء العضلات 🏋🏻‍♂️' : 'برنامج اللياقة والروقان والتغذية 🌸'}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black">{profile.currentWeightKg || '–'}</span>
              <span className="text-sm font-bold text-rose-100">كجم</span>
            </div>
            <p className="text-[11px] text-rose-100 mt-1">
              الهدف: <span className="font-extrabold text-white">{profile.targetWeightKg ? `${profile.targetWeightKg} كجم` : 'لم يحدد'}</span> • الطول: <span className="font-extrabold text-white">{profile.heightCm ? `${profile.heightCm} سم` : 'لم يحدد'}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
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

            {/* Edit Measurements Button */}
            <button
              onClick={() => {
                setEditCurrentWeight(profile.currentWeightKg ? String(profile.currentWeightKg) : '');
                setEditTargetWeight(profile.targetWeightKg ? String(profile.targetWeightKg) : '');
                setEditHeight(profile.heightCm ? String(profile.heightCm) : '');
                setIsEditProfileOpen(true);
              }}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 text-white"
            >
              <Settings className="w-3 h-3" />
              <span>تعديل الأهداف والوزن</span>
            </button>
          </div>
        </div>

        {/* Nutritional Targets Grid */}
        <div className="grid grid-cols-4 gap-2 pt-3 border-t border-white/20 text-center text-xs">
          <div>
            <span className="block text-[10px] text-rose-100">السعرات</span>
            <span className="font-extrabold text-white">{profile.dailyCalorieTarget || 2200}</span>
          </div>
          <div>
            <span className="block text-[10px] text-rose-100">البروتين</span>
            <span className="font-extrabold text-white">{profile.currentWeightKg ? `${Math.round(profile.currentWeightKg * 2)}g` : '–'}</span>
          </div>
          <div>
            <span className="block text-[10px] text-rose-100">الكارب</span>
            <span className="font-extrabold text-white">{profile.macrosCarbsG || 210}g</span>
          </div>
          <div>
            <span className="block text-[10px] text-rose-100">الدهون</span>
            <span className="font-extrabold text-white">{profile.macrosFatG || 60}g</span>
          </div>
        </div>
      </div>

      {/* Start From Scratch Setup Banner if Weight Not Entered Yet */}
      {!profile.currentWeightKg && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-4 text-center space-y-2 shadow-sm animate-fadeIn">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
            ⚖️
          </div>
          <h3 className="text-xs font-black text-amber-900">
            أهلاً بك يا {currentUser.displayName}! ابدأ رحلتك الصحية من الأول وسجل وزنك
          </h3>
          <p className="text-[11px] text-amber-700 max-w-xs mx-auto">
            اكتب وزنك الحالي والهدف اللي حابب توصله عشان نحسبلك احتياجك اليومي من البروتين والمياه بدقة!
          </p>
          <button
            onClick={() => {
              setEditCurrentWeight('');
              setEditTargetWeight('');
              setEditHeight('175');
              setIsEditProfileOpen(true);
            }}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-amber-600/20 active:scale-95 transition-all"
          >
            سجل وزنك وأهدافك الآن ✨
          </button>
        </div>
      )}

      {/* Dedicated Personalized Health & Nutrition Advice ("نصايح وكدا") */}
      <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-base">
            {currentUser.id === 'fady' ? '🏋🏻‍♂️' : '🌸'}
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-neutral-800">
              {currentUser.id === 'fady' ? 'نصايح كوتش اللياقة والتمرين لفادي 💪' : 'نصايح زوزو للصحة والروقان لرحمة 🌸'}
            </h3>
            <p className="text-[10px] text-neutral-400">إرشادات مخصصة بناءً على وزنك وأهدافك</p>
          </div>
        </div>

        {currentUser.id === 'fady' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="font-black text-brand-600 flex items-center gap-1">🥩 احتياج البروتين</span>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                هدفك اليومي <span className="font-extrabold text-neutral-800">{profile.currentWeightKg ? Math.round(profile.currentWeightKg * 2) : 150} جرام بروتين</span> (2 جرام لكل كجم). وزعهم على: 4 بيضات وشوفان صباحاً، 250جم صدور دجاج في الغداء، وتونة أو جبنة قريش عشاء.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="font-black text-cyan-600 flex items-center gap-1">💧 ترطيب العضلات</span>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                اشرب على الأقل <span className="font-extrabold text-neutral-800">{profile.currentWeightKg ? (profile.currentWeightKg * 0.035).toFixed(1) : '3.0'} لتر مية</span> يومياً. الماء يحافظ على قوة المفاصل ويمنع الشد العضلي أثناء رفع الأوزان الثقيلة.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="font-black text-amber-600 flex items-center gap-1">🏋🏻‍♂️ خطة الجيم والأوزان</span>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                ركز على التكنيك الصحيح في التمارين المركبة (بنش، سكوات، ديدليفت). زيادة تدريجية في الوزن أو التكرارات كل أسبوعين لتحفيز البناء العضلي.
              </p>
            </div>

            <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-1">
              <span className="font-black text-purple-600 flex items-center gap-1">💤 الاستشفاء والنوم</span>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                العضلات تبنى أثناء النوم! احرص على 7 إلى 8 ساعات نوم متواصل في غرفة مظلمة لرفع هرمون النمو وخفض هرمون التوتر.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 space-y-1">
              <span className="font-black text-rose-700 flex items-center gap-1">🥗 توازن الأكل بدون حرمان</span>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                يا سكرة بيتنا، متعمليش دايت حرمان ولا تشيلي هم الميزان! قسمي طبقك: نصه خضار وسلطة ملونة، ربعه بروتين مشبع (فراخ أو بيض أو سمك)، وربعه نشويات مفيدة.
              </p>
            </div>

            <div className="p-3 bg-cyan-50/60 rounded-2xl border border-cyan-100 space-y-1">
              <span className="font-black text-cyan-700 flex items-center gap-1">💧 نضارة البشرة والنشاط</span>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                كوباية مية كل ساعتين ({profile.currentWeightKg ? (profile.currentWeightKg * 0.035).toFixed(1) : '2.5'} لتر يومياً) سر النقاء والطاقة وخفة الحركة بدون أي إرهاق أو صداع.
              </p>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1">
              <span className="font-black text-emerald-700 flex items-center gap-1">🚶🏻‍♀️ روقان المشي والحركة</span>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                20 دقيقة مشي خفيف في الهواء أو تمارين استطالة بالبيت بتفرز هرمونات السعادة وتجدد طاقتك وتريح ضهرك وأعصابك تماماً.
              </p>
            </div>

            <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1">
              <span className="font-black text-purple-700 flex items-center gap-1">☕ بريك الروقان والدلع</span>
              <p className="text-neutral-600 leading-relaxed text-[11px]">
                خدي لنفسك نص ساعة في نص اليوم: مشروب دافئ تحبيه، ريحي ضهرك، وفكري في النعم والبركة اللي في بيتك مع فادي حبيبك ❤️
              </p>
            </div>
          </div>
        )}
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
          {weightLogs.length === 0 ? (
            <p className="text-xs text-neutral-400 py-3 text-center">لا توجد قياسات وزن مسجلة بعد، اضغط على (+ تسجيل قياس جديد)</p>
          ) : (
            weightLogs.slice(0, 5).map((log: any) => (
              <div
                key={log.id}
                className="p-2.5 bg-neutral-50 border border-neutral-100 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-black text-neutral-800">{log.weightKg} كجم</span>
                  {log.notes && <span className="text-[10px] text-neutral-500 mr-2">({log.notes})</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {new Date(log.loggedAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                  </span>
                  <button
                    onClick={() => handleDeleteWeight(log.id)}
                    className="p-1 text-neutral-400 hover:text-rose-500 rounded transition-colors"
                    title="حذف قياس الوزن"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
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
          {workoutLogs.length === 0 ? (
            <p className="text-xs text-neutral-400 py-3 text-center">لا توجد تمارين مسجلة بعد، اضغط على (+ تسجيل تمرين)</p>
          ) : (
            workoutLogs.slice(0, 5).map((w: any) => (
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
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                    +20 نقطة
                  </span>
                  <button
                    onClick={() => handleDeleteWorkout(w.id)}
                    className="p-1 text-neutral-400 hover:text-rose-500 rounded transition-colors"
                    title="حذف التمرين"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {new Date(rec.testDate).toLocaleDateString('ar-EG')}
                    </span>
                    <button
                      onClick={() => handleDeleteMedical(rec.id)}
                      className="p-1 text-neutral-400 hover:text-rose-500 rounded transition-colors"
                      title="حذف التقرير"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

      {/* MODAL: EDIT MEASUREMENTS & GOALS */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h3 className="font-extrabold text-sm text-neutral-800">تعديل قياساتك وأهدافك</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
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
                placeholder="مثال: 80.0"
                value={editCurrentWeight}
                onChange={(e) => setEditCurrentWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-base font-black text-center text-brand-600 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">الوزن المستهدف اللي عايز توصله (كجم)</label>
              <input
                type="number"
                step="0.1"
                placeholder="مثال: 74.0"
                value={editTargetWeight}
                onChange={(e) => setEditTargetWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-base font-black text-center text-emerald-600 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">الطول (سم)</label>
              <input
                type="number"
                placeholder="مثال: 178"
                value={editHeight}
                onChange={(e) => setEditHeight(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-sm font-bold text-center text-neutral-800 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                حفظ القياسات ✨
              </button>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

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

      {/* MODAL 4: CHANGE PIN MODAL */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSaveNewPin}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp text-center"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
              <Key className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-neutral-800">
                تعيين رمز PIN جديد للملف الصحي 🔒
              </h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                رمز الـ PIN الحالي هو الرمز الافتراضي (0000). لضمان سرية وخصوصية تحاليلك الطبية وأوزانك، يرجى كتابة رمز سري جديد خاص بك مكوّن من 4 أرقام.
              </p>
            </div>

            {changePinError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl animate-shake">
                {changePinError}
              </div>
            )}

            <div className="space-y-3 text-right">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  رمز الـ PIN الجديد (4 أرقام)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-center font-mono font-bold text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  تأكيد رمز الـ PIN الجديد
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-center font-mono font-bold text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingPin || newPinInput.length !== 4 || confirmPinInput.length !== 4}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isSavingPin ? 'جاري الحفظ...' : 'حفظ وتأكيد الرمز 🔒'}
              </button>
              <button
                type="button"
                onClick={() => setIsChangePinOpen(false)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
              >
                تذكيري لاحقاً
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
