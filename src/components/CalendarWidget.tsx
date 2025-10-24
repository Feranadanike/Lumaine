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
  { id: 'journal', name: 'Write Journal', icon: BookOpen, color: 'bg-amber-500' },
  { id: 'mooddiary', name: 'Log Mood', icon: Smile, color: 'bg-pink-500' },
  { id: 'planner', name: 'Plan Tasks', icon: CalendarCheck, color: 'bg-blue-500' },
  { id: 'gym', name: 'Schedule Workout', icon: Dumbbell, color: 'bg-red-500' },
  { id: 'mealprep', name: 'Plan Meals', icon: ChefHat, color: 'bg-green-500' },
  { id: 'skincare', name: 'Log Skincare', icon: Droplet, color: 'bg-cyan-500' },
  { id: 'goals', name: 'Set Goal', icon: Target, color: 'bg-purple-500' },
  { id: 'notes', name: 'Quick Note', icon: FileText, color: 'bg-slate-500' },
];

export default function CalendarWidget({ onDateAction }: CalendarWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({});
  const [todayActivityCount, setTodayActivityCount] = useState(0);
  const { user } = useAuth();
  const { accentColor } = useTheme();

  const getColorClasses = (type: 'bg' | 'text' | 'hover' | 'border' | 'ring') => {
    const colorMap: Record<string, Record<string, string>> = {
      rose: { bg: 'bg-rose-500', text: 'text-rose-600', hover: 'hover:bg-rose-100', border: 'border-rose-500', ring: 'ring-rose-500' },
      pink: { bg: 'bg-pink-500', text: 'text-pink-600', hover: 'hover:bg-pink-100', border: 'border-pink-500', ring: 'ring-pink-500' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-600', hover: 'hover:bg-purple-100', border: 'border-purple-500', ring: 'ring-purple-500' },
      blue: { bg: 'bg-blue-500', text: 'text-blue-600', hover: 'hover:bg-blue-100', border: 'border-blue-500', ring: 'ring-blue-500' },
      cyan: { bg: 'bg-cyan-500', text: 'text-cyan-600', hover: 'hover:bg-cyan-100', border: 'border-cyan-500', ring: 'ring-cyan-500' },
      teal: { bg: 'bg-teal-500', text: 'text-teal-600', hover: 'hover:bg-teal-100', border: 'border-teal-500', ring: 'ring-teal-500' },
      green: { bg: 'bg-green-500', text: 'text-green-600', hover: 'hover:bg-green-100', border: 'border-green-500', ring: 'ring-green-500' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-600', hover: 'hover:bg-amber-100', border: 'border-amber-500', ring: 'ring-amber-500' },
      emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', hover: 'hover:bg-emerald-100', border: 'border-emerald-500', ring: 'ring-emerald-500' },
      indigo: { bg: 'bg-indigo-500', text: 'text-indigo-600', hover: 'hover:bg-indigo-100', border: 'border-indigo-500', ring: 'ring-indigo-500' },
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

  const getTotalActivitiesForDate = (date: string) => {
    const activities = getDateActivities(date);
    if (!activities) return 0;
    return Object.values(activities).reduce((sum, count) => sum + count, 0);
  };

  const renderActivitySummary = () => {
    if (!selectedDate) return null;
    const activities = getDateActivities(selectedDate);
    if (!activities) return null;

    const items = [];
    if (activities.journal > 0) items.push(`${activities.journal} Journal ${activities.journal === 1 ? 'entry' : 'entries'}`);
    if (activities.mood > 0) items.push(`${activities.mood} Mood ${activities.mood === 1 ? 'entry' : 'entries'}`);
    if (activities.tasks > 0) items.push(`${activities.tasks} ${activities.tasks === 1 ? 'Task' : 'Tasks'} planned`);
    if (activities.workouts > 0) items.push(`${activities.workouts} ${activities.workouts === 1 ? 'Workout' : 'Workouts'}`);
    if (activities.meals > 0) items.push(`${activities.meals} ${activities.meals === 1 ? 'Meal' : 'Meals'} planned`);
    if (activities.skincare > 0) items.push(`${activities.skincare} Skincare ${activities.skincare === 1 ? 'log' : 'logs'}`);
    if (activities.goals > 0) items.push(`${activities.goals} ${activities.goals === 1 ? 'Goal' : 'Goals'}`);
    if (activities.notes > 0) items.push(`${activities.notes} ${activities.notes === 1 ? 'Note' : 'Notes'}`);

    if (items.length === 0) return null;

    return (
      <div className="mt-6 pt-6 border-t border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Already Scheduled:</h4>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center text-sm text-slate-600">
              <div className={`w-2 h-2 rounded-full ${getColorClasses('bg')} mr-3`}></div>
              {item}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2.5 rounded-xl transition-all duration-200 ${getColorClasses('hover')} ${getColorClasses('text')}`}
      >
        <Calendar className="h-6 w-6" />
        {todayActivityCount > 0 && (
          <span className={`absolute -top-1 -right-1 ${getColorClasses('bg')} text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center`}>
            {todayActivityCount > 9 ? '9+' : todayActivityCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r ${getColorClasses('bg')} bg-opacity-5`}>
              <h2 className="text-2xl font-bold text-slate-900">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setSelectedDate(null);
                }}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePreviousMonth}
                  className={`p-2 rounded-lg ${getColorClasses('hover')} ${getColorClasses('text')} transition-colors`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className={`p-2 rounded-lg ${getColorClasses('hover')} ${getColorClasses('text')} transition-colors`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth().map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square"></div>;
                  }

                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === new Date().toISOString().split('T')[0];
                  const isSelected = dateStr === selectedDate;
                  const hasActivity = hasActivities(day);

                  return (
                    <button
                      key={day}
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all duration-200 relative ${
                        isSelected
                          ? `${getColorClasses('bg')} text-white shadow-lg ring-2 ${getColorClasses('ring')}`
                          : isToday
                          ? `${getColorClasses('border')} border-2 ${getColorClasses('text')} hover:bg-opacity-10`
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {day}
                      {hasActivity && !isSelected && (
                        <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full ${getColorClasses('bg')}`}></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    What would you like to do on {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}?
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {actionOptions.map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          onClick={() => handleAction(action.id)}
                          className={`flex items-center p-4 rounded-xl border-2 border-transparent hover:border-slate-200 bg-slate-50 hover:bg-white transition-all duration-200 shadow-sm hover:shadow-md`}
                        >
                          <div className={`${action.color} p-2 rounded-lg mr-3`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{action.name}</span>
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
