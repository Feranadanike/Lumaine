import { useEffect, useState } from 'react';
import { Droplet, Dumbbell, PiggyBank, BookOpen, Heart, TrendingUp, Sparkles, Target, Clock, CheckCircle2, Circle, Lightbulb, Quote } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ProgressRing from './ProgressRing';

interface Stats {
  skincareStreak: number;
  workoutStreak: number;
  journalStreak: number;
  hobbyStreak: number;
}

interface TodayTask {
  id: string;
  type: 'skincare' | 'workout' | 'journal' | 'hobby' | 'goal';
  title: string;
  time?: string;
  completed: boolean;
  details?: string;
}

interface HomeProps {
  onViewChange: (view: string) => void;
}

export default function Home({ onViewChange }: HomeProps) {
  const { user } = useAuth();
  const { accentColor } = useTheme();

  const getColorClasses = () => {
    const colorMap: Record<string, { gradient: string; light: string; text: string; border: string }> = {
      rose: { gradient: 'from-rose-50 via-pink-50 to-purple-50', light: 'from-rose-50 to-pink-50', text: 'text-rose-600', border: 'border-rose-200' },
      pink: { gradient: 'from-pink-50 via-pink-100 to-purple-50', light: 'from-pink-50 to-pink-100', text: 'text-pink-600', border: 'border-pink-200' },
      purple: { gradient: 'from-purple-50 via-pink-50 to-rose-50', light: 'from-purple-50 to-purple-100', text: 'text-purple-600', border: 'border-purple-200' },
      blue: { gradient: 'from-blue-50 via-cyan-50 to-teal-50', light: 'from-blue-50 to-cyan-50', text: 'text-blue-600', border: 'border-blue-200' },
      cyan: { gradient: 'from-cyan-50 via-blue-50 to-teal-50', light: 'from-cyan-50 to-teal-50', text: 'text-cyan-600', border: 'border-cyan-200' },
      teal: { gradient: 'from-teal-50 via-cyan-50 to-emerald-50', light: 'from-teal-50 to-emerald-50', text: 'text-teal-600', border: 'border-teal-200' },
      green: { gradient: 'from-green-50 via-emerald-50 to-teal-50', light: 'from-green-50 to-emerald-50', text: 'text-green-600', border: 'border-green-200' },
      amber: { gradient: 'from-amber-50 via-yellow-50 to-orange-50', light: 'from-amber-50 to-yellow-50', text: 'text-amber-600', border: 'border-amber-200' },
      emerald: { gradient: 'from-emerald-50 via-green-50 to-teal-50', light: 'from-emerald-50 to-teal-50', text: 'text-emerald-600', border: 'border-emerald-200' },
      indigo: { gradient: 'from-indigo-50 via-purple-50 to-blue-50', light: 'from-indigo-50 to-purple-50', text: 'text-indigo-600', border: 'border-indigo-200' },
    };
    return colorMap[accentColor] || colorMap.rose;
  };
  const [stats, setStats] = useState<Stats>({
    skincareStreak: 0,
    workoutStreak: 0,
    journalStreak: 0,
    hobbyStreak: 0,
  });
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);

  useEffect(() => {
    if (user) {
      loadStats();
      loadUserProfile();
      loadTodayTasks();
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user?.id)
        .maybeSingle();

      if (data?.full_name) {
        setUserName(data.full_name.split(' ')[0]);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadTodayTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const tasks: TodayTask[] = [];

      const [schedules, workouts, hobbies, goals, skincareLog, workoutLog, hobbyLog, journalLog] = await Promise.all([
        supabase
          .from('skincare_routine_schedules')
          .select('*, products')
          .eq('user_id', user?.id)
          .eq('is_active', true)
          .contains('day_of_week', [dayOfWeek]),
        supabase
          .from('planned_workout_routines')
          .select('*')
          .eq('user_id', user?.id)
          .eq('is_active', true)
          .contains('days_of_week', [dayOfWeek]),
        supabase
          .from('hobbies')
          .select('*')
          .eq('user_id', user?.id)
          .eq('is_active', true)
          .contains('days_of_week', [dayOfWeek]),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user?.id)
          .eq('status', 'active')
          .eq('daily_task_enabled', true),
        supabase
          .from('skincare_logs')
          .select('id')
          .eq('user_id', user?.id)
          .eq('log_date', today)
          .maybeSingle(),
        supabase
          .from('workout_sessions')
          .select('id')
          .eq('user_id', user?.id)
          .eq('workout_date', today)
          .maybeSingle(),
        supabase
          .from('hobby_logs')
          .select('id')
          .eq('user_id', user?.id)
          .eq('log_date', today)
          .maybeSingle(),
        supabase
          .from('journal_entries')
          .select('id')
          .eq('user_id', user?.id)
          .eq('entry_date', today)
          .maybeSingle()
      ]);

      if (schedules.data && schedules.data.length > 0) {
        schedules.data.forEach((schedule: any) => {
          tasks.push({
            id: `skincare-${schedule.id}`,
            type: 'skincare',
            title: `${schedule.time_of_day === 'AM' ? 'Morning' : 'Evening'} Skincare Routine`,
            time: schedule.scheduled_time,
            completed: !!skincareLog.data,
            details: `${schedule.products?.length || 0} steps`
          });
        });
      }

      if (workouts.data && workouts.data.length > 0) {
        workouts.data.forEach((workout: any) => {
          tasks.push({
            id: `workout-${workout.id}`,
            type: 'workout',
            title: workout.routine_name || 'Workout Session',
            time: workout.preferred_time,
            completed: !!workoutLog.data,
            details: workout.exercises?.length ? `${workout.exercises.length} exercises` : undefined
          });
        });
      }

      if (hobbies.data && hobbies.data.length > 0) {
        hobbies.data.forEach((hobby: any) => {
          tasks.push({
            id: `hobby-${hobby.id}`,
            type: 'hobby',
            title: hobby.hobby_name,
            time: hobby.preferred_time,
            completed: !!hobbyLog.data,
            details: hobby.hobby_type
          });
        });
      }

      if (goals.data && goals.data.length > 0) {
        goals.data.forEach((goal: any) => {
          tasks.push({
            id: `goal-${goal.id}`,
            type: 'goal',
            title: goal.daily_task_description || goal.title,
            completed: false,
            details: goal.category
          });
        });
      }

      tasks.push({
        id: 'journal-today',
        type: 'journal',
        title: 'Daily Journal Entry',
        completed: !!journalLog.data
      });

      tasks.sort((a, b) => {
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time) return -1;
        if (b.time) return 1;
        return 0;
      });

      setTodayTasks(tasks);
    } catch (error) {
      console.error('Error loading today\'s tasks:', error);
    }
  };

  const loadStats = async () => {
    try {
      const [skincare, workout, journal, hobby] = await Promise.all([
        supabase
          .from('skincare_logs')
          .select('log_date')
          .eq('user_id', user?.id)
          .order('log_date', { ascending: false })
          .limit(30),
        supabase
          .from('workout_sessions')
          .select('workout_date')
          .eq('user_id', user?.id)
          .order('workout_date', { ascending: false })
          .limit(30),
        supabase
          .from('journal_entries')
          .select('entry_date')
          .eq('user_id', user?.id)
          .order('entry_date', { ascending: false })
          .limit(30),
        supabase
          .from('hobby_logs')
          .select('log_date')
          .eq('user_id', user?.id)
          .order('log_date', { ascending: false })
          .limit(30),
      ]);

      setStats({
        skincareStreak: calculateStreak(skincare.data || []),
        workoutStreak: calculateStreak(workout.data || []),
        journalStreak: calculateStreak(journal.data || []),
        hobbyStreak: calculateStreak(hobby.data || []),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (logs: Array<{ log_date?: string; workout_date?: string; entry_date?: string }>) => {
    if (logs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < logs.length; i++) {
      const logDate = new Date(
        logs[i].log_date || logs[i].workout_date || logs[i].entry_date || ''
      );
      logDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);

      if (logDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (logDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivation = () => {
    const totalStreak = stats.skincareStreak + stats.workoutStreak + stats.journalStreak + stats.hobbyStreak;
    if (totalStreak > 20) return "You're absolutely crushing it! 🌟";
    if (totalStreak > 10) return "Look at you building those habits! 💪";
    if (totalStreak > 5) return "You're doing amazing! Keep going! ✨";
    return "Every small step counts. Let's do this! 💫";
  };

  const quickLogSkincare = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('skincare_logs')
        .insert({
          user_id: user?.id,
          log_date: today,
          completed: true
        });

      if (error) throw error;
      loadStats();
      loadTodayTasks();
      alert('Skincare routine logged!');
    } catch (error) {
      console.error('Error logging skincare:', error);
    }
  };

  const getWeeklyReflection = () => {
    const totalActivities = stats.skincareStreak + stats.workoutStreak + stats.journalStreak + stats.hobbyStreak;
    const activeCategories = [
      stats.skincareStreak > 0 && 'skincare',
      stats.workoutStreak > 0 && 'workouts',
      stats.journalStreak > 0 && 'journaling',
      stats.hobbyStreak > 0 && 'hobbies',
    ].filter(Boolean);

    if (totalActivities === 0) {
      return {
        icon: Sparkles,
        title: 'Fresh Start',
        message: "It's a new week full of possibilities! Start with something simple today, and watch your momentum build.",
        color: 'from-slate-50 to-blue-50',
        borderColor: 'border-slate-200',
      };
    }

    if (totalActivities >= 20) {
      return {
        icon: Target,
        title: 'Outstanding Week!',
        message: `Incredible consistency! You've been crushing it with ${activeCategories.join(', ')}. Keep this amazing energy going!`,
        color: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-200',
      };
    }

    if (totalActivities >= 10) {
      return {
        icon: TrendingUp,
        title: 'Great Progress',
        message: `You're building solid habits with ${activeCategories.join(', ')}. Every streak is a step forward—keep it up!`,
        color: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-200',
      };
    }

    return {
      icon: Heart,
      title: 'Nice Start',
      message: `You've been consistent with ${activeCategories.join(', ')}. Small steps lead to big changes—you're on the right path!`,
      color: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-200',
    };
  };

  const getDailyQuote = () => {
    const quotes = [
      { quote: "Progress, not perfection. Every small step counts.", focus: "Be kind to yourself today" },
      { quote: "You are capable of more than you know. Trust the process.", focus: "Embrace the journey" },
      { quote: "Consistency is the bridge between goals and accomplishment.", focus: "Show up for yourself" },
      { quote: "Your only limit is you. Let's break through together.", focus: "Challenge yourself gently" },
      { quote: "Small daily improvements lead to stunning results over time.", focus: "Celebrate tiny wins" },
      { quote: "You don't have to be perfect to be amazing.", focus: "Progress over perfection" },
      { quote: "Every day is a fresh start. Make it count.", focus: "Start with one thing" },
      { quote: "Believe in yourself and all that you are working towards.", focus: "Trust your path" },
      { quote: "Your wellness journey is unique and beautiful.", focus: "Honor your pace" },
      { quote: "Self-care isn't selfish. It's essential.", focus: "Prioritize your needs" },
    ];

    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % quotes.length;
    return quotes[quoteIndex];
  };

  const quickActions = [
    {
      id: 'skincare',
      title: 'Skincare',
      description: '✨ Glow up time',
      icon: Droplet,
      color: 'from-pink-300 to-rose-300',
      streak: stats.skincareStreak,
    },
    {
      id: 'gym',
      title: 'Workout',
      description: '💪 Get moving',
      icon: Dumbbell,
      color: 'from-amber-300 to-orange-300',
      streak: stats.workoutStreak,
    },
    {
      id: 'journal',
      title: 'Journal',
      description: '📝 Daily reflection',
      icon: BookOpen,
      color: 'from-purple-300 to-pink-300',
      streak: stats.journalStreak,
    },
    {
      id: 'hobbies',
      title: 'Hobbies',
      description: '🎨 Creative time',
      icon: Heart,
      color: 'from-rose-300 to-pink-400',
      streak: stats.hobbyStreak,
    },
    {
      id: 'savings',
      title: 'Savings',
      description: '💰 Future you',
      icon: PiggyBank,
      color: 'from-emerald-300 to-teal-300',
      streak: 0,
    },
    {
      id: 'goals',
      title: 'Goals',
      description: '🎯 Dream big',
      icon: Target,
      color: 'from-blue-300 to-cyan-300',
      streak: 0,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className={`relative overflow-hidden bg-gradient-to-br ${getColorClasses().gradient} rounded-3xl shadow-xl p-8 md:p-12`}>
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${getColorClasses().light} opacity-30 rounded-full blur-3xl`} />
        <div className={`absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr ${getColorClasses().light} opacity-30 rounded-full blur-3xl`} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-6 w-6 text-pink-400" />
            <span className="text-pink-600 font-medium">{getGreeting()}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            {userName ? `Hey ${userName}!` : 'Welcome back!'}
          </h1>
          <p className="text-lg text-slate-600 mb-6">{getMotivation()}</p>

          {(stats.skincareStreak > 0 || stats.workoutStreak > 0 || stats.journalStreak > 0 || stats.hobbyStreak > 0) && (
            <div className="flex flex-wrap gap-3">
              {stats.skincareStreak > 0 && (
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <Droplet className="h-4 w-4 text-pink-400" />
                  <span className="text-sm font-medium text-slate-700">{stats.skincareStreak} day skincare streak</span>
                </div>
              )}
              {stats.workoutStreak > 0 && (
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <Dumbbell className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-slate-700">{stats.workoutStreak} day workout streak</span>
                </div>
              )}
              {stats.journalStreak > 0 && (
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <BookOpen className="h-4 w-4 text-purple-300" />
                  <span className="text-sm font-medium text-slate-700">{stats.journalStreak} day journal streak</span>
                </div>
              )}
              {stats.hobbyStreak > 0 && (
                <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow-sm">
                  <Heart className="h-4 w-4 text-rose-400" />
                  <span className="text-sm font-medium text-slate-700">{stats.hobbyStreak} day hobby streak</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {todayTasks.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-6 w-6 text-blue-500" />
                Today's Tasks
              </h2>
              <span className="text-sm text-slate-600">
                {todayTasks.filter(t => t.completed).length} of {todayTasks.length} completed
              </span>
            </div>
            <div className="space-y-3">
              {todayTasks.map((task) => {
              const getTaskIcon = () => {
                switch (task.type) {
                  case 'skincare': return Droplet;
                  case 'workout': return Dumbbell;
                  case 'journal': return BookOpen;
                  case 'hobby': return Heart;
                  case 'goal': return Target;
                  default: return Circle;
                }
              };
              const TaskIcon = getTaskIcon();
              const getTaskColor = () => {
                switch (task.type) {
                  case 'skincare': return 'text-pink-500 bg-pink-50';
                  case 'workout': return 'text-amber-500 bg-amber-50';
                  case 'journal': return 'text-purple-500 bg-purple-50';
                  case 'hobby': return 'text-rose-500 bg-rose-50';
                  case 'goal': return 'text-blue-500 bg-blue-50';
                  default: return 'text-slate-500 bg-slate-50';
                }
              };

              return (
                <button
                  key={task.id}
                  onClick={() => onViewChange(task.type)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md group ${
                    task.completed
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 animate-pulse-once'
                      : 'bg-gradient-to-r from-white to-slate-50 border-slate-200 hover:border-blue-300 hover:scale-[1.02]'
                  }`}
                >
                  <div className={`flex-shrink-0 p-2 rounded-lg transition-transform duration-300 group-hover:scale-110 ${getTaskColor()}`}>
                    <TaskIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold transition-all duration-300 ${task.completed ? 'text-slate-600 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </h3>
                      {task.time && (
                        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
                          {task.time}
                        </span>
                      )}
                    </div>
                    {task.details && (
                      <p className="text-sm text-slate-500 mt-1">{task.details}</p>
                    )}
                  </div>
                  {task.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 animate-bounce-in" />
                  ) : (
                    <Circle className="h-6 w-6 text-slate-300 flex-shrink-0 group-hover:text-blue-400 transition-colors" />
                  )}
                </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className={`bg-gradient-to-br ${getColorClasses().gradient} rounded-2xl shadow-lg p-6 border-2 ${getColorClasses().border}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white shadow-md">
            <Quote className="h-7 w-7 text-purple-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Today's Focus</h3>
            </div>
            <p className="text-lg font-medium text-slate-900 mb-2 italic">"{getDailyQuote().quote}"</p>
            <p className="text-sm text-purple-600 font-medium">{getDailyQuote().focus}</p>
          </div>
        </div>
      </div>

      <div className={`relative bg-gradient-to-br ${getWeeklyReflection().color} rounded-2xl shadow-lg p-6 border-2 ${getWeeklyReflection().borderColor}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-white shadow-md`}>
            {(() => {
              const ReflectionIcon = getWeeklyReflection().icon;
              return <ReflectionIcon className="h-7 w-7 text-slate-700" />;
            })()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{getWeeklyReflection().title}</h3>
            <p className="text-slate-700 leading-relaxed">{getWeeklyReflection().message}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">What would you like to do today?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const progress = Math.min((action.streak / 7) * 100, 100);
            const colorMap: Record<string, string> = {
              'from-pink-300 to-rose-300': '#ec4899',
              'from-amber-300 to-orange-300': '#f59e0b',
              'from-purple-300 to-pink-300': '#a855f7',
              'from-rose-300 to-pink-400': '#f43f5e',
              'from-emerald-300 to-teal-300': '#10b981',
              'from-blue-300 to-cyan-300': '#3b82f6',
            };
            const ringColor = colorMap[action.color] || '#a855f7';

            return (
              <button
                key={action.id}
                onClick={() => onViewChange(action.id)}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 p-6"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative z-10">
                  <div className="relative inline-block mb-3">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ProgressRing progress={progress} size={60} strokeWidth={4} color={ringColor} />
                    </div>
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.color} shadow-lg group-hover:bg-white/20 transition-all duration-300 relative z-10`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {action.streak > 0 && (
                    <div className="absolute top-0 right-0 flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                      <TrendingUp className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-bold text-amber-600">{action.streak}</span>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-white transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-600 group-hover:text-white/90 transition-colors">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
