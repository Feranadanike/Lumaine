import { useState, useEffect, useRef } from 'react';
import { Brain, Play, Pause, Square, Volume2, VolumeX, Coffee, Cloud, Waves, Wind, Music, Timer, BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface StudySession {
  id?: string;
  start_time: string;
  duration_minutes: number;
  break_interval_minutes: number;
  sound_choice: string;
}

const ambientSounds = [
  { id: 'none', name: 'Silent', icon: VolumeX, description: 'Pure silence for maximum focus', url: null },
  { id: 'rain', name: 'Rain', icon: Cloud, description: 'Gentle rainfall to calm your mind', url: 'https://assets.mixkit.co/active_storage/sfx/2390/2390-preview.mp3' },
  { id: 'waves', name: 'Ocean Waves', icon: Waves, description: 'Peaceful ocean sounds', url: 'https://assets.mixkit.co/active_storage/sfx/2393/2393-preview.mp3' },
  { id: 'cafe', name: 'Coffee Shop', icon: Coffee, description: 'Ambient cafe atmosphere', url: 'https://assets.mixkit.co/active_storage/sfx/2458/2458-preview.mp3' },
  { id: 'wind', name: 'Wind Chimes', icon: Wind, description: 'Soft wind and chimes', url: 'https://assets.mixkit.co/active_storage/sfx/2392/2392-preview.mp3' },
  { id: 'lofi', name: 'Lo-Fi Beats', icon: Music, description: 'Relaxing instrumental music', url: 'https://assets.mixkit.co/active_storage/sfx/2420/2420-preview.mp3' },
];

const breakIntervals = [15, 25, 30, 45, 60, 90];

export default function StudySpace() {
  const { user } = useAuth();
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [studyDuration, setStudyDuration] = useState(25);
  const [breakInterval, setBreakInterval] = useState(25);
  const [selectedSound, setSelectedSound] = useState('rain');
  const [showBreak, setShowBreak] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [showStudyLog, setShowStudyLog] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);

  const [studySubject, setStudySubject] = useState('');
  const [studyNotes, setStudyNotes] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [moodRating, setMoodRating] = useState(3);

  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    if (user) {
      loadStudyStats();
    }
  }, [user]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const sound = ambientSounds.find(s => s.id === selectedSound);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (sound?.url && isTimerActive && !isPaused) {
      if (audioRef.current) {
        audioRef.current.src = sound.url;
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
        audioRef.current.play().catch(err => console.error('Audio play error:', err));
      }
    }
  }, [selectedSound]);

  useEffect(() => {
    const sound = ambientSounds.find(s => s.id === selectedSound);

    if (isTimerActive && !isPaused && sound?.url) {
      if (audioRef.current) {
        if (audioRef.current.src !== sound.url) {
          audioRef.current.src = sound.url;
          audioRef.current.loop = true;
          audioRef.current.volume = volume;
        }
        audioRef.current.play().catch(err => console.error('Audio play error:', err));
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
    }

    if (!isTimerActive && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isTimerActive, isPaused, selectedSound, volume]);

  const loadStudyStats = async () => {
    if (!user) return;

    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessions) {
      setRecentSessions(sessions);
      const total = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
      setTotalStudyTime(total);

      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const hasToday = sessions.some(s => new Date(s.created_at).toDateString() === today);
      const hasYesterday = sessions.some(s => new Date(s.created_at).toDateString() === yesterday);
      setStudyStreak(hasToday && hasYesterday ? 2 : hasToday ? 1 : 0);
    }
  };

  const startStudySession = async () => {
    if (!user) return;

    const session: StudySession = {
      start_time: new Date().toISOString(),
      duration_minutes: studyDuration,
      break_interval_minutes: breakInterval,
      sound_choice: selectedSound,
    };

    const { data, error } = await supabase
      .from('study_sessions')
      .insert([{ ...session, user_id: user.id }])
      .select()
      .single();

    if (!error && data) {
      setCurrentSession({ ...session, id: data.id });
      setTimeRemaining(studyDuration * 60);
      setIsTimerActive(true);
      setIsPaused(false);
      startTimeRef.current = new Date();
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const stopSession = async () => {
    if (currentSession?.id && user) {
      await supabase
        .from('study_sessions')
        .update({
          end_time: new Date().toISOString(),
          completed: false
        })
        .eq('id', currentSession.id);
    }

    setIsTimerActive(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setCurrentSession(null);
    setShowBreak(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const completeSession = async () => {
    if (currentSession?.id && user) {
      await supabase
        .from('study_sessions')
        .update({
          end_time: new Date().toISOString(),
          completed: true
        })
        .eq('id', currentSession.id);

      setCompletedSessionId(currentSession.id);
      setShowStudyLog(true);
      setIsTimerActive(false);
      setShowBreak(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const saveStudyLog = async () => {
    if (!user || !completedSessionId) return;

    await supabase
      .from('study_logs')
      .insert([{
        user_id: user.id,
        session_id: completedSessionId,
        subject: studySubject,
        notes: studyNotes,
        key_takeaways: keyTakeaways,
        mood_rating: moodRating,
      }]);

    setShowStudyLog(false);
    setStudySubject('');
    setStudyNotes('');
    setKeyTakeaways('');
    setMoodRating(3);
    setCompletedSessionId(null);
    setCurrentSession(null);
    loadStudyStats();
  };

  useEffect(() => {
    if (isTimerActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (showBreak) {
              setShowBreak(false);
              setTimeRemaining(breakInterval * 60);
              return breakInterval * 60;
            } else {
              const elapsedMinutes = Math.floor((new Date().getTime() - (startTimeRef.current?.getTime() || 0)) / 60000);
              if (elapsedMinutes >= studyDuration) {
                completeSession();
                return 0;
              } else {
                setShowBreak(true);
                setBreakTimeRemaining(5 * 60);
                return 5 * 60;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive, isPaused, showBreak, studyDuration, breakInterval]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const SelectedSoundIcon = ambientSounds.find(s => s.id === selectedSound)?.icon || Volume2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <Brain className="h-8 w-8 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Study Space</h1>
            <p className="text-slate-600 dark:text-slate-400">Your peaceful corner for focused learning</p>
          </div>
        </div>

        {!isTimerActive && !showStudyLog && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">Set Your Study Session</h2>
                <p className="text-slate-600 dark:text-slate-400">Customize your perfect learning environment</p>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    <Timer className="inline h-4 w-4 mr-2" />
                    Study Duration
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {[15, 25, 30, 45, 60, 90, 120].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setStudyDuration(duration)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          studyDuration === duration
                            ? 'bg-indigo-500 text-white shadow-lg scale-105'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-slate-600'
                        }`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    <AlertCircle className="inline h-4 w-4 mr-2" />
                    Break Interval (Take a break every...)
                  </label>
                  <div className="flex gap-3 flex-wrap">
                    {breakIntervals.map((interval) => (
                      <button
                        key={interval}
                        onClick={() => setBreakInterval(interval)}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${
                          breakInterval === interval
                            ? 'bg-emerald-500 text-white shadow-lg scale-105'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-slate-600'
                        }`}
                      >
                        {interval} min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    <Volume2 className="inline h-4 w-4 mr-2" />
                    Ambient Sound
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ambientSounds.map((sound) => {
                      const Icon = sound.icon;
                      return (
                        <button
                          key={sound.id}
                          onClick={() => setSelectedSound(sound.id)}
                          className={`p-4 rounded-xl text-left transition-all ${
                            selectedSound === sound.id
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-600'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mb-2 ${selectedSound === sound.id ? 'text-white' : 'text-indigo-500'}`} />
                          <h3 className="font-semibold mb-1">{sound.name}</h3>
                          <p className={`text-xs ${selectedSound === sound.id ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                            {sound.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={startStudySession}
                className="w-full mt-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-5 w-5" />
                Start Study Session
              </button>
            </div>

            {recentSessions.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Your Study Stats
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Study Time</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalStudyTime} min</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Study Streak</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{studyStreak} days</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Sessions</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{recentSessions.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {isTimerActive && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-12">
            <div className="text-center">
              {showBreak ? (
                <>
                  <div className="mb-6">
                    <Coffee className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Take a Break</h2>
                    <p className="text-slate-600 dark:text-slate-400">Relax and recharge for a moment</p>
                  </div>
                  <div className="text-7xl font-bold text-amber-500 mb-8">
                    {formatTime(breakTimeRemaining)}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <BookOpen className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Focus Time</h2>
                    <p className="text-slate-600 dark:text-slate-400">You're doing great! Stay focused</p>
                  </div>
                  <div className="text-8xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-8">
                    {formatTime(timeRemaining)}
                  </div>
                </>
              )}

              <div className="flex items-center justify-center gap-4 mb-6">
                <button
                  onClick={togglePause}
                  className="p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full transition-all shadow-lg"
                >
                  {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
                </button>
                <button
                  onClick={stopSession}
                  className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-lg"
                >
                  <Square className="h-6 w-6" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <SelectedSoundIcon className="h-5 w-5" />
                  <span className="text-sm">{ambientSounds.find(s => s.id === selectedSound)?.name}</span>
                </div>

                {selectedSound !== 'none' && (
                  <div className="flex items-center gap-3 w-64">
                    <VolumeX className="h-4 w-4 text-slate-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <Volume2 className="h-4 w-4 text-slate-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showStudyLog && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-6">
              <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Great Session!</h2>
              <p className="text-slate-600 dark:text-slate-400">Let's capture what you learned</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  What did you study?
                </label>
                <input
                  type="text"
                  value={studySubject}
                  onChange={(e) => setStudySubject(e.target.value)}
                  placeholder="e.g., React Hooks, Calculus, Spanish verbs..."
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Session Notes
                </label>
                <textarea
                  value={studyNotes}
                  onChange={(e) => setStudyNotes(e.target.value)}
                  placeholder="What did you cover? Any challenges or breakthroughs?"
                  rows={4}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Key Takeaways
                </label>
                <textarea
                  value={keyTakeaways}
                  onChange={(e) => setKeyTakeaways(e.target.value)}
                  placeholder="What are the most important things you learned?"
                  rows={3}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  How did this session feel?
                </label>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMoodRating(rating)}
                      className={`w-12 h-12 rounded-full font-bold transition-all ${
                        moodRating === rating
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg scale-110'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-indigo-100 dark:hover:bg-slate-600'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                  1 = Challenging, 5 = Excellent
                </p>
              </div>

              <button
                onClick={saveStudyLog}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-semibold text-lg hover:shadow-xl transition-all"
              >
                Save Study Log
              </button>
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} />
    </div>
  );
}
