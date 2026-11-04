'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import { 
  UtensilsCrossed, 
  Calendar, 
  Heart, 
  Plus, 
  Sparkles, 
  ShoppingCart, 
  Clock, 
  Flame, 
  Coins, 
  ChefHat, 
  CheckCircle2, 
  Filter,
  X
} from 'lucide-react';

export default function KitchenPage() {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [fadyWishlist, setFadyWishlist] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'plan' | 'recipes' | 'wishlist'>('plan');
  
  // Modals
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleTargetRecipe, setScheduleTargetRecipe] = useState<any | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Add Recipe Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('LUNCH');
  const [newServings, setNewServings] = useState('2');
  const [newPrepTime, setNewPrepTime] = useState('30');
  const [newIngredientsText, setNewIngredientsText] = useState('');
  const [newInstructionsText, setNewInstructionsText] = useState('');
  const [isSavingRecipe, setIsSavingRecipe] = useState(false);

  // Schedule Form State
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleMealType, setScheduleMealType] = useState('LUNCH');
  const [scheduleNotes, setScheduleNotes] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/meals');
      const json = await res.json();
      if (json.success) {
        setRecipes(json.recipes || []);
        setMealPlans(json.mealPlans || []);
        setFadyWishlist(json.fadyWishlist || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Generate shopping list automatically from meal plans
  const handleGenerateShopping = async () => {
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_shopping' }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('تم استخراج مكونات الوجبات ودمجها في طلبات البيت بنجاح! 🛒✨');
      }
    } catch (e) {
      alert('حدث خطأ أثناء التوليد');
    }
  };

  // Save new recipe
  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    setIsSavingRecipe(true);

    const ingredients = newIngredientsText
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((line) => ({ name: line.trim(), amount: 1, unit: 'حسب الرغبة', estimatedPrice: 15 }));

    const instructions = newInstructionsText
      .split('\n')
      .filter((l) => l.trim().length > 0);

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_recipe',
          title: newTitle,
          category: newCategory,
          servings: newServings,
          prepTimeMins: newPrepTime,
          ingredients,
          instructions,
          suggestedByUserId: currentUser.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          currentUser.id === 'fady'
            ? 'تمت إضافة الأكلة لاقتراحاتك، هتظهر لرحمة في جدول المطبخ! ❤️'
            : 'تم حفظ الوصفة الجديدة بنجاح في كتاب المطبخ 🍲'
        );
        setIsAddRecipeOpen(false);
        setNewTitle('');
        setNewIngredientsText('');
        setNewInstructionsText('');
        loadData();
      }
    } catch (e) {
      alert('حدث خطأ');
    } finally {
      setIsSavingRecipe(false);
    }
  };

  // Submit Schedule
  const handleScheduleMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTargetRecipe) return;

    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule_meal',
          recipeId: scheduleTargetRecipe.id,
          date: scheduleDate,
          mealType: scheduleMealType,
          notes: scheduleNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`تمت جدولة "${scheduleTargetRecipe.title}" بنجاح! 📅`);
        setIsScheduleOpen(false);
        setScheduleTargetRecipe(null);
        setScheduleNotes('');
        loadData();
      }
    } catch (e) {
      alert('خطأ أثناء الجدولة');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-neutral-500 font-bold">
        جاري فتح مطبخ بيتنا... 🍲
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-neutral-800 flex items-center gap-2">
            <span>مطبخنا</span>
            <UtensilsCrossed className="w-5 h-5 text-brand-600" />
          </h1>
          <p className="text-xs text-neutral-500">تخطيط وجبات الأسبوع، الوصفات، واقتراحات فادي ورحمة</p>
        </div>

        <button
          onClick={() => setIsAddRecipeOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{currentUser.id === 'fady' ? 'نفسي في أكلة' : 'إضافة وصفة'}</span>
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center animate-slideDown">
          {notification}
        </div>
      )}

      {/* Tabs */}
      <div className="flex p-1 bg-neutral-100 rounded-2xl border border-neutral-200/70 text-xs font-bold">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'plan' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500'
          }`}
        >
          جدول الوجبات 📅
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex-1 py-2 rounded-xl transition-all ${
            activeTab === 'recipes' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500'
          }`}
        >
          وصفاتنا ({recipes.length}) 📖
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex-1 py-2 rounded-xl transition-all relative ${
            activeTab === 'wishlist' ? 'bg-white text-brand-600 shadow-sm' : 'text-neutral-500'
          }`}
        >
          أكلات بيحبها فادي ({fadyWishlist.length}) ❤️
        </button>
      </div>

      {/* TAB 1: MEAL PLAN */}
      {activeTab === 'plan' && (
        <div className="space-y-3">
          
          {/* Action Bar: Generate Shopping List */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <div>
                <p className="text-xs font-extrabold text-emerald-900">تحويل الوجبات إلى طلبات شراء</p>
                <p className="text-[10px] text-emerald-700">استخراج المكونات تلقائياً ودمجها في طلبات البيت</p>
              </div>
            </div>
            <button
              onClick={handleGenerateShopping}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              استخراج المكونات
            </button>
          </div>

          {/* Planned Meals List */}
          <div className="space-y-2.5">
            {mealPlans.map((plan) => {
              const dateObj = new Date(plan.date);
              const isToday = dateObj.toDateString() === new Date().toDateString();

              return (
                <div
                  key={plan.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isToday
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {isToday ? 'اليوم' : dateObj.toLocaleDateString('ar-EG', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs font-bold text-neutral-500">
                        {plan.mealType === 'BREAKFAST' ? 'إفطار' : plan.mealType === 'LUNCH' ? 'غداء' : 'عشاء'}
                      </span>
                    </div>

                    {plan.recipe && (
                      <span className="text-[10px] font-bold text-neutral-400">
                        تكلفة تقديرية: {plan.recipe.estimatedCost} ج.م
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-neutral-800">
                        {plan.recipe?.title || plan.customName}
                      </h3>
                      {plan.notes && (
                        <p className="text-xs text-neutral-500 mt-1">{plan.notes}</p>
                      )}
                    </div>

                    {plan.recipe && (
                      <button
                        onClick={() => setSelectedRecipe(plan.recipe)}
                        className="text-xs text-brand-600 font-bold hover:underline"
                      >
                        عرض الوصفة
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: RECIPES */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 gap-3">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm hover:border-brand-200 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-md">
                    {recipe.category === 'LUNCH' ? 'غداء' : recipe.category === 'BREAKFAST' ? 'إفطار' : 'عشاء'}
                  </span>
                  <h3 className="font-extrabold text-base text-neutral-800 mt-1">
                    {recipe.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1">
                  {recipe.isFavoriteFady && (
                    <span className="text-xs bg-rose-50 text-brand-700 px-2 py-1 rounded-xl font-bold flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> فادي
                    </span>
                  )}
                  {recipe.isFavoriteRahma && (
                    <span className="text-xs bg-rose-50 text-brand-700 px-2 py-1 rounded-xl font-bold flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /> رحمة
                    </span>
                  )}
                </div>
              </div>

              {/* Nutritional & Prep Stats */}
              <div className="grid grid-cols-4 gap-2 py-2 px-3 bg-neutral-50 rounded-xl text-center text-xs">
                <div>
                  <span className="block text-[10px] text-neutral-400">الوقت</span>
                  <span className="font-bold text-neutral-700">{recipe.prepTimeMins} د</span>
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-400">السعرات</span>
                  <span className="font-bold text-neutral-700">{recipe.calories}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-400">البروتين</span>
                  <span className="font-bold text-neutral-700">{recipe.proteinG} جم</span>
                </div>
                <div>
                  <span className="block text-[10px] text-neutral-400">التكلفة</span>
                  <span className="font-bold text-neutral-700">{recipe.estimatedCost} ج.م</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setSelectedRecipe(recipe)}
                  className="text-xs text-brand-600 font-bold hover:underline"
                >
                  المكونات والتحضير
                </button>

                <button
                  onClick={() => {
                    setScheduleTargetRecipe(recipe);
                    setIsScheduleOpen(true);
                  }}
                  className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>جدولة في الأسبوع</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: FADY'S WISHLIST */}
      {activeTab === 'wishlist' && (
        <div className="space-y-3">
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-2">
            <span className="text-xl">❤️</span>
            <p className="text-xs text-brand-800 font-medium">
              الأكلات المفضلة اللي فادي اقترحها ونفسه فيها! رحمة تقدر تختار منها وتجدولها في أيام الأسبوع بسهولة.
            </p>
          </div>

          <div className="space-y-2">
            {fadyWishlist.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-white border border-neutral-200/80 rounded-2xl flex items-center justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <h3 className="font-extrabold text-sm text-neutral-800">{item.title}</h3>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {item.calories} كالوري • {item.proteinG} جم بروتين • التكلفة: {item.estimatedCost} ج.م
                  </p>
                </div>

                <button
                  onClick={() => {
                    setScheduleTargetRecipe(item);
                    setIsScheduleOpen(true);
                  }}
                  className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-all"
                >
                  جدولة للغداء
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: RECIPE DETAILS */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">تفاصيل الوصفة</span>
                <h3 className="text-lg font-black text-neutral-800">{selectedRecipe.title}</h3>
              </div>
              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nutrition Highlights */}
            <div className="grid grid-cols-4 gap-2 bg-neutral-50 p-2.5 rounded-2xl text-center text-xs">
              <div>
                <span className="text-[10px] text-neutral-400">سعرات</span>
                <p className="font-extrabold text-neutral-800">{selectedRecipe.calories}</p>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400">بروتين</span>
                <p className="font-extrabold text-neutral-800">{selectedRecipe.proteinG}g</p>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400">كارب</span>
                <p className="font-extrabold text-neutral-800">{selectedRecipe.carbsG}g</p>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400">دهون</span>
                <p className="font-extrabold text-neutral-800">{selectedRecipe.fatG}g</p>
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <h4 className="text-xs font-extrabold text-neutral-700 mb-2">المكونات والمقادير:</h4>
              <ul className="space-y-1.5 text-xs text-neutral-600 bg-neutral-50/60 p-3 rounded-2xl border border-neutral-100">
                {JSON.parse(selectedRecipe.ingredientsJson || '[]').map((ing: any, i: number) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>• {ing.name}</span>
                    <span className="font-bold text-neutral-500">{ing.amount} {ing.unit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h4 className="text-xs font-extrabold text-neutral-700 mb-2">طريقة التحضير:</h4>
              <ol className="space-y-2 text-xs text-neutral-600 leading-relaxed list-decimal list-inside">
                {JSON.parse(selectedRecipe.instructionsJson || '[]').map((step: string, i: number) => (
                  <li key={i} className="p-2 rounded-xl bg-neutral-50 border border-neutral-100/60">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={() => setSelectedRecipe(null)}
              className="w-full py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl font-bold text-xs"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD RECIPE */}
      {isAddRecipeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleSaveRecipe}
            className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-base text-neutral-800">
                {currentUser.id === 'fady' ? 'طلب أكلة جديدة (اقتراح فادي) 💡' : 'إضافة وصفة جديدة للمطبخ 👩🏻‍🍳'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRecipeOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">اسم الأكلة</label>
              <input
                type="text"
                required
                placeholder="مثال: كفتة حاتي مشوية وسلطة طحينة"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">الوجبة</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs focus:ring-2 focus:ring-brand-500"
                >
                  <option value="BREAKFAST">إفطار</option>
                  <option value="LUNCH">غداء</option>
                  <option value="DINNER">عشاء</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">الأفراد</label>
                <input
                  type="number"
                  value={newServings}
                  onChange={(e) => setNewServings(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">الوقت (دقيقة)</label>
                <input
                  type="number"
                  value={newPrepTime}
                  onChange={(e) => setNewPrepTime(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-neutral-200 text-xs text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">المكونات (كل سطر مكون)</label>
              <textarea
                rows={3}
                placeholder="نصف كيلو لحم مفروم&#10;بصلة مفرومة&#10;بقدونس وبهارات كفتة"
                value={newIngredientsText}
                onChange={(e) => setNewIngredientsText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">خطوات التحضير (اختياري)</label>
              <textarea
                rows={2}
                placeholder="خلط المكونات وتصبيع الكفتة والشيّ على الشواية أو بالفرن..."
                value={newInstructionsText}
                onChange={(e) => setNewInstructionsText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingRecipe}
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                {isSavingRecipe ? 'جاري الحفظ وحساب السعرات...' : 'حفظ الوصفة 🍲'}
              </button>
              <button
                type="button"
                onClick={() => setIsAddRecipeOpen(false)}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: SCHEDULE MEAL */}
      {isScheduleOpen && scheduleTargetRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <form
            onSubmit={handleScheduleMeal}
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-[10px] text-neutral-400 font-bold">جدولة وجبة</span>
                <h3 className="font-extrabold text-sm text-neutral-800">{scheduleTargetRecipe.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">تاريخ الوجبة</label>
              <input
                type="date"
                required
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">نوع الوجبة</label>
              <select
                value={scheduleMealType}
                onChange={(e) => setScheduleMealType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold"
              >
                <option value="BREAKFAST">الإفطار</option>
                <option value="LUNCH">الغداء</option>
                <option value="DINNER">العشاء</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">ملاحظة لرحمة أو فادي (اختياري)</label>
              <input
                type="text"
                placeholder="مثال: فادي طلبها بعد تمرين الجيم"
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs shadow-md transition-all"
              >
                تأكيد الجدولة 📅
              </button>
              <button
                type="button"
                onClick={() => setIsScheduleOpen(false)}
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
