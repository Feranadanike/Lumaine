import { useEffect, useState } from 'react';
import { TrendingUp, Activity, Target, Calendar, BarChart3, Zap, Award, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AnalyticsData {
  weeklyStats: {
    workouts: number;
    skincare: number;
    hobbies: number;
    journal: number;
  };
  monthlyStats: {
    workouts: number;
    skincare: number;
    hobbies: number;
    journal: number;
  };
  completionRates: {
    workout: number;
    skincare: number;
    hobby: number;
    journal: number;
  };
  totalActivities: number;
  weeklyGoal: number;
  streaks: {
    current: number;
    longest: number;
  };
}

export default function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    weeklyStats: { workouts: 0, skincare: 0, hobbies: 0, journal: 0 },
    monthlyStats: { workouts: 0, skincare: 0, hobbies: 0, journal: 0 },
    completionRates: { workout: 0, skincare: 0, hobby: 0, journal: 0 },
    totalActivities: 0,
    weeklyGoal: 14,
    streaks: { current: 0, longest: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    try {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const monthAgoStr = monthAgo.toISOString().split('T')[0];

      const [
        weekWorkouts,
        weekSkincare,
        weekHobbies,
        weekJournal,
        monthWorkouts,
        monthSkincare,
        monthHobbies,
        monthJournal,
        allWorkouts,
        allSkincare,
        allHobbies,
        allJournal
      ] = await Promise.all([
        supabase.from('workout_sessions').select('id').eq('user_id', user?.id).gte('workout_date', weekAgoStr),
        supabase.from('skincare_logs').select('id').eq('user_id', user?.id).gte('log_date', weekAgoStr),
        supabase.from('hobby_logs').select('id').eq('user_id', user?.id).gte('log_date', weekAgoStr),
        supabase.from('journal_entries').select('id').eq('user_id', user?.id).gte('entry_date', weekAgoStr),
        supabase.from('workout_sessions').select('id').eq('user_id', user?.id).gte('workout_date', monthAgoStr),
        supabase.from('skincare_logs').select('id').eq('user_id', user?.id).gte('log_date', monthAgoStr),
        supabase.from('hobby_logs').select('id').eq('user_id', user?.id).gte('log_date', monthAgoStr),
        supabase.from('journal_entries').select('id').eq('user_id', user?.id).gte('entry_date', monthAgoStr),
        supabase.from('workout_sessions').select('workout_date').eq('user_id', user?.id).order('workout_date', { ascending: false }),
        supabase.from('skincare_logs').select('log_date').eq('user_id', user?.id).order('log_date', { ascending: false }),
        supabase.from('hobby_logs').select('log_date').eq('user_id', user?.id).order('log_date', { ascending: false }),
        supabase.from('journal_entries').select('entry_date').eq('user_id', user?.id).order('entry_date', { ascending: false })
      ]);

      const weeklyTotal = (weekWorkouts.data?.length || 0) + (weekSkincare.data?.length || 0) +
                         (weekHobbies.data?.length || 0) + (weekJournal.data?.length || 0);

      const allDates = [
        ...(allWorkouts.data?.map(w => w.workout_date) || []),
        ...(allSkincare.data?.map(s => s.log_date) || []),
        ...(allHobbies.data?.map(h => h.log_date) || []),
        ...(allJournal.data?.map(j => j.entry_date) || [])
      ].sort().reverse();

      const currentStreak = calculateCurrentStreak(allDates);
      const longestStreak = calculateLongestStreak(allDates);

      setAnalytics({
        weeklyStats: {
          workouts: weekWorkouts.data?.length || 0,
          skincare: weekSkincare.data?.length || 0,
          hobbies: weekHobbies.data?.length || 0,
          journal: weekJournal.data?.length || 0
        },
        monthlyStats: {
          workouts: monthWorkouts.data?.length || 0,
          skincare: monthSkincare.data?.length || 0,
          hobbies: monthHobbies.data?.length || 0,
          journal: monthJournal.data?.length || 0
        },
        completionRates: {
          workout: calculateCompletionRate(weekWorkouts.data?.length || 0, 7),
          skincare: calculateCompletionRate(weekSkincare.data?.length || 0, 7),
          hobby: calculateCompletionRate(weekHobbies.data?.length || 0, 7),
          journal: calculateCompletionRate(weekJournal.data?.length || 0, 7)
        },
        totalActivities: weeklyTotal,
        weeklyGoal: 14,
        streaks: {
          current: currentStreak,
          longest: longestStreak
        }
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = (completed: number, expected: number) => {
    return Math.round((completed / expected) * 100);
  };

  const calculateCurrentStreak = (dates: string[]) => {
    if (dates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const date = new Date(dates[i]);
      date.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);

      if (date.getTime() === expectedDate.getTime()) {
        streak++;
      } else if (date.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const calculateLongestStreak = (dates: string[]) => {
    if (dates.length === 0) return 0;

    let maxStreak = 0;
    let currentStreak = 1;

    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }

    return Math.max(maxStreak, currentStreak);
  };

  const stats = timeRange === 'week' ? analytics.weeklyStats : analytics.monthlyStats;
  const maxValue = Math.max(stats.workouts, stats.skincare, stats.hobbies, stats.journal, 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 rounded-3xl shadow-xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-white rounded-xl shadow-md">
            <BarChart3 className="h-7 w-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Analytics Dashboard</h1>
            <p className="text-slate-600 text-sm md:text-base">Track your progress and insights</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTimeRange('week')}
          className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
            timeRange === 'week'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${
            timeRange === 'month'
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-blue-300'
          }`}
        >
          Last 30 Days
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-4 md:p-6 border-2 border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-slate-700 text-sm md:text-base">Total Activities</h3>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-slate-900">{analytics.totalActivities}</p>
          <p className="text-xs md:text-sm text-slate-600 mt-1">This week</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-4 md:p-6 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-slate-700 text-sm md:text-base">Current Streak</h3>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-slate-900">{analytics.streaks.current}</p>
          <p className="text-xs md:text-sm text-slate-600 mt-1">Days in a row</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-4 md:p-6 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-slate-700 text-sm md:text-base">Longest Streak</h3>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-slate-900">{analytics.streaks.longest}</p>
          <p className="text-xs md:text-sm text-slate-600 mt-1">Personal best</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-4 md:p-6 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-slate-700 text-sm md:text-base">Weekly Goal</h3>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-slate-900">
            {Math.round((analytics.totalActivities / analytics.weeklyGoal) * 100)}%
          </p>
          <p className="text-xs md:text-sm text-slate-600 mt-1">{analytics.totalActivities} / {analytics.weeklyGoal}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Activity Breakdown</h2>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="font-medium text-slate-700 text-sm md:text-base">Workouts</span>
              </div>
              <span className="text-lg md:text-xl font-bold text-slate-900">{stats.workouts}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(stats.workouts / maxValue) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span className="font-medium text-slate-700 text-sm md:text-base">Skincare</span>
              </div>
              <span className="text-lg md:text-xl font-bold text-slate-900">{stats.skincare}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-pink-400 to-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(stats.skincare / maxValue) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                <span className="font-medium text-slate-700 text-sm md:text-base">Hobbies</span>
              </div>
              <span className="text-lg md:text-xl font-bold text-slate-900">{stats.hobbies}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-rose-400 to-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(stats.hobbies / maxValue) * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="font-medium text-slate-700 text-sm md:text-base">Journal</span>
              </div>
              <span className="text-lg md:text-xl font-bold text-slate-900">{stats.journal}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 md:h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-400 to-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${(stats.journal / maxValue) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">Completion Rates</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
            <p className="text-3xl md:text-4xl font-bold text-amber-600">{analytics.completionRates.workout}%</p>
            <p className="text-xs md:text-sm text-slate-600 mt-1">Workouts</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border-2 border-pink-200">
            <p className="text-3xl md:text-4xl font-bold text-pink-600">{analytics.completionRates.skincare}%</p>
            <p className="text-xs md:text-sm text-slate-600 mt-1">Skincare</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl border-2 border-rose-200">
            <p className="text-3xl md:text-4xl font-bold text-rose-600">{analytics.completionRates.hobby}%</p>
            <p className="text-xs md:text-sm text-slate-600 mt-1">Hobbies</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <p className="text-3xl md:text-4xl font-bold text-purple-600">{analytics.completionRates.journal}%</p>
            <p className="text-xs md:text-sm text-slate-600 mt-1">Journal</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-4 md:p-6 border-2 border-green-200">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-white rounded-xl shadow-md">
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-2">Consistency Insights</h3>
            <p className="text-sm md:text-base text-slate-700 leading-relaxed">
              {analytics.streaks.current > 0
                ? `Amazing! You're on a ${analytics.streaks.current}-day streak. Keep the momentum going!`
                : 'Start your streak today! Even one small activity makes a difference.'}
            </p>
            {analytics.streaks.longest > analytics.streaks.current && (
              <p className="text-sm md:text-base text-slate-600 mt-2">
                Your personal best is {analytics.streaks.longest} days. You can beat it!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
