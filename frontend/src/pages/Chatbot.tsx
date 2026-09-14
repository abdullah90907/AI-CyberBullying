import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProtectedLayout from '../components/ProtectedLayout';
import { FadeIn } from '../components/SectionWrapper';
import { FormattedMessage } from '../components/FormattedMessage';
import { cn } from '../lib/utils';

interface UserData {
  id?: number;
  email: string;
  name: string;
  stats: {
    totalScans: number;
    threatsBlocked: number;
    accuracy: number;
    reportsGenerated: number;
  };
  history: Array<{
    id: string;
    type: 'text' | 'image' | 'video';
    date: string;
    result: 'safe' | 'toxic';
    score: number;
  }>;
}

interface ChatbotProps {
  isDark: boolean;
  onLogout: () => void;
  user: UserData | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const getApiBase = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
};

const API_BASE = getApiBase();

const SUGGESTED_PROMPTS = [
  "What should I do if someone is cyberbullying me?",
  "How does Image Detection identify harmful memes?",
  "Can you help me cope with feeling harassed online?",
  "How does OmniGuard categorize different youth risks?",
];

const Chatbot: React.FC<ChatbotProps> = ({ isDark, onLogout, user }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your OmniGuard AI assistant. How can I help you stay safe online today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const generateOfflineFallback = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('sad') || lowerMsg.includes('upset') || lowerMsg.includes('depressed') || lowerMsg.includes('anxious') || lowerMsg.includes('scared') || lowerMsg.includes('afraid') || lowerMsg.includes('hurt') || lowerMsg.includes('victim')) {
      return "I'm so sorry you're going through this. Your feelings are completely valid, and you don't deserve to be treated this way. Please know that you're not alone, and there's help available. Consider reaching out to a trusted friend, family member, or school counselor. You matter, and your safety is the most important thing.";
    }
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      return "Hello! I'm here to help you with anything related to OmniGuard AI or cyber safety. How can I assist you today?";
    }
    if (lowerMsg.includes('text analysis') || lowerMsg.includes('text')) {
      return "Our Text Analysis feature evaluates text against the 11 YouthSafe risk categories using Groq LLM and Toxic-BERT. You can test it on the Text Analysis page!";
    }
    if (lowerMsg.includes('image') || lowerMsg.includes('image detection')) {
      return "Our Image Detection combines EasyOCR, CLIP zero-shot classification, and Gemini Vision to detect harmful memes, violence, or manipulated media.";
    }
    if (lowerMsg.includes('video') || lowerMsg.includes('video processing')) {
      return "Our Video Processing samples frames across video timelines and evaluates them with Gemini Vision to detect harmful content and aggressive behavior.";
    }
    return "Thank you for reaching out. Remember: if you face online harassment, screenshot evidence, block the user, and report it to trusted adults or platform moderators. You are not alone!";
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Build conversation history for context (exclude greeting)
      const historyPayload = messages
        .slice(1)
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_BASE}chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          user_id: user?.id || 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || generateOfflineFallback(textToSend),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.warn('[Chatbot] Backend request failed, using offline response:', err);
      const fallbackReply = generateOfflineFallback(textToSend);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMessage(inputText);
  };

  return (
    <ProtectedLayout isDark={isDark} onLogout={onLogout} userName={user?.name}>
        <FadeIn>
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <Link to="/dashboard" className={cn(
                'p-2 rounded-xl transition-all duration-300 hover:scale-105',
                isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
              )}>
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className={cn(
                  'text-3xl md:text-4xl font-black mb-1',
                  isDark ? 'text-white' : 'text-slate-900'
                )}>
                  AI Safety Assistant
                </h1>
                <p className={cn(
                  'text-sm md:text-base',
                  isDark ? 'text-slate-400' : 'text-slate-600'
                )}>
                  Real-time AI support for cyberbullying prevention, digital wellness, and OmniGuard guidance
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-3xl border overflow-hidden flex flex-col h-[calc(100vh-230px)]',
            isDark 
              ? 'bg-card border-slate-700/50' 
              : 'bg-white border-slate-200'
          )}
        >
          {/* Header */}
          <div className={cn(
            'p-4 md:p-6 border-b flex items-center justify-between',
            isDark ? 'border-slate-700/50' : 'border-slate-200'
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20">
                <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h3 className={cn(
                  'text-lg md:text-xl font-bold',
                  isDark ? 'text-white' : 'text-slate-900'
                )}>
                  OmniGuard AI
                </h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className={cn(
                    'text-xs md:text-sm',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  )}>
                    Online • Powered by OmniGuard Safety Intelligence
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[85%] md:max-w-[75%] p-4 rounded-2xl whitespace-pre-wrap leading-relaxed',
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20'
                    : isDark
                    ? 'bg-slate-800 text-slate-200 border border-slate-700/50'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                )}>
                  <FormattedMessage content={message.content} isUser={message.role === 'user'} isDark={isDark} />
                  <p className={cn(
                    'text-[11px] mt-2 opacity-70 text-right',
                    message.role === 'user' ? 'text-white/70' : isDark ? 'text-slate-400' : 'text-slate-500'
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}

            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className={cn(
                  'p-4 rounded-2xl border',
                  isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-slate-100 border-slate-200'
                )}>
                  <div className="flex gap-2">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-primary"
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompt suggestions when user hasn't sent messages yet */}
          {messages.length === 1 && (
            <div className="px-4 md:px-6 pb-2">
              <p className={cn(
                'text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5',
                isDark ? 'text-slate-400' : 'text-slate-600'
              )}>
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Suggested Questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className={cn(
                      'text-xs md:text-sm px-3 py-1.5 rounded-xl border transition-all text-left hover:scale-[1.01]',
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 hover:border-primary text-slate-300'
                        : 'bg-slate-50 border-slate-200 hover:border-primary text-slate-700'
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <div className={cn(
            'p-4 md:p-6 border-t',
            isDark ? 'border-slate-700/50' : 'border-slate-200'
          )}>
            <form onSubmit={handleSend} className="flex gap-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about online safety, coping with harassment, or OmniGuard features..."
                className={cn(
                  'flex-1 px-5 md:px-6 py-3.5 md:py-4 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm md:text-base',
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                )}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="px-5 md:px-6 py-3.5 md:py-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-base md:text-lg shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </motion.div>
    </ProtectedLayout>
  );
};

export default Chatbot;