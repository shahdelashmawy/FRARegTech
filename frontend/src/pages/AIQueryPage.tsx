import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, Bot, Trash2, Lightbulb, Loader } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { askAI } from '../lib/api';
import type { ChatMessage as ChatMessageType } from '../types';
import ChatMessage from '../components/ai/ChatMessage';

// Simple UUID alternative since crypto might not have v4 easily
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const EXAMPLE_QUESTIONS_EN = [
  'How to obtain an FRA digital license?',
  'What are the capital requirements for payment service providers?',
  'Recent changes to investment fund regulations',
  'What are the disclosure requirements for listed companies?',
];

const EXAMPLE_QUESTIONS_AR = [
  'كيفية الحصول على ترخيص رقمي من الهيئة؟',
  'ما هي متطلبات رأس المال لمزودي خدمات الدفع؟',
  'آخر التغييرات على لوائح صناديق الاستثمار',
  'ما هي متطلبات الإفصاح للشركات المدرجة؟',
];

const AIQueryPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const isArabic = i18n.language === 'ar';

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const exampleQuestions = isArabic ? EXAMPLE_QUESTIONS_AR : EXAMPLE_QUESTIONS_EN;

  // Pre-fill if coming from regulation detail page
  useEffect(() => {
    const regId = searchParams.get('regulation');
    if (regId) {
      const preQuestion = isArabic
        ? `اشرح لي اللائحة رقم ${regId}`
        : `Explain regulation #${regId} in detail`;
      setInput(preQuestion);
    }
  }, [searchParams, isArabic]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessageType = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await askAI(text.trim(), isArabic ? 'ar' : 'en');

      const assistantMessage: ChatMessageType = {
        id: generateId(),
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        relevant_regulations: response.relevant_regulations,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || t('error'));
      // Remove the user message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-primary">{t('aiQueryTitle')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('aiQuerySubtitle')}</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            {t('clearChat')}
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-200 p-6 chat-container mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
              <Bot size={32} className="text-accent" />
            </div>
            <h2 className="text-lg font-semibold text-primary mb-2">
              {isArabic ? 'كيف يمكنني مساعدتك؟' : 'How can I help you?'}
            </h2>
            <p className="text-gray-500 text-sm text-center max-w-md mb-8">
              {isArabic
                ? 'اسأل أي سؤال عن لوائح هيئة الرقابة المالية المصرية'
                : 'Ask any question about Egyptian FRA regulations, and I\'ll provide detailed answers with citations.'}
            </p>

            {/* Example questions */}
            <div className="w-full max-w-lg">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-accent" />
                <span className="text-sm font-medium text-gray-600">{t('exampleQuestions')}</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {exampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(q)}
                    className="text-left px-4 py-3 bg-gray-50 hover:bg-accent/5 hover:border-accent border border-gray-200 rounded-xl text-sm text-gray-700 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {loading && (
              <div className="flex gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-primary" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader size={16} className="animate-spin text-accent" />
                    <span className="text-sm">{t('thinking')}</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0">
        <div className="flex items-end gap-3 bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('askQuestion')}
            rows={1}
            disabled={loading}
            className={clsx(
              'flex-1 resize-none text-sm outline-none text-gray-800 placeholder:text-gray-400',
              'max-h-32 overflow-y-auto leading-relaxed',
              'disabled:opacity-60'
            )}
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className={clsx(
              'flex items-center justify-center w-9 h-9 rounded-xl transition-all flex-shrink-0',
              input.trim() && !loading
                ? 'bg-primary hover:bg-primary-light text-white'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
          >
            {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          {isArabic ? 'اضغط Enter للإرسال، Shift+Enter لسطر جديد' : 'Press Enter to send, Shift+Enter for new line'}
        </p>
      </div>
    </div>
  );
};

export default AIQueryPage;
