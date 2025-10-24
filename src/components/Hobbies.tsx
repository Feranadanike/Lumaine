import { useEffect, useState } from 'react';
import { Plus, X, Heart, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Hobby, HobbyLog } from '../types';

export default function Hobbies() {
  const { user } = useAuth();
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [logs, setLogs] = useState<Record<string, HobbyLog[]>>({});
  const [showHobbyForm, setShowHobbyForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [selectedHobby, setSelectedHobby] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newHobby, setNewHobby] = useState({
    hobby_name: '',
    hobby_type: 'reading',
    frequency_goal: 'daily',
    target_count: 1,
    days_of_week: [] as string[],
    preferred_time: '',
  });

  const [newLog, setNewLog] = useState({
    duration_minutes: 0,
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadHobbies();
    }
  }, [user]);

  const loadHobbies = async () => {
    try {
      const { data, error } = await supabase
        .from('hobbies')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setHobbies(data);
        data.forEach((hobby) => loadLogsForHobby(hobby.id));
      }
    } catch (error) {
      console.error('Error loading hobbies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogsForHobby = async (hobbyId: string) => {
    try {
      const { data, error } = await supabase
        .from('hobby_logs')
        .select('*')
        .eq('hobby_id', hobbyId)
        .order('log_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) {
        setLogs((prev) => ({ ...prev, [hobbyId]: data }));
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleAddHobby = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hobbies')
        .insert([
          {
            user_id: user.id,
            hobby_name: newHobby.hobby_name,
            hobby_type: newHobby.hobby_type,
            frequency_goal: newHobby.frequency_goal,
            target_count: newHobby.target_count,
            days_of_week: newHobby.days_of_week.length > 0 ? newHobby.days_of_week : null,
            preferred_time: newHobby.preferred_time || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setHobbies([data, ...hobbies]);
      setNewHobby({ hobby_name: '', hobby_type: 'reading', frequency_goal: 'daily', target_count: 1, days_of_week: [], preferred_time: '' });
      setShowHobbyForm(false);
    } catch (error) {
      console.error('Error adding hobby:', error);
    }
  };

  const handleDeleteHobby = async (hobbyId: string) => {
    if (!confirm('Are you sure you want to delete this hobby? All activity logs will also be deleted.')) {
      return;
    }

    try {
      await supabase.from('hobby_logs').delete().eq('hobby_id', hobbyId);

      const { error } = await supabase.from('hobbies').delete().eq('id', hobbyId);

      if (error) throw error;

      setHobbies(hobbies.filter((h) => h.id !== hobbyId));
      setLogs((prev) => {
        const newLogs = { ...prev };
        delete newLogs[hobbyId];
        return newLogs;
      });
    } catch (error) {
      console.error('Error deleting hobby:', error);
      alert('Failed to delete hobby. Please try again.');
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedHobby) return;

    try {
      const { data, error } = await supabase
        .from('hobby_logs')
        .insert([
          {
            hobby_id: selectedHobby,
            user_id: user.id,
            duration_minutes: newLog.duration_minutes || null,
            notes: newLog.notes || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setLogs((prev) => ({
        ...prev,
        [selectedHobby]: [data, ...(prev[selectedHobby] || [])],
      }));
      setNewLog({ duration_minutes: 0, notes: '' });
      setShowLogForm(false);
      setSelectedHobby(null);
    } catch (error) {
      console.error('Error adding log:', error);
    }
  };

  const hobbyTypes = [
    'reading',
    'bible_study',
    'meditation',
    'language_learning',
    'music',
    'art',
    'writing',
    'cooking',
    'gardening',
    'other',
  ];

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className="h-8 w-8 text-rose-400" />
            Hobbies
          </h1>
          <p className="text-slate-600 mt-1">Track your personal activities and interests</p>
        </div>
        <button
          onClick={() => setShowHobbyForm(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-400 text-white px-4 py-2 rounded-lg hover:bg-rose-500 transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          Add Hobby
        </button>
      </div>

      {showHobbyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Add Hobby</h2>
              <button onClick={() => setShowHobbyForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddHobby} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Hobby Name</label>
                <input
                  type="text"
                  value={newHobby.hobby_name}
                  onChange={(e) => setNewHobby({ ...newHobby, hobby_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400"
                  placeholder="e.g., Morning Reading"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <select
                  value={newHobby.hobby_type}
                  onChange={(e) => setNewHobby({ ...newHobby, hobby_type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400"
                >
                  {hobbyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Frequency Goal</label>
                <select
                  value={newHobby.frequency_goal}
                  onChange={(e) => setNewHobby({ ...newHobby, frequency_goal: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Count</label>
                <input
                  type="number"
                  value={newHobby.target_count}
                  onChange={(e) => setNewHobby({ ...newHobby, target_count: parseInt(e.target.value) || 1 })}
                  min="1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Schedule (Optional)</label>
                <p className="text-xs text-slate-500 mb-2">Select days to show in Today's Tasks</p>
                <div className="grid grid-cols-4 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const updatedDays = newHobby.days_of_week.includes(day)
                          ? newHobby.days_of_week.filter((d) => d !== day)
                          : [...newHobby.days_of_week, day];
                        setNewHobby({ ...newHobby, days_of_week: updatedDays });
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        newHobby.days_of_week.includes(day)
                          ? 'bg-rose-400 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day.slice(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Time (Optional)</label>
                <input
                  type="time"
                  value={newHobby.preferred_time}
                  onChange={(e) => setNewHobby({ ...newHobby, preferred_time: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-rose-400 text-white py-3 rounded-lg hover:bg-rose-500 font-medium transition-colors shadow-lg"
              >
                Add Hobby
              </button>
            </form>
          </div>
        </div>
      )}

      {showLogForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Log Activity</h2>
              <button
                onClick={() => {
                  setShowLogForm(false);
                  setSelectedHobby(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={newLog.duration_minutes || ''}
                  onChange={(e) => setNewLog({ ...newLog, duration_minutes: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400"
                  rows={3}
                  placeholder="What did you do?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-rose-400 text-white py-3 rounded-lg hover:bg-rose-500 font-medium transition-colors shadow-lg"
              >
                Save Log
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {hobbies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No hobbies yet. Add your first hobby to start tracking!</p>
          </div>
        ) : (
          hobbies.map((hobby) => {
            const hobbyLogs = logs[hobby.id] || [];
            const recentCount = hobbyLogs.length;

            return (
              <div key={hobby.id} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{hobby.hobby_name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                      <span className="capitalize">{hobby.hobby_type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="capitalize">
                        {hobby.target_count}x {hobby.frequency_goal}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {recentCount} recent logs
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedHobby(hobby.id);
                        setShowLogForm(true);
                      }}
                      className="bg-rose-50 text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-100 text-sm font-medium transition-colors"
                    >
                      Log Activity
                    </button>
                    <button
                      onClick={() => handleDeleteHobby(hobby.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete hobby"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {hobbyLogs.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Recent Activity</p>
                    {hobbyLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(log.log_date).toLocaleDateString()}
                          {log.duration_minutes && (
                            <>
                              <span>•</span>
                              <span>{log.duration_minutes} mins</span>
                            </>
                          )}
                        </div>
                        {log.notes && <p className="text-sm text-slate-700">{log.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
