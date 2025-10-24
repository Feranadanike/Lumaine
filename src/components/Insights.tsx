import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Award, Sparkles, X, Calendar } from 'lucide-react';
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

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Insights
          </h1>
          <p className="text-slate-600 mt-1">Deep dive into your wellness patterns</p>
        </div>
        <button
          onClick={handleGenerateWeeklySummary}
          disabled={generatingAI}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white px-6 py-3 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-colors shadow-lg disabled:opacity-50"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 md:p-8 border-2 border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white rounded-xl shadow-md">
              <Sparkles className="h-6 w-6 text-purple-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Mood Tracker</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-5xl md:text-6xl font-bold text-purple-600">{data.averageMood.toFixed(1)}</div>
            <div className="text-slate-700">
              <p className="text-base font-medium">out of 5.0</p>
              <p className="text-sm mt-2 font-semibold">
                {data.averageMood >= 4
                  ? '🌟 Feeling great!'
                  : data.averageMood >= 3
                  ? '😊 Doing well'
                  : '💪 Keep going!'}
              </p>
              <p className="text-xs mt-1 text-slate-600">Last 30 days average</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 md:p-8 border-2 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white rounded-xl shadow-md">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Total Savings</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-5xl md:text-6xl font-bold text-green-600">${data.savingsTotal.toFixed(0)}</div>
            <div className="text-slate-700">
              <p className="text-base font-medium">across all goals</p>
              <p className="text-sm mt-2 font-semibold">💰 Keep saving!</p>
              <p className="text-xs mt-1 text-slate-600">Your financial progress</p>
            </div>
          </div>
        </div>
      </div>

      {dailyActivities.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Activity Heat Map</h2>
            <span className="text-sm text-slate-500 sm:ml-auto">Last 90 days</span>
          </div>
          <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-18 lg:grid-cols-20 gap-1 md:gap-1.5">
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

      <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg p-6 md:p-8 text-white">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
            <Award className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-2">Keep Growing!</h2>
            <p className="text-blue-50 leading-relaxed">
              The heat map shows your consistency journey. Each square represents your commitment to growth. Check Analytics for detailed breakdowns!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
