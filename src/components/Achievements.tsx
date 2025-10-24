import { useEffect, useState } from 'react';
import { Award, Trophy, Star, Flame, Target as TargetIcon, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

export default function Achievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      const [workouts, skincare, journal, hobbies] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('workout_date')
          .eq('user_id', user?.id)
          .order('workout_date', { ascending: false })
          .limit(100),
        supabase
          .from('skincare_logs')
          .select('log_date')
          .eq('user_id', user?.id)
          .order('log_date', { ascending: false })
          .limit(100),
        supabase
          .from('journal_entries')
          .select('entry_date')
          .eq('user_id', user?.id)
          .order('entry_date', { ascending: false })
          .limit(100),
        supabase
          .from('hobby_logs')
          .select('log_date')
          .eq('user_id', user?.id)
          .order('log_date', { ascending: false })
          .limit(100)
      ]);

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

      const workoutStreak = calculateStreak(workouts.data || []);
      const skincareStreak = calculateStreak(skincare.data || []);
      const journalStreak = calculateStreak(journal.data || []);
      const hobbyStreak = calculateStreak(hobbies.data || []);
      const totalActivities = (workouts.data?.length || 0) + (skincare.data?.length || 0) + (journal.data?.length || 0) + (hobbies.data?.length || 0);

      const allAchievements: Achievement[] = [
        {
          id: 'first-step',
          title: 'First Steps',
          description: 'Log your first activity',
          icon: Star,
          color: 'from-blue-400 to-cyan-400',
          unlocked: totalActivities >= 1,
        },
        {
          id: 'week-warrior',
          title: 'Week Warrior',
          description: 'Maintain a 7-day streak',
          icon: Flame,
          color: 'from-orange-400 to-red-400',
          unlocked: Math.max(workoutStreak, skincareStreak, journalStreak, hobbyStreak) >= 7,
          progress: Math.max(workoutStreak, skincareStreak, journalStreak, hobbyStreak),
          target: 7,
        },
        {
          id: 'dedication',
          title: 'Dedicated',
          description: 'Maintain a 30-day streak',
          icon: Trophy,
          color: 'from-amber-400 to-yellow-400',
          unlocked: Math.max(workoutStreak, skincareStreak, journalStreak, hobbyStreak) >= 30,
          progress: Math.max(workoutStreak, skincareStreak, journalStreak, hobbyStreak),
          target: 30,
        },
        {
          id: 'century',
          title: 'Centurion',
          description: 'Log 100 total activities',
          icon: Award,
          color: 'from-purple-400 to-pink-400',
          unlocked: totalActivities >= 100,
          progress: totalActivities,
          target: 100,
        },
        {
          id: 'fifty',
          title: 'Half Century',
          description: 'Log 50 total activities',
          icon: TargetIcon,
          color: 'from-green-400 to-emerald-400',
          unlocked: totalActivities >= 50,
          progress: totalActivities,
          target: 50,
        },
        {
          id: 'consistent',
          title: 'Consistency King',
          description: 'Log activities for 14 consecutive days',
          icon: Zap,
          color: 'from-rose-400 to-pink-400',
          unlocked: Math.max(workoutStreak, skincareStreak, journalStreak, hobbyStreak) >= 14,
          progress: Math.max(workoutStreak, skincareStreak, journalStreak, hobbyStreak),
          target: 14,
        },
      ];

      allAchievements.sort((a, b) => {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        return 0;
      });

      setAchievements(allAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading achievements...</div>;
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="h-8 w-8 text-amber-500" />
          Achievements
        </h1>
        <p className="text-slate-600 mt-1">
          {unlockedCount} of {achievements.length} unlocked
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement) => {
          const Icon = achievement.icon;
          return (
            <div
              key={achievement.id}
              className={`relative overflow-hidden rounded-2xl shadow-lg p-6 transition-all ${
                achievement.unlocked
                  ? 'bg-white ring-2 ring-amber-400'
                  : 'bg-slate-100 opacity-75'
              }`}
            >
              {achievement.unlocked && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-200/30 to-yellow-200/30 rounded-full blur-3xl" />
              )}

              <div className="relative z-10">
                <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${achievement.color} mb-4 ${!achievement.unlocked && 'opacity-50'}`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>

                <h3 className={`text-xl font-bold mb-2 ${achievement.unlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                  {achievement.title}
                </h3>

                <p className={`text-sm ${achievement.unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                  {achievement.description}
                </p>

                {!achievement.unlocked && achievement.progress !== undefined && achievement.target !== undefined && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                      <span>Progress</span>
                      <span>{achievement.progress} / {achievement.target}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${achievement.color} transition-all duration-500`}
                        style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {achievement.unlocked && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-amber-100 px-3 py-1.5 rounded-full">
                    <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                    <span className="text-xs font-semibold text-amber-700">Unlocked!</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
