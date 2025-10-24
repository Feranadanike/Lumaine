import { useEffect, useState } from 'react';
import { Heart, Moon, Droplets, Play, Pause, RotateCcw, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Wellness() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'meditation' | 'sleep' | 'water'>('meditation');

  const [meditationTime, setMeditationTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [meditationInterval, setMeditationInterval] = useState<NodeJS.Timeout | null>(null);
  const [meditationSessions, setMeditationSessions] = useState<any[]>([]);

  const [sleepLogs, setSleepLogs] = useState<any[]>([]);
  const [showSleepForm, setShowSleepForm] = useState(false);
  const [newSleep, setNewSleep] = useState({
    sleep_date: new Date().toISOString().split('T')[0],
    bedtime: '22:00',
    wake_time: '07:00',
    quality_rating: 3,
    notes: '',
  });

  const [waterToday, setWaterToday] = useState<any>(null);
  const [waterHistory, setWaterHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (meditationInterval) {
        clearInterval(meditationInterval);
      }
    };
  }, [meditationInterval]);

  const loadData = async () => {
    try {
      const [medSessions, sleepData, waterData] = await Promise.all([
        supabase
          .from('meditation_sessions')
          .select('*')
          .eq('user_id', user?.id)
          .order('session_date', { ascending: false })
          .limit(7),
        supabase
          .from('sleep_logs')
          .select('*')
          .eq('user_id', user?.id)
          .order('sleep_date', { ascending: false })
          .limit(7),
        supabase
          .from('water_intake')
          .select('*')
          .eq('user_id', user?.id)
          .order('intake_date', { ascending: false })
          .limit(7),
      ]);

      setMeditationSessions(medSessions.data || []);
      setSleepLogs(sleepData.data || []);
      setWaterHistory(waterData.data || []);

      const today = new Date().toISOString().split('T')[0];
      const todayWater = waterData.data?.find((w: any) => w.intake_date === today);

      if (!todayWater) {
        const { data: newWater } = await supabase
          .from('water_intake')
          .insert([{
            user_id: user?.id,
            intake_date: today,
            glasses_count: 0,
            ounces_total: 0,
            goal_glasses: 8,
          }])
          .select()
          .single();
        setWaterToday(newWater);
      } else {
        setWaterToday(todayWater);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMeditationTimer = () => {
    setIsTimerRunning(true);
    const interval = setInterval(() => {
      setMeditationTime(prev => prev + 1);
    }, 1000);
    setMeditationInterval(interval);
  };

  const pauseMeditationTimer = () => {
    setIsTimerRunning(false);
    if (meditationInterval) {
      clearInterval(meditationInterval);
      setMeditationInterval(null);
    }
  };

  const resetMeditationTimer = () => {
    pauseMeditationTimer();
    setMeditationTime(0);
  };

  const completeMeditationSession = async () => {
    if (meditationTime < 60) {
      alert('Meditate for at least 1 minute to save a session');
      return;
    }

    pauseMeditationTimer();

    try {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .insert([{
          user_id: user?.id,
          duration_minutes: Math.floor(meditationTime / 60),
          meditation_type: 'Mindfulness',
        }])
        .select()
        .single();

      if (error) throw error;

      setMeditationSessions([data, ...meditationSessions]);
      setMeditationTime(0);
      alert(`Great session! ${Math.floor(meditationTime / 60)} minutes logged.`);
    } catch (error) {
      console.error('Error logging meditation:', error);
    }
  };

  const handleSleepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const bedtime = new Date(`2000-01-01T${newSleep.bedtime}`);
      let wakeTime = new Date(`2000-01-01T${newSleep.wake_time}`);

      if (wakeTime < bedtime) {
        wakeTime = new Date(`2000-01-02T${newSleep.wake_time}`);
      }

      const hoursSlept = (wakeTime.getTime() - bedtime.getTime()) / (1000 * 60 * 60);

      const { data, error } = await supabase
        .from('sleep_logs')
        .insert([{
          user_id: user.id,
          sleep_date: newSleep.sleep_date,
          bedtime: newSleep.bedtime,
          wake_time: newSleep.wake_time,
          hours_slept: hoursSlept,
          quality_rating: newSleep.quality_rating,
          notes: newSleep.notes || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setSleepLogs([data, ...sleepLogs]);
      setNewSleep({
        sleep_date: new Date().toISOString().split('T')[0],
        bedtime: '22:00',
        wake_time: '07:00',
        quality_rating: 3,
        notes: '',
      });
      setShowSleepForm(false);
    } catch (error) {
      console.error('Error logging sleep:', error);
    }
  };

  const addWaterGlass = async () => {
    if (!waterToday || !user) return;

    try {
      const newCount = waterToday.glasses_count + 1;
      const newOunces = newCount * 8;

      const { data, error } = await supabase
        .from('water_intake')
        .update({
          glasses_count: newCount,
          ounces_total: newOunces,
          updated_at: new Date().toISOString(),
        })
        .eq('id', waterToday.id)
        .select()
        .single();

      if (error) throw error;
      setWaterToday(data);
    } catch (error) {
      console.error('Error updating water:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Heart className="h-8 w-8 text-rose-500" />
          Wellness
        </h1>
        <p className="text-slate-600 mt-1">Meditation, sleep, and hydration tracking</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('meditation')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'meditation'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Meditation
        </button>
        <button
          onClick={() => setActiveTab('sleep')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'sleep'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Sleep
        </button>
        <button
          onClick={() => setActiveTab('water')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'water'
              ? 'text-cyan-600 border-b-2 border-cyan-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Hydration
        </button>
      </div>

      {activeTab === 'meditation' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Meditation Timer</h2>
              <p className="text-purple-100">Find your inner peace</p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="w-48 h-48 bg-white bg-opacity-10 rounded-full flex items-center justify-center backdrop-blur-sm">
                <p className="text-6xl font-bold">{formatTime(meditationTime)}</p>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {!isTimerRunning ? (
                <button
                  onClick={startMeditationTimer}
                  className="flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-full font-bold hover:bg-purple-50 transition-colors shadow-lg"
                >
                  <Play className="h-6 w-6" />
                  Start
                </button>
              ) : (
                <button
                  onClick={pauseMeditationTimer}
                  className="flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-full font-bold hover:bg-purple-50 transition-colors shadow-lg"
                >
                  <Pause className="h-6 w-6" />
                  Pause
                </button>
              )}
              <button
                onClick={resetMeditationTimer}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white px-6 py-4 rounded-full font-medium hover:bg-opacity-30 transition-colors"
              >
                <RotateCcw className="h-5 w-5" />
                Reset
              </button>
              {meditationTime >= 60 && (
                <button
                  onClick={completeMeditationSession}
                  className="flex items-center gap-2 bg-green-500 text-white px-6 py-4 rounded-full font-bold hover:bg-green-600 transition-colors shadow-lg"
                >
                  Complete
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Recent Sessions</h3>
            {meditationSessions.length > 0 ? (
              <div className="space-y-3">
                {meditationSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900">{session.duration_minutes} minutes</p>
                      <p className="text-sm text-slate-600">
                        {new Date(session.session_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-purple-600 font-medium">{session.meditation_type || 'Mindfulness'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No meditation sessions yet. Start your first one!</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sleep' && (
        <div className="space-y-6">
          <button
            onClick={() => setShowSleepForm(true)}
            className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-colors shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Log Sleep
          </button>

          {showSleepForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-900">Log Sleep</h2>
                  <button onClick={() => setShowSleepForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleSleepSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={newSleep.sleep_date}
                      onChange={(e) => setNewSleep({ ...newSleep, sleep_date: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Bedtime</label>
                      <input
                        type="time"
                        value={newSleep.bedtime}
                        onChange={(e) => setNewSleep({ ...newSleep, bedtime: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Wake Time</label>
                      <input
                        type="time"
                        value={newSleep.wake_time}
                        onChange={(e) => setNewSleep({ ...newSleep, wake_time: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Sleep Quality: {newSleep.quality_rating}/5
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={newSleep.quality_rating}
                      onChange={(e) => setNewSleep({ ...newSleep, quality_rating: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                    <textarea
                      value={newSleep.notes}
                      onChange={(e) => setNewSleep({ ...newSleep, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={3}
                      placeholder="How did you sleep?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-500 text-white py-3 rounded-lg hover:bg-indigo-600 font-medium transition-colors shadow-lg"
                  >
                    Save Sleep Log
                  </button>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Sleep History</h3>
            {sleepLogs.length > 0 ? (
              <div className="space-y-3">
                {sleepLogs.map((log) => (
                  <div key={log.id} className="p-4 bg-indigo-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-900">
                        {new Date(log.sleep_date).toLocaleDateString()}
                      </p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {log.hours_slept?.toFixed(1)}h
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-slate-600">
                        {log.bedtime} - {log.wake_time}
                      </p>
                      <p className="text-slate-600">
                        Quality: {log.quality_rating}/5 ⭐
                      </p>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-slate-600 mt-2 italic">{log.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No sleep logs yet. Start tracking your sleep!</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'water' && waterToday && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Today's Hydration</h2>
              <p className="text-cyan-100">Stay hydrated, stay healthy</p>
            </div>

            <div className="flex justify-center mb-6">
              <div className="text-center">
                <p className="text-7xl font-bold mb-2">{waterToday.glasses_count}</p>
                <p className="text-xl">out of {waterToday.goal_glasses} glasses</p>
                <p className="text-sm text-cyan-100 mt-2">{waterToday.ounces_total} oz</p>
              </div>
            </div>

            <div className="w-full bg-white bg-opacity-20 rounded-full h-4 mb-6">
              <div
                className="bg-white h-4 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (waterToday.glasses_count / waterToday.goal_glasses) * 100)}%`,
                }}
              />
            </div>

            <div className="flex justify-center">
              <button
                onClick={addWaterGlass}
                className="flex items-center gap-2 bg-white text-cyan-600 px-8 py-4 rounded-full font-bold hover:bg-cyan-50 transition-colors shadow-lg"
              >
                <Droplets className="h-6 w-6" />
                Add Glass (+8 oz)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {waterHistory.slice(0, 7).map((day) => (
              <div key={day.id} className="bg-white rounded-xl shadow-lg p-4 text-center">
                <p className="text-sm text-slate-600 mb-2">
                  {new Date(day.intake_date).toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-2xl font-bold text-cyan-600">{day.glasses_count}</p>
                <p className="text-xs text-slate-500">glasses</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
