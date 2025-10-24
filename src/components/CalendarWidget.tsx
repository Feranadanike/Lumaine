import { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Smile,
  CalendarCheck,
  Dumbbell,
  ChefHat,
  Droplet,
  Target,
  FileText,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface CalendarWidgetProps {
  onDateAction: (action: string, date: string) => void;
}

interface DateActivity {
  journal: number;
  mood: number;
  tasks: number;
  workouts: number;
  meals: number;
  skincare: number;
  goals: number;
  notes: number;
}

interface ActivitySummary {
  [date: string]: DateActivity;
}

const actionOptions = [
  { id: 'journal', name: 'Write Journal', icon: BookOpen, gradient: 'from-amber-400 to-orange-500' },
  { id: 'mooddiary', name: 'Log Mood', icon: Smile, gradient: 'from-pink-400 to-rose-500' },
  { id: 'planner', name: 'Plan Tasks', icon: CalendarCheck, gradient: 'from-blue-400 to-indigo-500' },
  { id: 'gym', name: 'Schedule Workout', icon: Dumbbell, gradient: 'from-red-400 to-pink-500' },
  { id: 'mealprep', name: 'Plan Meals', icon: ChefHat, gradient: 'from-green-400 to-emerald-500' },
  { id: 'skincare', name: 'Log Skincare', icon: Droplet, gradient: 'from-cyan-400 to-blue-500' },
  { id: 'goals', name: 'Set Goal', icon: Target, gradient: 'from-purple-400 to-violet-500' },
  { id: 'notes', name: 'Quick Note', icon: FileText, gradient: 'from-slate-400 to-slate-600' },
];

export default function CalendarWidget({ onDateAction }: CalendarWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({});
  const [todayActivityCount, setTodayActivityCount] = useState(0);
  const { user } = useAuth();
  const { accentColor } = useTheme();

  const getColorClasses = (type: 'bg' | 'text' | 'hover' | 'border' | 'ring' | 'from' | 'to') => {
    const colorMap: Record<string, Record<string, string>> = {
      rose: { bg: 'bg-rose-500', text: 'text-rose-600', hover: 'hover:bg-rose-100', border: 'border-rose-500', ring: 'ring-rose-500', from: 'from-rose-400', to: 'to-pink-500' },
      pink: { bg: 'bg-pink-500', text: 'text-pink-600', hover: 'hover:bg-pink-100', border: 'border-pink-500', ring: 'ring-pink-500', from: 'from-pink-400', to: 'to-pink-600' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', hover: 'hover:bg-purple-100', border: 'border-purple-500', ring: 'ring-purple-500', from: 'from-purple-400', to: 'to-purple-600' },
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', hover: 'hover:bg-blue-100', border: 'border-blue-500', ring: 'ring-blue-500', from: 'from-blue-400', to: 'to-blue-600' },
      cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', hover: 'hover:bg-cyan-100', border: 'border-cyan-500', ring: 'ring-cyan-500', from: 'from-cyan-400', to: 'to-cyan-600' },
      teal: { bg: 'bg-teal-500', text: 'text-teal-600', hover: 'hover:bg-teal-100', border: 'border-teal-500', ring: 'ring-teal-500', from: 'from-teal-400', to: 'to-teal-600' },
      green: { bg: 'bg-green-500', text: 'text-green-600', hover: 'hover:bg-green-100', border: 'border-green-500', ring: 'ring-green-500', from: 'from-green-400', to: 'to-green-600' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-600', hover: 'hover:bg-amber-100', border: 'border-amber-500', ring: 'ring-amber-500', from: 'from-amber-400', to: 'to-amber-600' },
      emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', hover: 'hover:bg-emerald-100', border: 'border-emerald-500', ring: 'ring-emerald-500', from: 'from-emerald-400', to: 'to-emerald-600' },
      indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', hover: 'hover:bg-indigo-100', border: 'border-indigo-500', ring: 'ring-indigo-500', from: 'from-indigo-400', to: 'to-indigo-600' },
    };
    return colorMap[accentColor]?.[type] || colorMap.rose[type];
  };

  useEffect(() => {
    if (user && isOpen) {
      fetchActivityData();
    }
  }, [user, currentMonth, isOpen]);

  useEffect(() => {
    if (user) {
      fetchTodayActivityCount();
    }
  }, [user]);

  const fetchTodayActivityCount = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    let count = 0;

    try {
      const { count: journalCount } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('entry_date', today)
        .lt('entry_date', `${today}T23:59:59`);

      const { count: moodCount } = await supabase
        .from('mood_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', today)
        .lt('created_at', `${today}T23:59:59`);

      const { count: tasksCount } = await supabase
        .from('planner_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('task_date', today);

      count = (journalCount || 0) + (moodCount || 0) + (tasksCount || 0);
      setTodayActivityCount(count);
    } catch (error) {
      console.error('Error fetching today activity count:', error);
    }
  };

  const fetchActivityData = async () => {
    if (!user) return;

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];

    try {
      const [journals, moods, tasks, workouts, meals, skincare, goals, notes] = await Promise.all([
        supabase
          .from('journal_entries')
          .select('entry_date')
          .eq('user_id', user.id)
          .gte('entry_date', startDate)
          .lte('entry_date', endDate),
        supabase
          .from('mood_entries')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate),
        supabase
          .from('planner_tasks')
          .select('task_date')
          .eq('user_id', user.id)
          .gte('task_date', startDate)
          .lte('task_date', endDate),
        supabase
          .from('planned_workouts')
          .select('date')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('meal_plans')
          .select('date')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('skincare_logs')
          .select('logged_at')
          .eq('user_id', user.id)
          .gte('logged_at', startDate)
          .lte('logged_at', endDate),
        supabase
          .from('goals')
          .select('target_date')
          .eq('user_id', user.id)
          .gte('target_date', startDate)
          .lte('target_date', endDate),
        supabase
          .from('notes')
          .select('created_at')
          .eq('user_id', user.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate),
      ]);

      const summary: ActivitySummary = {};

      journals.data?.forEach(entry => {
        const date = entry.entry_date;
        if (!summary[date]) summary[date] = { journal: 0, mood: 0, tasks: 0, workouts: 0, meals: 0, skincare: 0, goals: 0, notes: 0 };
        summary[date].journal++;
      });

      moods.data?.forEach(entry => {
        const date = entry.created_at.split('T')[0];
        if (!summary[date]) summary[date] = { journal: 0, mood: 0, tasks: 0, workouts: 0, meals: 0, skincare: 0, goals: 0, notes: 0 };
        summary[date].mood++;
      });

      tasks.data?.forEach(entry => {
        const date = entry.task_date;
        if (!summary[date]) summary[date] = { journal: 0, mood: 0, tasks: 0, workouts: 0, meals: 0, skincare: 0, goals: 0, notes: 0 };
        summary[date].tasks++;
      });

      workouts.data?.forEach(entry => {
        const date = entry.date;
        if (!summary[date]) summary[date] = { journal: 0, mood: 0, tasks: 0, workouts: 0, meals: 0, skincare: 0, goals: 0, notes: 0 };
        summary[date].workouts++;
      });

      meals.data?.forEach(entry => {
        const date = entry.date;
        if (!summary[date]) summary[date] = { journal: 0, mood: 0, tasks: 0, workouts: 0, meals: 0, skincare: 0, goals: 0, notes: 0 };
        summary[date].meals++;
      });

      skincare.data?.forEach(entry => {
        const date = entry.logged_at.split('T')[0];
        if (!summary[date]) summary[date] = { journal: 0, mood: 0, tasks: 0, workouts: 0, meals: 0, skincare: 0, goals: 0, notes: 0 };
        summary[date].skincare++;
      });

      goals.data?.forEach(entry => {
        const date = entry.target_date;
        if (!summary[date]) summary[date] = { journal: 0, mood: 0, tasks: 0, workouts: 0, meals: 0, skincare: 0, goals: 0, notes: 0 };
        summary[date].goals++;
      });

      notes.data?.forEach(entry => {
        const date = entry.created_at.split('T')[0];
        if (!summary[date]) summary[date] = { journal: 0, mood: 0, tasks: 0, workouts: 0, meals: 0, skincare: 0, goals: 0, notes: 0 };
        summary[date].notes++;
      });

      setActivitySummary(summary);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  };

  const handleAction = (actionId: string) => {
    if (selectedDate) {
      onDateAction(actionId, selectedDate);
      setIsOpen(false);
      setSelectedDate(null);
    }
  };

  const getDateActivities = (date: string) => {
    return activitySummary[date];
  };

  const hasActivities = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const activities = getDateActivities(dateStr);
    return activities && Object.values(activities).some(count => count > 0);
  };

  const getActivityLevel = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const activities = getDateActivities(dateStr);
    if (!activities) return 0;
    const total = Object.values(activities).reduce((sum, count) => sum + count, 0);
    if (total >= 5) return 3;
    if (total >= 3) return 2;
    if (total >= 1) return 1;
    return 0;
  };

  const renderActivitySummary = () => {
    if (!selectedDate) return null;
    const activities = getDateActivities(selectedDate);
    if (!activities) return null;

    const items = [];
    if (activities.journal > 0) items.push({ text: `${activities.journal} Journal ${activities.journal === 1 ? 'entry' : 'entries'}`, color: 'text-amber-600' });
    if (activities.mood > 0) items.push({ text: `${activities.mood} Mood ${activities.mood === 1 ? 'entry' : 'entries'}`, color: 'text-pink-600' });
    if (activities.tasks > 0) items.push({ text: `${activities.tasks} ${activities.tasks === 1 ? 'Task' : 'Tasks'} planned`, color: 'text-blue-600' });
    if (activities.workouts > 0) items.push({ text: `${activities.workouts} ${activities.workouts === 1 ? 'Workout' : 'Workouts'}`, color: 'text-red-600' });
    if (activities.meals > 0) items.push({ text: `${activities.meals} ${activities.meals === 1 ? 'Meal' : 'Meals'} planned`, color: 'text-green-600' });
    if (activities.skincare > 0) items.push({ text: `${activities.skincare} Skincare ${activities.skincare === 1 ? 'log' : 'logs'}`, color: 'text-cyan-600' });
    if (activities.goals > 0) items.push({ text: `${activities.goals} ${activities.goals === 1 ? 'Goal' : 'Goals'}`, color: 'text-purple-600' });
    if (activities.notes > 0) items.push({ text: `${activities.notes} ${activities.notes === 1 ? 'Note' : 'Notes'}`, color: 'text-slate-600' });

    if (items.length === 0) return null;

    return (
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Already Scheduled:
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, index) => (
            <div key={index} className={`flex items-center text-xs font-medium ${item.color} bg-slate-50 px-3 py-2 rounded-lg`}>
              <div className={`w-1.5 h-1.5 rounded-full bg-current mr-2`}></div>
              {item.text}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${getColorClasses('hover')} ${getColorClasses('text')} group`}
      >
        <Calendar className="h-6 w-6 transition-transform group-hover:rotate-12" />
        {todayActivityCount > 0 && (
          <span className={`absolute -top-1 -right-1 bg-gradient-to-br ${getColorClasses('from')} ${getColorClasses('to')} text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse`}>
            {todayActivityCount > 9 ? '9+' : todayActivityCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`relative overflow-hidden bg-gradient-to-br ${getColorClasses('from')} ${getColorClasses('to')} p-8`}>
              <div className="absolute inset-0 bg-white opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
              <div className="relative flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                    {monthNames[currentMonth.getMonth()]}
                  </h2>
                  <p className="text-white/80 text-sm mt-1">{currentMonth.getFullYear()}</p>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedDate(null);
                  }}
                  className="text-white/80 hover:text-white transition-colors hover:rotate-90 duration-300 bg-white/10 backdrop-blur-sm p-2 rounded-full"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePreviousMonth}
                  className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses('from')} ${getColorClasses('to')} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-center">
                  <p className="text-sm text-slate-500">Navigate months</p>
                </div>
                <button
                  onClick={handleNextMonth}
                  className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses('from')} ${getColorClasses('to')} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-3 mb-3">
                {dayNames.map((day, i) => (
                  <div key={i} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3">
                {getDaysInMonth().map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square"></div>;
                  }

                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  const isSelected = dateStr === selectedDate;
                  const activityLevel = getActivityLevel(day);

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`
                        aspect-square rounded-2xl text-sm font-semibold transition-all duration-300 relative overflow-hidden
                        ${isSelected
                          ? `bg-gradient-to-br ${getColorClasses('from')} ${getColorClasses('to')} text-white shadow-2xl scale-110 z-10 ring-4 ${getColorClasses('ring')} ring-opacity-30`
                          : isToday
                          ? `bg-gradient-to-br ${getColorClasses('from')} ${getColorClasses('to')} bg-opacity-20 text-slate-900 border-2 ${getColorClasses('border')} hover:scale-105 shadow-lg`
                          : activityLevel > 0
                          ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 hover:scale-105 hover:shadow-lg border border-slate-200'
                          : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-105 border border-slate-100'
                        }
                      `}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        {day}
                      </div>
                      {activityLevel > 0 && !isSelected && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {[...Array(Math.min(activityLevel, 3))].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-1 rounded-full bg-gradient-to-br ${getColorClasses('from')} ${getColorClasses('to')}`}
                            ></div>
                          ))}
                        </div>
                      )}
                      {isToday && !isSelected && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="mt-8 animate-in slide-in-from-bottom duration-500">
                  <h3 className={`text-lg font-bold bg-gradient-to-r ${getColorClasses('from')} ${getColorClasses('to')} bg-clip-text text-transparent mb-4`}>
                    What would you like to do on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {actionOptions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleAction(action.id)}
                          style={{ animationDelay: `${index * 50}ms` }}
                          className={`group flex items-center p-4 rounded-2xl bg-gradient-to-br ${action.gradient} text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-4`}
                        >
                          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl mr-3 group-hover:rotate-12 transition-transform duration-300">
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-semibold">{action.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {renderActivitySummary()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
