'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { triggerLoveNotification } from '@/lib/love-notifications';
import { 
  Moon, 
  Award, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Gift, 
  Plus, 
  Clock, 
  BookOpen, 
  Sun,
  HeartHandshake,
  Check
} from 'lucide-react';

const DEFAULT_PRAYER_RECORD = {
  id: 'p1',
  fajr: true,
  dhuhr: true,
  asr: false,
  maghrib: false,
  isha: false,
  morningDhikr: true,
  eveningDhikr: false,
  quranPages: 4,
  encouragementNote: 'ما شاء الله التزام رائع بالفجر وحاضر الصلوات 🌟',
};

const DEFAULT_REWARDS_DATA = {
  balance: 120,
  catalog: [
    { id: 'rw1', title: 'خروجة عشاء رايقة على النيل', description: 'مطعم جميل وجلسة هادئة ومكافأة لأسبوع مليء بالإنجاز والتفاهم', pointsCost: 150, icon: '🌊', isActive: true },
    { id: 'rw2', title: 'اختيار فيلم السهرة مع فشار ومشروب', description: 'صاحب المكافأة هو اللي يختار الفيلم بدون أي اعتراض!', pointsCost: 40, icon: '🎬', isActive: true },
    { id: 'rw3', title: 'يوم راحة وإعفاء كامل من مهام البيت', description: 'الطرف الثاني يتولى شؤون البيت بالكامل لليوم', pointsCost: 120, icon: '🛋️', isActive: true },
  ],
  redemptions: [],
  pointsHistory: [
    { id: 'ph1', points: 50, reason: 'بداية استخدام نظام بيتنا ❤️', createdAt: new Date().toISOString() },
    { id: 'ph2', points: 15, reason: 'إنجاز مهمة مسح وترتيب الصالة ✨', createdAt: new Date().toISOString() },
  ],
};

export default function PrayersAndRewardsPage() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [prayerRecord, setPrayerRecord] = useState<any>(DEFAULT_PRAYER_RECORD);
  const [rewardsData, setRewardsData] = useState<any>(DEFAULT_REWARDS_DATA);
  const [activeTab, setActiveTab] = useState<'prayers' | 'rewards'>('prayers');
  
  // Modals
  const [isAddRewardOpen, setIsAddRewardOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCost, setNewCost] = useState('50');
  const [newIcon, setNewIcon] = useState('🎁');
  const [newDesc, setNewDesc] = useState('');
  
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [resPrayers, resRewards] = await Promise.all([
        fetch(`/api/prayers?userId=${currentUser.id}`),
        fetch(`/api/rewards?userId=${currentUser.id}`),
      ]);
      const jsonPrayers = await resPrayers.json();
      const jsonRewards = await resRewards.json();

      if (jsonPrayers.success) setPrayerRecord(jsonPrayers.record);
      if (jsonRewards.success) setRewardsData(jsonRewards);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Toggle Prayer or Dhikr
  const handleToggle = async (field: string, currentVal: any) => {
    const newVal = typeof currentVal === 'boolean' ? !currentVal : currentVal + 1;
    
    setPrayerRecord((prev: any) => ({ ...prev, [field]: newVal }));

    // Send loving prayer notification when a prayer is completed
    if (newVal === true && ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(field)) {
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
          ? `فادي صلى ${prayerNames[field]} ودعالكم ربنا يديم حبكم وبركة بيتكم يا ست الكل 🌸`
          : `رحمة صلت ${prayerNames[field]} ودعتلك ربنا يفتحها في وشك ويحفظك ليها يا سندي يا غالي 💕`,
        emoji: '🤲',
      });
    }

    try {
      await fetch('/api/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          field,
          value: newVal,
        }),
      });
      loadData();
    } catch (e) {
      loadData();
    }
  };

  // Redeem Reward
  const handleRedeem = async (rewardId: string, title: string) => {
    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem',
          rewardId,
          userId: currentUser.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification(json.message);
        loadData();
      } else {
        alert(json.message);
      }
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  // Add custom reward
  const handleAddReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_reward',
          title: newTitle,
          pointsCost: newCost,
          icon: newIcon,
          description: newDesc,
          userId: currentUser.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('تمت إضافة المكافأة الجديدة إلى الكتالوج! 🎁');
        setIsAddRewardOpen(false);
        setNewTitle('');
        setNewDesc('');
        loadData();
      }
    } catch (e) {
      alert('خطأ أثناء إضافة المكافأة');
    }
  };

  if (loading || !prayerRecord || !rewardsData) {
    return (
      <div className="py-20 text-center text-xs text-neutral-500 font-bold">
        جاري تحميل سجل صلاتنا ومكافآتنا... 🌙
      </div>
    );
  }

  const prayersList = [
    { key: 'fajr', label: 'صلاة الفجر', icon: '🌅' },
    { key: 'dhuhr', label: 'صلاة الظهر', icon: '☀️' },
    { key: 'asr', label: 'صلاة العصر', icon: '🌤️' },
    { key: 'maghrib', label: 'صلاة المغرب', icon: '🌇' },
    { key: 'isha', label: 'صلاة العشاء', icon: '🌌' },
  ];

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-neutral-800 flex items-center gap-2">
            <span>صلاتنا & مكافآتنا</span>
            <Moon className="w-5 h-5 text-indigo-600" />
          </h1>
          <p className="text-xs text-neutral-500">متابعة مشجعة للعبادات ومكافآت لتشجيع بعضنا البعض ❤️</p>
        </div>

        {/* User Balance */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs shadow-sm">
          <Award className="w-4 h-4 text-amber-500" />
          <span>{rewardsData.balance} نقطة</span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center animate-slideDown">
          {notification}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex p-1 bg-neutral-100 rounded-2xl border border-neutral-200/70 text-xs font-bold w-full max-w-full overflow-hidden">
        <button
          onClick={() => setActiveTab('prayers')}
          className={`flex-1 min-w-0 py-2 px-1 rounded-xl transition-all ${
            activeTab === 'prayers' ? 'bg-white text-indigo-700 shadow-sm' : 'text-neutral-500'
          }`}
        >
          <span className="truncate block">صلوات وأذكار اليوم 🌙</span>
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 min-w-0 py-2 px-1 rounded-xl transition-all ${
            activeTab === 'rewards' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500'
          }`}
        >
          <span className="truncate block">كتالوج المكافآت 🎁</span>
        </button>
      </div>

      {/* TAB 1: PRAYERS & DHIKR */}
      {activeTab === 'prayers' && (
        <div className="space-y-3">
          
          {/* Gentle Positive Note */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl flex items-center gap-3">
            <span className="text-2xl">🌿</span>
            <div>
              <h3 className="font-extrabold text-xs text-indigo-900">طريق البركة والسكينة في بيتنا</h3>
              <p className="text-[11px] text-indigo-700 leading-relaxed mt-0.5">
                الصلوات الخمس والأذكار نور للبيت وطمأنينة للقلب. كل التزام يمنحك نقاطاً لمكافأة نفسك وشريكك!
              </p>
            </div>
          </div>

          {/* 5 Daily Prayers Checklist */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-sm space-y-2.5">
            <h2 className="text-xs font-extrabold text-neutral-800 mb-2">صلوات اليوم الخمس ({currentUser.displayName})</h2>

            <div className="space-y-2">
              {prayersList.map(({ key, label, icon }) => {
                const isCompleted = prayerRecord[key];
                return (
                  <div
                    key={key}
                    onClick={() => handleToggle(key, isCompleted)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
                      isCompleted
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900 font-extrabold'
                        : 'bg-white border-neutral-200/80 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-neutral-300" />
                      )}
                      <span className="text-sm">{icon} {label}</span>
                    </div>

                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      +10 نقاط
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dhikr and Quran */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Morning Dhikr */}
            <div
              onClick={() => handleToggle('morningDhikr', prayerRecord.morningDhikr)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                prayerRecord.morningDhikr
                  ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold'
                  : 'bg-white border-neutral-200/80 text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Sun className="w-5 h-5 text-amber-500" />
                {prayerRecord.morningDhikr && <Check className="w-4 h-4 text-amber-600 font-black" />}
              </div>
              <h4 className="text-xs font-extrabold">أذكار الصباح</h4>
              <p className="text-[10px] text-neutral-400 mt-0.5">+10 نقاط بركة</p>
            </div>

            {/* Evening Dhikr */}
            <div
              onClick={() => handleToggle('eveningDhikr', prayerRecord.eveningDhikr)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                prayerRecord.eveningDhikr
                  ? 'bg-purple-50 border-purple-200 text-purple-900 font-bold'
                  : 'bg-white border-neutral-200/80 text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Moon className="w-5 h-5 text-purple-500" />
                {prayerRecord.eveningDhikr && <Check className="w-4 h-4 text-purple-600 font-black" />}
              </div>
              <h4 className="text-xs font-extrabold">أذكار المساء</h4>
              <p className="text-[10px] text-neutral-400 mt-0.5">+10 نقاط سكينة</p>
            </div>

          </div>

          {/* Quran Pages Counter */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-neutral-800">ورد تلاوة القرآن الكريم</h4>
                <p className="text-[11px] text-neutral-400">
                  قرأت اليوم: <span className="font-extrabold text-emerald-700">{prayerRecord.quranPages || 0}</span> صفحات
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle('quranPages', prayerRecord.quranPages || 0)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-all active:scale-95"
            >
              + صفحة 📖
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: REWARDS CATALOG */}
      {activeTab === 'rewards' && (
        <div className="space-y-3">
          
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xs font-extrabold text-neutral-800">كتالوج المكافآت المستحقة</h2>
              <p className="text-[11px] text-neutral-400">استبدل نقاطك بأنشطة ترفيهية وراحة مع شريكك</p>
            </div>

            <button
              onClick={() => setIsAddRewardOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة مكافأة
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {rewardsData.catalog.map((reward: any) => {
              const canAfford = rewardsData.balance >= reward.pointsCost;

              return (
                <div
                  key={reward.id}
                  className="p-4 bg-white border border-neutral-200/80 rounded-3xl flex items-center justify-between shadow-sm hover:border-brand-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl shrink-0 p-1">{reward.icon}</span>
                    <div>
                      <h3 className="font-extrabold text-sm text-neutral-800">{reward.title}</h3>
                      {reward.description && (
                        <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                          {reward.description}
                        </p>
                      )}
                      <span className="inline-block mt-1.5 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {reward.pointsCost} نقطة
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeem(reward.id, reward.title)}
                    disabled={!canAfford}
                    className={`px-3 py-2 rounded-2xl text-xs font-extrabold transition-all active:scale-95 shrink-0 ${
                      canAfford
                        ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20'
                        : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                    }`}
                  >
                    استرداد 🎁
                  </button>
                </div>
              );
            })}
          </div>

          {/* Points Ledger / Recent History */}
          <div className="mt-4 pt-3 border-t border-neutral-200/80 space-y-2">
            <h3 className="text-xs font-extrabold text-neutral-700 px-1">سجل النقاط المكتسبة الأخير</h3>
            <div className="space-y-1.5">
              {rewardsData.pointsHistory?.slice(0, 5).map((pt: any) => (
                <div
                  key={pt.id}
                  className="p-2.5 bg-neutral-50 rounded-xl flex items-center justify-between text-xs"
                >
                  <span className="text-neutral-700 font-medium truncate max-w-[200px]">{pt.reason}</span>
                  <span className="font-black text-emerald-600">+{pt.points} نقطة</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* MODAL: ADD CUSTOM REWARD */}
      {isAddRewardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleAddReward}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-neutral-800">إضافة فكرة مكافأة جديدة 🎁</h3>
              <button
                type="button"
                onClick={() => setIsAddRewardOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">عنوان المكافأة</label>
              <input
                type="text"
                required
                placeholder="مثال: رحلة سينما في الويك إند..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">التكلفة (نقاط)</label>
                <input
                  type="number"
                  required
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-center font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">الأيقونة (إيموجي)</label>
                <input
                  type="text"
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs text-center text-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">الوصف أو التفاصيل</label>
              <input
                type="text"
                placeholder="تفاصيل الاتفاق بين فادي ورحمة..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                إضافة المكافأة
              </button>
              <button
                type="button"
                onClick={() => setIsAddRewardOpen(false)}
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
