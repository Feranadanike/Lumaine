import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Award, Zap, Sparkles, X, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface InsightsData {
  totalWorkouts: number;
  totalJournalEntries: number;
  totalSkincareRoutines: number;
  totalHobbyLogs: number;
  averageMood: number;
  savingsTotal: number;
  streakDays: number;
}

interface DailyActivity {
  date: string;
  count: number;
  types: string[];
}

interface WeeklyData {
  week: string;
  workouts: number;
  skincare: number;
  journal: number;
  hobbies: number;
}

export default function Insights() {
  const { user } = useAuth();
  const [data, setData] = useState<InsightsData>({
    totalWorkouts: 0,
    totalJournalEntries: 0,
    totalSkincareRoutines: 0,
    totalHobbyLogs: 0,
    averageMood: 0,
    savingsTotal: 0,
    streakDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);

  useEffect(() => {
    if (user) {
      loadInsights();
      loadActivityData();
    }
  }, [user]);

  const loadInsights = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateFilter = thirtyDaysAgo.toISOString().split('T')[0];

      const [workouts, journal, skincare, hobbies, goals] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .gte('workout_date', dateFilter),
        supabase
          .from('journal_entries')
          .select('mood_score')
          .eq('user_id', user?.id)
          .gte('entry_date', dateFilter),
        supabase
          .from('skincare_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .gte('log_date', dateFilter),
        supabase
          .from('hobby_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user?.id)
          .gte('log_date', dateFilter),
        supabase.from('savings_goals').select('current_amount').eq('user_id', user?.id),
      ]);

      const avgMood =
        journal.data && journal.data.length > 0
          ? journal.data.reduce((sum, entry) => sum + (entry.mood_score || 0), 0) / journal.data.length
          : 0;

      const totalSavings =
        goals.data?.reduce((sum, goal) => sum + parseFloat(goal.current_amount.toString()), 0) || 0;

      setData({
        totalWorkouts: workouts.count || 0,
        totalJournalEntries: journal.data?.length || 0,
        totalSkincareRoutines: skincare.count || 0,
        totalHobbyLogs: hobbies.count || 0,
        averageMood: avgMood,
        savingsTotal: totalSavings,
        streakDays: 0,
      });
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityData = async () => {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

      const [workouts, skincare, journal, hobbies] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('workout_date')
          .eq('user_id', user?.id)
          .gte('workout_date', dateFilter)
          .order('workout_date', { ascending: true }),
        supabase
          .from('skincare_logs')
          .select('log_date')
          .eq('user_id', user?.id)
          .gte('log_date', dateFilter)
          .order('log_date', { ascending: true }),
        supabase
          .from('journal_entries')
          .select('entry_date')
          .eq('user_id', user?.id)
          .gte('entry_date', dateFilter)
          .order('entry_date', { ascending: true }),
        supabase
          .from('hobby_logs')
          .select('log_date')
          .eq('user_id', user?.id)
          .gte('log_date', dateFilter)
          .order('log_date', { ascending: true })
      ]);

      const activityMap = new Map<string, DailyActivity>();
      const processActivities = (data: any[], dateField: string, type: string) => {
        data.forEach((item) => {
          const date = item[dateField];
          if (!activityMap.has(date)) {
            activityMap.set(date, { date, count: 0, types: [] });
          }
          const activity = activityMap.get(date)!;
          activity.count++;
          if (!activity.types.includes(type)) {
            activity.types.push(type);
          }
        });
      };

      processActivities(workouts.data || [], 'workout_date', 'workout');
      processActivities(skincare.data || [], 'log_date', 'skincare');
      processActivities(journal.data || [], 'entry_date', 'journal');
      processActivities(hobbies.data || [], 'log_date', 'hobby');

      const activities = Array.from(activityMap.values()).sort((a, b) => a.date.localeCompare(b.date));
      setDailyActivities(activities);

      const weeklyMap = new Map<string, WeeklyData>();
      const getWeekKey = (dateStr: string) => {
        const date = new Date(dateStr);
        const startOfWeek = new Date(date);
        const day = date.getDay();
        const diff = day === 0 ? 6 : day - 1;
        startOfWeek.setDate(date.getDate() - diff);
        return startOfWeek.toISOString().split('T')[0];
      };

      (workouts.data || []).forEach((item: any) => {
        const week = getWeekKey(item.workout_date);
        if (!weeklyMap.has(week)) {
          weeklyMap.set(week, { week, workouts: 0, skincare: 0, journal: 0, hobbies: 0 });
        }
        weeklyMap.get(week)!.workouts++;
      });

      (skincare.data || []).forEach((item: any) => {
        const week = getWeekKey(item.log_date);
        if (!weeklyMap.has(week)) {
          weeklyMap.set(week, { week, workouts: 0, skincare: 0, journal: 0, hobbies: 0 });
        }
        weeklyMap.get(week)!.skincare++;
      });

      (journal.data || []).forEach((item: any) => {
        const week = getWeekKey(item.entry_date);
        if (!weeklyMap.has(week)) {
          weeklyMap.set(week, { week, workouts: 0, skincare: 0, journal: 0, hobbies: 0 });
        }
        weeklyMap.get(week)!.journal++;
      });

      (hobbies.data || []).forEach((item: any) => {
        const week = getWeekKey(item.log_date);
        if (!weeklyMap.has(week)) {
          weeklyMap.set(week, { week, workouts: 0, skincare: 0, journal: 0, hobbies: 0 });
        }
        weeklyMap.get(week)!.hobbies++;
      });

      const weekly = Array.from(weeklyMap.values())
        .sort((a, b) => a.week.localeCompare(b.week))
        .slice(-12);
      setWeeklyData(weekly);
    } catch (error) {
      console.error('Error loading activity data:', error);
    }
  };

  const handleGenerateWeeklySummary = async () => {
    if (!user) return;

    setGeneratingAI(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/weekly-summary`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workouts: data.totalWorkouts,
            journalEntries: data.totalJournalEntries,
            skincareRoutines: data.totalSkincareRoutines,
            hobbyLogs: data.totalHobbyLogs,
            averageMood: data.averageMood,
            achievements: [],
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to generate summary');

      const result = await response.json();
      setAiSummary(result);
      setShowAISummary(true);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate weekly summary');
    } finally {
      setGeneratingAI(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  const stats = [
    {
      label: 'Workouts',
      value: data.totalWorkouts,
      icon: TrendingUp,
      color: 'from-orange-500 to-red-500',
      textColor: 'text-orange-600',
    },
    {
      label: 'Journal Entries',
      value: data.totalJournalEntries,
      icon: Award,
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-600',
    },
    {
      label: 'Skincare Routines',
      value: data.totalSkincareRoutines,
      icon: Zap,
      color: 'from-cyan-500 to-blue-500',
      textColor: 'text-cyan-600',
    },
    {
      label: 'Hobby Sessions',
      value: data.totalHobbyLogs,
      icon: Award,
      color: 'from-rose-500 to-pink-500',
      textColor: 'text-rose-600',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Insights
          </h1>
          <p className="text-slate-600 mt-1">Your progress over the last 30 days</p>
        </div>
        <button
          onClick={handleGenerateWeeklySummary}
          disabled={generatingAI}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white px-6 py-3 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors shadow-lg disabled:opacity-50"
        >
          <Sparkles className="h-5 w-5" />
          {generatingAI ? 'Generating...' : 'AI Weekly Summary'}
        </button>
      </div>

      {showAISummary && aiSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Your Week in Review</h2>
              <button onClick={() => setShowAISummary(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-line text-slate-700 leading-relaxed">
                {aiSummary.summary}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl shadow-lg p-6">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} mb-4`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
              <p className="text-sm text-slate-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Average Mood</h2>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-slate-900">{data.averageMood.toFixed(1)}</div>
            <div className="text-slate-600">
              <p className="text-sm">out of 5.0</p>
              <p className="text-xs mt-1">
                {data.averageMood >= 4
                  ? 'Feeling great!'
                  : data.averageMood >= 3
                  ? 'Doing well'
                  : 'Keep going!'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Total Savings</h2>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-green-600">${data.savingsTotal.toFixed(0)}</div>
            <div className="text-slate-600">
              <p className="text-sm">across all goals</p>
              <p className="text-xs mt-1">Keep saving!</p>
            </div>
          </div>
        </div>
      </div>

      {weeklyData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Weekly Activity Trends</h2>
          <div className="space-y-4">
            {weeklyData.map((week, index) => {
              const maxValue = Math.max(
                ...weeklyData.map(w => w.workouts + w.skincare + w.journal + w.hobbies)
              );
              const total = week.workouts + week.skincare + week.journal + week.hobbies;
              const percentage = (total / maxValue) * 100;
              const weekDate = new Date(week.week);
              const weekLabel = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Week of {weekLabel}</span>
                    <span className="text-slate-600">{total} activities</span>
                  </div>
                  <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-rose-400 to-pink-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-slate-700">
                      {week.workouts > 0 && <span className="mr-3">💪 {week.workouts}</span>}
                      {week.skincare > 0 && <span className="mr-3">✨ {week.skincare}</span>}
                      {week.journal > 0 && <span className="mr-3">📝 {week.journal}</span>}
                      {week.hobbies > 0 && <span className="mr-3">🎨 {week.hobbies}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {dailyActivities.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-bold text-slate-900">Activity Heat Map</h2>
            <span className="text-sm text-slate-500 ml-auto">Last 90 days</span>
          </div>
          <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-18 gap-1.5">
            {Array.from({ length: 90 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - (89 - i));
              const dateStr = date.toISOString().split('T')[0];
              const activity = dailyActivities.find(a => a.date === dateStr);
              const count = activity?.count || 0;
              const intensity = count === 0 ? 'bg-slate-100' :
                              count === 1 ? 'bg-green-200' :
                              count === 2 ? 'bg-green-300' :
                              count === 3 ? 'bg-green-400' :
                              'bg-green-500';
              const dayLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-sm ${intensity} hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer group relative`}
                  title={`${dayLabel}: ${count} activities`}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {dayLabel}: {count} {count === 1 ? 'activity' : 'activities'}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-6 text-xs text-slate-600">
            <span>Less active</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-slate-100 rounded-sm"></div>
              <div className="w-4 h-4 bg-green-200 rounded-sm"></div>
              <div className="w-4 h-4 bg-green-300 rounded-sm"></div>
              <div className="w-4 h-4 bg-green-400 rounded-sm"></div>
              <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
            </div>
            <span>More active</span>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-rose-400 to-pink-400 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">You're doing amazing!</h2>
        <p className="text-rose-50">
          Keep up the great work tracking your journey. Consistency is key to reaching your goals.
        </p>
      </div>
    </div>
  );
}
