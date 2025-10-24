import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AICoach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your Lumaine AI Coach. I'm here to help you with fitness, skincare, wellness, goals, and more. How can I support you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadUserContext();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUserContext = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('level, current_streak, total_xp')
        .eq('id', user?.id)
        .maybeSingle();

      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .limit(5);

      setUserContext({
        level: profile?.level || 1,
        streak: profile?.current_streak || 0,
        totalXP: profile?.total_xp || 0,
        recentGoals: goals || [],
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat-coach`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: inputMessage,
            conversationHistory: messages.slice(-10),
            userContext,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    "How do I start working out?",
    "Create a skincare routine for me",
    "I'm feeling anxious",
    "Help me build a habit",
    "Meal plan for muscle gain",
    "Motivate me!",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="h-8 w-8 text-purple-500" />
          AI Coach
        </h1>
        <p className="text-slate-600 mt-1">Your 24/7 personal wellness assistant</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Lumaine AI Coach</h2>
              <p className="text-sm opacity-90">Always here to help</p>
            </div>
          </div>
        </div>

        <div className="h-96 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-md p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                    : 'bg-white shadow-md text-slate-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-indigo-100' : 'text-slate-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div className="bg-white shadow-md p-4 rounded-2xl">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="p-4 bg-white border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3">Quick prompts to get started:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(prompt)}
                  className="text-left text-sm p-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about fitness, wellness, goals..."
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border-2 border-orange-200">
          <h3 className="font-bold text-slate-900 mb-2">Fitness & Workouts</h3>
          <p className="text-sm text-slate-600">
            Get personalized workout plans, form tips, exercise recommendations, and training advice.
          </p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-pink-200">
          <h3 className="font-bold text-slate-900 mb-2">Skincare & Beauty</h3>
          <p className="text-sm text-slate-600">
            Receive routine suggestions, product recommendations, and ingredient guidance.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-200">
          <h3 className="font-bold text-slate-900 mb-2">Mental Wellness</h3>
          <p className="text-sm text-slate-600">
            Get support with stress, journaling prompts, mood management, and mindfulness tips.
          </p>
        </div>
      </div>
    </div>
  );
}
