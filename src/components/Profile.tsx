import { useEffect, useState } from 'react';
import { User, Award, Trophy, Zap, Target, TrendingUp, Crown, Star, Flame, Calendar, Download, Palette, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  theme: string;
}

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  rarity: string;
  unlocked_at?: string;
  progress?: number;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { accentColor, font, updateTheme } = useTheme();
  const [selectedColor, setSelectedColor] = useState('purple');
  const [selectedFont, setSelectedFont] = useState('sans');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  useEffect(() => {
    setSelectedColor(accentColor);
    setSelectedFont(font);
  }, [accentColor, font]);

  const loadProfileData = async () => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            id: user?.id,
            display_name: user?.email?.split('@')[0],
            total_xp: 0,
            level: 1,
            current_streak: 0,
            longest_streak: 0,
          }])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
      } else {
        setProfile(profileData);
      }

      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user?.id);

      const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const unlocked = allAchievements?.filter(a => unlockedIds.has(a.id)) || [];

      setAchievements(allAchievements || []);
      setUnlockedAchievements(unlocked);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getXPForLevel = (level: number) => {
    return level * 100;
  };

  const getProgressToNextLevel = () => {
    if (!profile) return 0;
    const currentLevelXP = getXPForLevel(profile.level);
    const nextLevelXP = getXPForLevel(profile.level + 1);
    const xpInCurrentLevel = profile.total_xp - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    return (xpInCurrentLevel / xpNeededForLevel) * 100;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'from-slate-400 to-slate-500';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-amber-400 to-amber-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      trophy: Trophy,
      dumbbell: TrendingUp,
      flame: Flame,
      star: Star,
      'book-open': Award,
      'pen-tool': Award,
      brain: Award,
      sparkles: Star,
      droplet: TrendingUp,
      calendar: Calendar,
      zap: Zap,
      award: Award,
      crown: Crown,
      target: Target,
      'check-circle': Trophy,
      'trending-up': TrendingUp,
    };
    return icons[iconName] || Trophy;
  };

  const exportDataAsJSON = async () => {
    try {
      const [workouts, skincare, journal, hobbies, goals, savings] = await Promise.all([
        supabase.from('workout_sessions').select('*').eq('user_id', user?.id),
        supabase.from('skincare_logs').select('*').eq('user_id', user?.id),
        supabase.from('journal_entries').select('*').eq('user_id', user?.id),
        supabase.from('hobby_logs').select('*').eq('user_id', user?.id),
        supabase.from('goals').select('*').eq('user_id', user?.id),
        supabase.from('savings_goals').select('*').eq('user_id', user?.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        profile: profile,
        data: {
          workouts: workouts.data || [],
          skincare: skincare.data || [],
          journal: journal.data || [],
          hobbies: hobbies.data || [],
          goals: goals.data || [],
          savings: savings.data || [],
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumaine-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const exportDataAsCSV = async () => {
    try {
      const [workouts, skincare, journal] = await Promise.all([
        supabase.from('workout_sessions').select('*').eq('user_id', user?.id),
        supabase.from('skincare_logs').select('*').eq('user_id', user?.id),
        supabase.from('journal_entries').select('*').eq('user_id', user?.id),
      ]);

      let csv = 'Type,Date,Details\n';

      (workouts.data || []).forEach((w: any) => {
        csv += `Workout,${w.workout_date},"${w.exercise_type || ''} - ${w.duration_minutes || 0} min"\n`;
      });

      (skincare.data || []).forEach((s: any) => {
        csv += `Skincare,${s.log_date},"Completed routine"\n`;
      });

      (journal.data || []).forEach((j: any) => {
        csv += `Journal,${j.entry_date},"${(j.title || '').replace(/"/g, '""')}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumaine-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    try {
      const tables = [
        'user_achievements',
        'workout_sessions',
        'skincare_logs',
        'journal_entries',
        'hobby_logs',
        'goals',
        'savings_goals',
        'saved_links',
        'entertainment_items',
        'user_profiles'
      ];

      for (const table of tables) {
        await supabase.from(table).delete().eq('user_id', user?.id);
      }

      const { error: authError } = await supabase.auth.admin.deleteUser(user?.id || '');

      if (authError) {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;

        alert('Account data deleted. Please contact support to complete account deletion.');
      } else {
        await signOut();
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  if (!profile) {
    return <div className="text-center py-8 text-slate-600">No profile data</div>;
  }

  const progress = getProgressToNextLevel();
  const xpForNextLevel = getXPForLevel(profile.level + 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <User className="h-8 w-8 text-indigo-500" />
          Profile
        </h1>
        <p className="text-slate-600 mt-1">Your stats, achievements, and progress</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile.display_name || 'Lumaine User'}</h2>
              <p className="text-indigo-100">Level {profile.level} Champion</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">XP Progress</span>
                <span className="text-sm font-medium">{profile.total_xp} / {xpForNextLevel} XP</span>
              </div>
              <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                <div
                  className="bg-white h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-indigo-100 mt-1">
                {Math.ceil(xpForNextLevel - profile.total_xp)} XP to level {profile.level + 1}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white border-opacity-20">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <span className="text-sm">Current Streak</span>
                </div>
                <p className="text-3xl font-bold">{profile.current_streak}</p>
                <p className="text-xs text-indigo-100">days in a row</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-5 w-5 text-yellow-300" />
                  <span className="text-sm">Best Streak</span>
                </div>
                <p className="text-3xl font-bold">{profile.longest_streak}</p>
                <p className="text-xs text-indigo-100">days total</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total XP Earned</p>
                  <p className="text-2xl font-bold text-slate-900">{profile.total_xp}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Achievements Unlocked</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {unlockedAchievements.length} / {achievements.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Current Level</p>
                  <p className="text-2xl font-bold text-slate-900">{profile.level}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Award className="h-7 w-7 text-purple-500" />
          Achievements
        </h3>

        <div className="mb-6 flex gap-3">
          <div className="flex-1 p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg text-center">
            <p className="text-sm text-slate-600">Common</p>
            <p className="text-2xl font-bold text-slate-700">
              {unlockedAchievements.filter(a => a.rarity === 'common').length}
            </p>
          </div>
          <div className="flex-1 p-4 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg text-center">
            <p className="text-sm text-blue-700">Rare</p>
            <p className="text-2xl font-bold text-blue-800">
              {unlockedAchievements.filter(a => a.rarity === 'rare').length}
            </p>
          </div>
          <div className="flex-1 p-4 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg text-center">
            <p className="text-sm text-purple-700">Epic</p>
            <p className="text-2xl font-bold text-purple-800">
              {unlockedAchievements.filter(a => a.rarity === 'epic').length}
            </p>
          </div>
          <div className="flex-1 p-4 bg-gradient-to-r from-amber-100 to-amber-200 rounded-lg text-center">
            <p className="text-sm text-amber-700">Legendary</p>
            <p className="text-2xl font-bold text-amber-800">
              {unlockedAchievements.filter(a => a.rarity === 'legendary').length}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-bold text-slate-900 mb-3">Unlocked ({unlockedAchievements.length})</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unlockedAchievements.map((achievement) => {
                const IconComponent = getIconComponent(achievement.icon);
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 bg-gradient-to-br ${getRarityColor(achievement.rarity)} rounded-xl text-white shadow-lg transform hover:scale-105 transition-transform`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                        <IconComponent className="h-7 w-7" />
                      </div>
                      <h5 className="font-bold mb-1">{achievement.name}</h5>
                      <p className="text-xs opacity-90 mb-2">{achievement.description}</p>
                      <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                        +{achievement.xp_reward} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3">
              Locked ({achievements.length - unlockedAchievements.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {achievements
                .filter(a => !unlockedAchievements.find(ua => ua.id === a.id))
                .map((achievement) => {
                  const IconComponent = getIconComponent(achievement.icon);
                  return (
                    <div
                      key={achievement.id}
                      className="p-4 bg-slate-100 rounded-xl border-2 border-slate-200 opacity-50"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                          <IconComponent className="h-7 w-7 text-slate-400" />
                        </div>
                        <h5 className="font-bold text-slate-600 mb-1">{achievement.name}</h5>
                        <p className="text-xs text-slate-500 mb-2">{achievement.description}</p>
                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                          +{achievement.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Palette className="h-7 w-7 text-purple-500" />
          Theme Customization
        </h3>
        <p className="text-slate-600 mb-6">
          Personalize your Lumaine experience with your favorite colors and fonts
        </p>

        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Accent Color</h4>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {[
                { name: 'rose', color: 'bg-rose-400', label: 'Rose' },
                { name: 'pink', color: 'bg-pink-400', label: 'Pink' },
                { name: 'purple', color: 'bg-purple-400', label: 'Purple' },
                { name: 'blue', color: 'bg-blue-400', label: 'Blue' },
                { name: 'cyan', color: 'bg-cyan-400', label: 'Cyan' },
                { name: 'teal', color: 'bg-teal-400', label: 'Teal' },
                { name: 'green', color: 'bg-green-400', label: 'Green' },
                { name: 'amber', color: 'bg-amber-400', label: 'Amber' },
                { name: 'emerald', color: 'bg-emerald-400', label: 'Emerald' },
                { name: 'indigo', color: 'bg-indigo-400', label: 'Indigo' },
              ].map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setSelectedColor(theme.name)}
                  className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                    selectedColor === theme.name
                      ? 'ring-2 ring-offset-2 ring-slate-900 bg-slate-50'
                      : 'hover:bg-slate-50'
                  }`}
                  title={theme.label}
                >
                  <div className={`w-12 h-12 rounded-full ${theme.color} shadow-lg group-hover:scale-110 transition-transform`} />
                  <span className="text-xs font-medium text-slate-700">{theme.label}</span>
                  {selectedColor === theme.name && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-slate-900 mb-4">Font Style</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'sans', label: 'Sans Serif', preview: 'Aa', description: 'Clean and modern' },
                { name: 'serif', label: 'Serif', preview: 'Aa', description: 'Classic and elegant' },
                { name: 'mono', label: 'Monospace', preview: 'Aa', description: 'Technical and precise' },
              ].map((fontOption) => (
                <button
                  key={fontOption.name}
                  onClick={() => setSelectedFont(fontOption.name)}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    selectedFont === fontOption.name
                      ? 'border-slate-900 bg-slate-50 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-4xl font-bold text-slate-900 mb-2 ${
                    fontOption.name === 'sans' ? 'font-sans' :
                    fontOption.name === 'serif' ? 'font-serif' : 'font-mono'
                  }`}>
                    {fontOption.preview}
                  </div>
                  <p className="font-semibold text-slate-900 mb-1">{fontOption.label}</p>
                  <p className="text-sm text-slate-600">{fontOption.description}</p>
                  {selectedFont === fontOption.name && (
                    <div className="absolute top-3 right-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full ring-2 ring-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <button
              onClick={() => updateTheme(selectedColor, selectedFont)}
              disabled={selectedColor === accentColor && selectedFont === font}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold transition-all ${
                selectedColor === accentColor && selectedFont === font
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {selectedColor === accentColor && selectedFont === font ? 'Theme Applied' : 'Apply Theme'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Download className="h-7 w-7 text-green-500" />
          Export Your Data
        </h3>
        <p className="text-slate-600 mb-6">
          Download all your activity data in your preferred format. Your privacy matters.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={exportDataAsJSON}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Download className="h-5 w-5" />
            Export as JSON
          </button>
          <button
            onClick={exportDataAsCSV}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Download className="h-5 w-5" />
            Export as CSV
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-xl p-6 border-2 border-red-200">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-red-100 rounded-xl">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-red-700">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
        >
          <Trash2 className="h-5 w-5" />
          Delete Account
        </button>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Delete Account?</h2>
                <p className="text-slate-600">
                  This will permanently delete your account and all your data including workouts, journal entries, goals, and achievements.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800 font-medium mb-3">
                Before deleting, we recommend exporting your data using the buttons above.
              </p>
              <p className="text-sm text-slate-700 font-semibold">
                Type <span className="text-red-600 font-bold">DELETE</span> to confirm:
              </p>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              disabled={isDeleting}
              className="w-full p-3 border-2 border-slate-300 rounded-lg mb-6 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
