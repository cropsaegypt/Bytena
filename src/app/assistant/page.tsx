'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  CheckCircle2, 
  Dumbbell, 
  Home, 
  RefreshCw,
  Plus,
  Key,
  X,
  ExternalLink
} from 'lucide-react';

export default function AssistantPage() {
  const { currentUser } = useUser();
  const [persona, setPersona] = useState<'om_mahmoud' | 'fady_coach' | 'family_assistant'>('om_mahmoud');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [tempKey, setTempKey] = useState<string>('');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('baytna_gemini_key') || '';
      setGeminiKey(savedKey);
      setTempKey(savedKey);
      setHasCustomKey(!!savedKey && savedKey.length > 10);
    }
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/assistant?persona=${persona}&userId=${currentUser.id}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [persona]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userText = textToSend.trim();
    setInputMessage('');

    // Optimistic UI
    const tempUserMsg = {
      id: String(Date.now()),
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          persona,
          userId: currentUser.id,
          geminiApiKey: geminiKey || undefined,
        }),
      });
      const json = await res.json();
      if (json && json.reply && json.reply.content) {
        setMessages((prev) => [...prev, json.reply]);
      } else {
        // Guaranteed fallback reply
        setMessages((prev) => [
          ...prev,
          {
            id: String(Date.now() + 1),
            role: 'assistant',
            content:
              persona === 'fady_coach'
                ? 'عاش يا بطل! أنا معاك وسامعك كويس، قولي تحب نركز على إيه في تمرين النهارده؟ 💪'
                : `يا صباح الفل والسعادة ${currentUser.id === 'fady' ? 'يا فادي يا بني' : 'يا ست الكل يا رحمة'}! أنا معاك وسامعاك في كل وقت في بيتنا، قولي أساعدك في إيه؟ ❤️`,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (e) {
      // Guaranteed response even if offline/error
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content:
            persona === 'fady_coach'
              ? 'عاش يا وحش! أنا معاك وسامعك، تمرينك والتزامك بالبروتين هو الأهم 💪'
              : `يا عيوني ${currentUser.id === 'fady' ? 'يا فادي يا بني' : 'يا ست الكل'}! أنا جنبك ومعاكي ودايماً سامعاكي، قولي تحب نعمل إيه في البيت؟ ❤️`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleSendText(inputMessage);
  };

  // Voice recognition toggle
  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('التعرف الصوتي غير مدعوم في هذا المتصفح');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-EG';
    recognition.continuous = false;

    if (!isListening) {
      recognition.start();
      setIsListening(true);

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInputMessage(text);
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const personaMeta = {
    om_mahmoud: {
      name: 'أم محمود – ست البيت ومديرة الروقان 👵🏼',
      description: currentUser.id === 'fady' 
        ? 'أم محمود معاك يا فادي.. تقدر تسألها عن أي حاجة في البيت أو تطلب منها توصل لرحمة أي أكلة نفسك فيها أو رسالة حب ❤️'
        : 'مصرية أصيلة وحنونة، بتساعدك في ترتيب البيت، الوجبات، التوفير، والهدوء التام بدون أي ضغط ❤️',
      avatar: '👵🏼',
      quickSuggestions: currentUser.id === 'fady'
        ? [
            'قولي لرحمة نفسي في مكرونة بشاميل من إيدها ❤️',
            'إيه اللي ناقص في البيت عشان أجيبه وأنا راجع؟',
            'صرفنا كام من الميزانية الشهر ده والمتبقي كام؟',
            'قولي لرحمة ترتاح وتريح نفسها وأنا هجيب العشا',
          ]
        : [
            'إيه رأيك نعمل غدا إيه النهارده يا أم محمود؟',
            'إيه أهم الطلبات والنواقص اللي محتاجين نشتريها؟',
            'صرفنا كام من الميزانية الشهر ده والمتبقي كام؟',
            'حاسة بإرهاق ومحتاجة بريك وروقان',
          ],
    },
    fady_coach: {
      name: 'كوتش اللياقة والتغذية الرياضية 🏋🏻‍♂️',
      description: 'كوتشك الرياضي الشخصي، خطط التمارين، أوزان الجيم، السعرات والبروتين والتحفيز المستمر 💪',
      avatar: '🏋🏻‍♂️',
      quickSuggestions: [
        'تمرينة الدفع (Chest & Triceps) بالجيم النهارده',
        'ازاي أوصل لـ 150 جرام بروتين بأكلات بيتية؟',
        'معدل نزول الوزن وثبات الميزان',
        'تمارين كارديو لحرق الدهون بعد الحديد',
      ],
    },
    family_assistant: {
      name: 'المساعد العائلي لبيتنا 🏡',
      description: 'المساعد الذكي المشترك لفادي ورحمة، للإجابة الفورية عن الميزانية والمشتريات وجدول الوجبات',
      avatar: '🏡',
      quickSuggestions: [
        'صرفنا كام من الميزانية الشهر ده والمتبقي كام؟',
        'إيه أهم الطلبات والنواقص اللي محتاجين نشتريها؟',
        'إيه جدول وجبات الأسبوع في المطبخ؟',
        'صلواتنا والتزامنا بالماء اليوم',
      ],
    },
  };

  const currentMeta = personaMeta[persona];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] pb-4 animate-fadeIn">
      
      {/* Persona Switcher Tabs */}
      <div className="flex p-1 bg-neutral-100 rounded-2xl border border-neutral-200/70 text-xs font-bold shrink-0 mb-3 w-full max-w-full overflow-hidden">
        <button
          onClick={() => setPersona('om_mahmoud')}
          className={`flex-1 min-w-0 py-2 px-1 rounded-xl transition-all ${
            persona === 'om_mahmoud' ? 'bg-white text-purple-700 shadow-sm' : 'text-neutral-500'
          }`}
        >
          <span className="truncate block">أم محمود 👵🏼</span>
        </button>
        <button
          onClick={() => setPersona('fady_coach')}
          className={`flex-1 min-w-0 py-2 px-1 rounded-xl transition-all ${
            persona === 'fady_coach' ? 'bg-white text-blue-700 shadow-sm' : 'text-neutral-500'
          }`}
        >
          <span className="truncate block">كوتش اللياقة 🏋🏻‍♂️</span>
        </button>
        <button
          onClick={() => setPersona('family_assistant')}
          className={`flex-1 min-w-0 py-2 px-1 rounded-xl transition-all ${
            persona === 'family_assistant' ? 'bg-white text-emerald-700 shadow-sm' : 'text-neutral-500'
          }`}
        >
          <span className="truncate block">مساعد البيت 🏡</span>
        </button>
      </div>

      {/* Persona Header Banner */}
      <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex items-center justify-between gap-2 shrink-0 mb-3 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl border border-neutral-100 shrink-0">
            {currentMeta.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xs font-extrabold text-neutral-800">{currentMeta.name}</h2>
            <p className="text-[10px] text-neutral-500 line-clamp-1">{currentMeta.description}</p>
          </div>
        </div>

        {/* Gemini Engine Pill */}
        <button
          onClick={() => setIsKeyModalOpen(true)}
          className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-xl border transition-all shrink-0 active:scale-95 ${
            hasCustomKey
              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 shadow-sm'
              : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
          }`}
          title="إعدادات ذكاء Gemini"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>{hasCustomKey ? 'Gemini 1.5 Flash ✨' : 'ربط Gemini 🔑'}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 px-1 no-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <span className="text-4xl">{currentMeta.avatar}</span>
            <p className="text-xs text-neutral-500 max-w-xs mx-auto font-medium">
              أهلاً بك يا {currentUser.displayName}! اضغط على أي فكرة سؤال بالأسفل أو اكتب لي مباشرة:
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-end ${isUser ? 'justify-start flex-row-reverse' : 'justify-start'}`}
              >
                {!isUser && (
                  <span className="text-xl shrink-0 mb-1">{currentMeta.avatar}</span>
                )}

                <div
                  className={`max-w-[82%] p-3.5 rounded-3xl text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-white text-neutral-800 border border-neutral-200/80 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-neutral-400 p-2 font-bold animate-pulse">
            <span>{currentMeta.avatar}</span>
            <span>جاري التفكير والرد...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Quick Suggestion Pills */}
      <div className="py-2 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {currentMeta.quickSuggestions.map((sug, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSendText(sug)}
            className="text-[11px] font-bold bg-white hover:bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-2xl border border-neutral-200 shrink-0 whitespace-nowrap transition-colors active:scale-95 disabled:opacity-50"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-2 pt-1 shrink-0 pb-16 md:pb-2">
        <button
          type="button"
          onClick={handleToggleVoice}
          className={`p-3 rounded-2xl border transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-ping'
              : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-200'
          }`}
          title="تحدث صوتياً"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          placeholder={`اكتب رسالتك لـ ${persona === 'om_mahmoud' ? 'أم محمود' : persona === 'fady_coach' ? 'الكوتش' : 'مساعد البيت'}...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 px-4 py-3 rounded-2xl border border-neutral-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
        />

        <button
          type="submit"
          disabled={!inputMessage.trim() || loading}
          className="p-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center"
        >
          <Send className="w-4 h-4 rotate-180" />
        </button>
      </form>

      {/* Gemini API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-neutral-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-800">ربط Google Gemini AI</h3>
                  <p className="text-[10px] text-neutral-400">موديل سريع جداً واستهلاك توكينز ضئيل ✨</p>
                </div>
              </div>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-neutral-700 font-bold block">مفتاح API Key الخاص بـ Gemini:</label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-mono bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                يستخدم التطبيق موديل <span className="font-bold text-purple-700">gemini-1.5-flash-8b</span>، وهو أرخص موديل رسمي من جوجل بأقل استهلاك للتوكينز (أقل من نصف سنت لكل آلاف المحادثات!).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-neutral-100">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
              >
                <span>احصل على مفتاح مجاني</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex gap-2">
                {hasCustomKey && (
                  <button
                    onClick={() => {
                      localStorage.removeItem('baytna_gemini_key');
                      setGeminiKey('');
                      setTempKey('');
                      setHasCustomKey(false);
                      setIsKeyModalOpen(false);
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    حذف
                  </button>
                )}
                <button
                  onClick={() => {
                    const trimmed = tempKey.trim();
                    if (trimmed) {
                      localStorage.setItem('baytna_gemini_key', trimmed);
                      setGeminiKey(trimmed);
                      setHasCustomKey(true);
                    } else {
                      localStorage.removeItem('baytna_gemini_key');
                      setGeminiKey('');
                      setHasCustomKey(false);
                    }
                    setIsKeyModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shadow-purple-500/20 active:scale-95 transition-all"
                >
                  حفظ المفتاح
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
