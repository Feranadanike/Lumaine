import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, Sparkles, Plus, Check, Dumbbell, Droplet, Target, BookOpen, Heart, PiggyBank } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { parseAIResponse, ParsedAction } from '../lib/aiParser';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ParsedAction[];
}

export default function AICoach() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your LumiBud Coach. I'm here to help you with fitness, skincare, wellness, goals, and more. How can I support you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);
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
            conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            userContext,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const { cleanedResponse, actions } = parseAIResponse(data.response);

      const assistantMessage: Message = {
        role: 'assistant',
        content: cleanedResponse,
        timestamp: new Date(),
        actions: actions.length > 0 ? actions : undefined,
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

  const handleSaveAction = async (action: ParsedAction, messageIndex: number) => {
    if (!user) return;
    setSavingAction(`${messageIndex}-${action.type}`);

    try {
      switch (action.type) {
        case 'workout':
          await supabase.from('planned_workouts').upsert({
            user_id: user.id,
            day_of_week: new Date().getDay(),
            workout_name: action.data.workout_name,
            exercises: action.data.exercises,
            notes: action.data.notes || null,
          }, { onConflict: 'user_id,day_of_week' });
          alert('Workout plan saved to Gym!');
          break;

        case 'skincare':
          const { data: products } = await supabase
            .from('skincare_products')
            .select('id, name')
            .eq('user_id', user.id);

          const productIds: string[] = [];
          if (action.data.products && Array.isArray(action.data.products)) {
            for (const productName of action.data.products) {
              let product = products?.find((p: any) =>
                p.name.toLowerCase().includes(productName.toLowerCase())
              );

              if (!product) {
                const { data: newProduct } = await supabase
                  .from('skincare_products')
                  .insert([{
                    user_id: user.id,
                    name: productName,
                    type: 'other',
                  }])
                  .select('id')
                  .single();

                if (newProduct) productIds.push(newProduct.id);
              } else {
                productIds.push(product.id);
              }
            }
          }

          await supabase.from('skincare_routine_schedules').insert([{
            user_id: user.id,
            time_of_day: action.data.time_of_day || 'AM',
            scheduled_time: action.data.scheduled_time || '08:00',
            day_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            products: productIds,
            is_active: true,
            reminder_enabled: false,
            notes: action.data.notes || null,
          }]);
          alert('Skincare routine saved!');
          break;

        case 'goal':
          await supabase.from('goals').insert([{
            user_id: user.id,
            category: action.data.category || 'fitness',
            title: action.data.title,
            description: action.data.description || null,
            target_value: action.data.target_value || null,
            current_value: 0,
            target_date: action.data.target_date || null,
            status: 'active',
            daily_task_enabled: false,
            daily_task_description: null,
          }]);
          alert('Goal saved!');
          break;

        case 'journal':
          await supabase.from('journal_entries').insert([{
            user_id: user.id,
            title: action.data.title || null,
            content: action.data.content,
            mood_score: 3,
            gratitude_items: null,
          }]);
          alert('Journal entry created!');
          break;

        case 'hobby':
          await supabase.from('hobbies').insert([{
            user_id: user.id,
            hobby_name: action.data.hobby_name,
            hobby_type: action.data.hobby_type || 'other',
            frequency_goal: action.data.frequency_goal || 'daily',
            target_count: action.data.target_count || 1,
            days_of_week: null,
            preferred_time: null,
          }]);
          alert('Hobby saved!');
          break;

        case 'savings':
          await supabase.from('savings_goals').insert([{
            user_id: user.id,
            goal_name: action.data.goal_name,
            target_amount: action.data.target_amount,
            target_date: action.data.target_date || null,
            current_amount: 0,
            is_completed: false,
          }]);
          alert('Savings goal saved!');
          break;
      }

      setMessages(prev =>
        prev.map((msg, idx) =>
          idx === messageIndex
            ? { ...msg, actions: msg.actions?.filter(a => a !== action) }
            : msg
        )
      );
    } catch (error) {
      console.error('Error saving action:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSavingAction(null);
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'workout': return Dumbbell;
      case 'skincare': return Droplet;
      case 'goal': return Target;
      case 'journal': return BookOpen;
      case 'hobby': return Heart;
      case 'savings': return PiggyBank;
      default: return Plus;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case 'workout': return 'Save to Gym';
      case 'skincare': return 'Save to Skincare';
      case 'goal': return 'Save as Goal';
      case 'journal': return 'Create Journal Entry';
      case 'hobby': return 'Add Hobby';
      case 'savings': return 'Save Savings Goal';
      default: return 'Save';
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'workout': return 'from-amber-400 to-orange-500';
      case 'skincare': return 'from-pink-400 to-rose-500';
      case 'goal': return 'from-indigo-400 to-purple-500';
      case 'journal': return 'from-purple-300 to-purple-400';
      case 'hobby': return 'from-rose-400 to-pink-500';
      case 'savings': return 'from-teal-400 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickPrompts = [
    "Create a workout plan for me",
    "Design a morning skincare routine",
    "Help me set a fitness goal",
    "Suggest a journaling prompt",
    "Recommend a hobby to start",
    "Plan a savings goal",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Bot className="h-8 w-8 text-purple-500" />
          LumiBud Coach
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
              <h2 className="font-bold text-lg">LumiBud Coach</h2>
              <p className="text-sm opacity-90">Always here to help</p>
            </div>
          </div>
        </div>

        <div className="h-[600px] overflow-y-auto p-6 space-y-4 bg-slate-50">
          {messages.map((message, index) => (
            <div key={index} className="space-y-2">
              <div
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-2xl p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                      : 'bg-white shadow-md text-slate-800'
                  }`}
                >
                  <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
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

              {message.actions && message.actions.length > 0 && (
                <div className="ml-11 space-y-2">
                  {message.actions.map((action, actionIndex) => {
                    const Icon = getActionIcon(action.type);
                    const actionKey = `${index}-${action.type}`;
                    const isSaving = savingAction === actionKey;

                    return (
                      <button
                        key={actionIndex}
                        onClick={() => handleSaveAction(action, index)}
                        disabled={isSaving}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${getActionColor(action.type)} text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isSaving ? (
                          <Check className="h-4 w-4 animate-pulse" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">
                          {isSaving ? 'Saving...' : getActionLabel(action.type)}
                        </span>
                      </button>
                    );
                  })}
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
            Get personalized workout plans that save directly to your Gym schedule.
          </p>
        </div>
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border-2 border-pink-200">
          <h3 className="font-bold text-slate-900 mb-2">Skincare & Beauty</h3>
          <p className="text-sm text-slate-600">
            Receive routine suggestions that auto-populate your Skincare timetable.
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-200">
          <h3 className="font-bold text-slate-900 mb-2">Goals & Habits</h3>
          <p className="text-sm text-slate-600">
            Create goals, journal entries, hobbies, and savings plans with one click.
          </p>
        </div>
      </div>
    </div>
  );
}
