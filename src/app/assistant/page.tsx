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
  Plus
} from 'lucide-react';

export default function AssistantPage() {
  const { currentUser } = useUser();
  const [persona, setPersona] = useState<'om_mahmoud' | 'fady_coach' | 'family_assistant'>('om_mahmoud');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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
      <div className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex items-center gap-3 shrink-0 mb-3 shadow-sm">
        <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl border border-neutral-100">
          {currentMeta.avatar}
        </div>
        <div className="flex-1">
          <h2 className="text-xs font-extrabold text-neutral-800">{currentMeta.name}</h2>
          <p className="text-[10px] text-neutral-500 line-clamp-1">{currentMeta.description}</p>
        </div>
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

    </div>
  );
}
