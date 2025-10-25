import { useState, useEffect, useRef } from 'react';
import { Brain, Play, Pause, Square, Volume2, VolumeX, Coffee, Cloud, Waves, Wind, Music, Timer, BookOpen, Sparkles, AlertCircle, Send, Upload, FileText, Image as ImageIcon, X, Bot, Loader2, StickyNote, Palette, Plus, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface StudySession {
  id?: string;
  start_time: string;
  duration_minutes: number;
  break_interval_minutes: number;
  sound_choice: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StudyMaterial {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  extractedText: string;
}

interface StudyNote {
  id: string;
  content: string;
  category: string;
  color: string;
  position: number;
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

const noteCategories = [
  { name: 'Math', color: 'blue' },
  { name: 'Science', color: 'green' },
  { name: 'History', color: 'amber' },
  { name: 'English', color: 'purple' },
  { name: 'Languages', color: 'pink' },
  { name: 'Computer Science', color: 'cyan' },
  { name: 'Art', color: 'orange' },
  { name: 'General', color: 'slate' },
];

const colorStyles: { [key: string]: { bg: string; text: string; border: string } } = {
  blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
  pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-300 dark:border-pink-700' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-700' },
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
  slate: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
};

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

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [quickNotes, setQuickNotes] = useState('');
  const [showNotepad, setShowNotepad] = useState(false);
  const [backgroundStyle, setBackgroundStyle] = useState('gradient-purple');
  const [showBgPicker, setShowBgPicker] = useState(false);

  const [studyNotesList, setStudyNotesList] = useState<StudyNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState('');
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const backgroundStyles = [
    { id: 'gradient-purple', name: 'Purple Gradient', class: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900' },
    { id: 'gradient-ocean', name: 'Ocean Gradient', class: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 dark:from-slate-900 dark:via-blue-900 dark:to-teal-900' },
    { id: 'gradient-sunset', name: 'Sunset Gradient', class: 'bg-gradient-to-br from-orange-50 via-pink-50 to-red-50 dark:from-slate-900 dark:via-orange-900 dark:to-red-900' },
    { id: 'gradient-forest', name: 'Forest Gradient', class: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-slate-900 dark:via-green-900 dark:to-emerald-900' },
    { id: 'gradient-minimal', name: 'Minimal', class: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800' },
    { id: 'solid-dark', name: 'Dark Mode', class: 'bg-slate-900' },
  ];

  useEffect(() => {
    if (user) {
      loadStudyStats();
      loadStudyPreferences();
      loadStudyNotes();
    }
  }, [user]);

  const loadStudyPreferences = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('study_preferences')
      .select('quick_notes, background_style')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setQuickNotes(data.quick_notes || '');
      setBackgroundStyle(data.background_style || 'gradient-purple');
    }
  };

  const saveStudyPreferences = async () => {
    if (!user) return;

    await supabase
      .from('study_preferences')
      .upsert({
        user_id: user.id,
        quick_notes: quickNotes,
        background_style: backgroundStyle,
      });
  };

  useEffect(() => {
    if (user && (quickNotes || backgroundStyle !== 'gradient-purple')) {
      const debounce = setTimeout(() => {
        saveStudyPreferences();
      }, 1000);

      return () => clearTimeout(debounce);
    }
  }, [quickNotes, backgroundStyle, user]);

  const loadStudyNotes = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('study_notes')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (data) {
      setStudyNotesList(data);
    }
  };

  const createStudyNote = async () => {
    if (!user || !newNoteContent.trim() || !newNoteCategory.trim()) return;

    const predefinedCategory = noteCategories.find(c => c.name.toLowerCase() === newNoteCategory.toLowerCase());
    const colors = ['blue', 'green', 'amber', 'purple', 'pink', 'cyan', 'orange'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const { data } = await supabase
      .from('study_notes')
      .insert({
        user_id: user.id,
        content: newNoteContent,
        category: newNoteCategory.trim(),
        color: predefinedCategory?.color || randomColor,
        position: studyNotesList.length,
      })
      .select()
      .single();

    if (data) {
      setStudyNotesList([...studyNotesList, data]);
      setNewNoteContent('');
      setNewNoteCategory('');
      setShowNewNoteForm(false);
    }
  };

  const deleteStudyNote = async (noteId: string) => {
    await supabase
      .from('study_notes')
      .delete()
      .eq('id', noteId);

    setStudyNotesList(studyNotesList.filter(n => n.id !== noteId));
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
      setShowChat(true);
      startTimeRef.current = new Date();

      setChatMessages([{
        role: 'assistant',
        content: "Hi! I'm your AI study buddy. Upload your study materials and I'll help you learn! You can ask me questions, request summaries, or quiz yourself on the content.",
        timestamp: new Date(),
      }]);

      loadStudyMaterials(data.id);
    }
  };

  const loadStudyMaterials = async (sessionId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('study_materials')
      .select('*')
      .eq('session_id', sessionId);

    if (data) {
      setStudyMaterials(data.map(m => ({
        id: m.id,
        fileName: m.file_name,
        fileType: m.file_type,
        fileUrl: m.file_url,
        extractedText: m.extracted_text || '',
      })));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user || !currentSession?.id) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          content: `Processing "${file.name}"... This may take a moment for PDFs and images.`,
          timestamp: new Date(),
        }]);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${currentSession.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('study-materials')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('study-materials')
          .getPublicUrl(fileName);

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('No active session');
        }

        const processResponse = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-study-file`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileUrl: urlData.publicUrl,
              fileType: file.type,
              fileName: file.name,
            }),
          }
        );

        if (!processResponse.ok) {
          throw new Error('Failed to process file');
        }

        const { extractedText } = await processResponse.json();

        const { data: materialData } = await supabase
          .from('study_materials')
          .insert({
            user_id: user.id,
            session_id: currentSession.id,
            file_name: file.name,
            file_type: file.type,
            file_url: urlData.publicUrl,
            extracted_text: extractedText,
          })
          .select()
          .single();

        if (materialData) {
          setStudyMaterials(prev => [...prev, {
            id: materialData.id,
            fileName: materialData.file_name,
            fileType: materialData.file_type,
            fileUrl: materialData.file_url,
            extractedText: materialData.extracted_text || '',
          }]);

          const contentPreview = extractedText.length > 100
            ? extractedText.substring(0, 100) + '...'
            : extractedText;

          setChatMessages(prev => [...prev, {
            role: 'assistant',
            content: `Perfect! I've read "${file.name}" and I can see: "${contentPreview}"\n\nAsk me anything about it!`,
            timestamp: new Date(),
          }]);
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your file. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading || !currentSession?.id) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-assistant`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: currentSession.id,
            message: chatInput,
            conversationHistory: chatMessages.slice(-10).map(m => ({
              role: m.role,
              content: m.content
            })),
            studyMaterials: studyMaterials.map(m => ({
              fileName: m.fileName,
              extractedText: m.extractedText,
            })),
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const removeMaterial = async (materialId: string) => {
    await supabase
      .from('study_materials')
      .delete()
      .eq('id', materialId);

    setStudyMaterials(prev => prev.filter(m => m.id !== materialId));
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
    setShowChat(false);
    setChatMessages([]);
    setStudyMaterials([]);
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
  const currentBgStyle = backgroundStyles.find(bg => bg.id === backgroundStyle)?.class || backgroundStyles[0].class;

  return (
    <div className={`min-h-screen ${currentBgStyle} p-6 transition-all duration-500`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
              <Brain className="h-8 w-8 text-indigo-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Study Space</h1>
              <p className="text-slate-600 dark:text-slate-400">Your peaceful corner for focused learning</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowNotepad(!showNotepad)}
              className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all text-indigo-500 hover:text-indigo-600"
              title="Quick Notes"
            >
              <StickyNote className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowBgPicker(!showBgPicker)}
              className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all text-indigo-500 hover:text-indigo-600"
              title="Change Background"
            >
              <Palette className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showNotepad && (
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-yellow-500" />
                Study Notes
              </h3>
              <button
                onClick={() => setShowNotepad(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {studyNotesList.length > 0 && (
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterCategory(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filterCategory === null
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  All
                </button>
                {Array.from(new Set(studyNotesList.map(note => note.category))).map(category => {
                  const note = studyNotesList.find(n => n.category === category);
                  const styles = note ? colorStyles[note.color] || colorStyles.slate : colorStyles.slate;
                  return (
                    <button
                      key={category}
                      onClick={() => setFilterCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        filterCategory === category
                          ? `${styles.bg} ${styles.text} ring-2 ${styles.border}`
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {studyNotesList
                .filter(note => !filterCategory || note.category === filterCategory)
                .map(note => {
                  const styles = colorStyles[note.color] || colorStyles.slate;
                  return (
                    <div
                      key={note.id}
                      className={`p-4 rounded-xl border-2 ${styles.border} ${styles.bg} relative group`}
                    >
                      <button
                        onClick={() => deleteStudyNote(note.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className={`flex items-center gap-1.5 mb-2 ${styles.text}`}>
                        <Tag className="h-3 w-3" />
                        <span className="text-xs font-medium">{note.category}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  );
                })}

              {!showNewNoteForm && (
                <button
                  onClick={() => setShowNewNoteForm(true)}
                  className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]"
                >
                  <Plus className="h-6 w-6 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Add Note</span>
                </button>
              )}

              {showNewNoteForm && (
                <div className="p-4 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20">
                  <div className="mb-2">
                    <label className="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Subject</label>
                    <input
                      type="text"
                      value={newNoteCategory}
                      onChange={(e) => setNewNoteCategory(e.target.value)}
                      placeholder="Type your subject (e.g., Biology, Physics...)"
                      className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="mb-2 flex flex-wrap gap-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-full mb-1">Quick select:</span>
                    {noteCategories.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => setNewNoteCategory(cat.name)}
                        className={`px-2 py-0.5 rounded text-xs transition-all ${
                          colorStyles[cat.color].bg
                        } ${colorStyles[cat.color].text} hover:opacity-80`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Write your note..."
                    className="w-full h-20 px-2 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={createStudyNote}
                      disabled={!newNoteCategory.trim() || !newNoteContent.trim()}
                      className="flex-1 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowNewNoteForm(false);
                        setNewNoteContent('');
                        setNewNoteCategory('');
                      }}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {studyNotesList.length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 text-sm py-8">
                No notes yet. Click "Add Note" to create your first study note with a subject tag!
              </p>
            )}
          </div>
        )}

        {showBgPicker && (
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-indigo-500" />
                Background Style
              </h3>
              <button
                onClick={() => setShowBgPicker(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {backgroundStyles.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => {
                    setBackgroundStyle(bg.id);
                    setShowBgPicker(false);
                  }}
                  className={`p-4 rounded-xl text-left transition-all ${
                    backgroundStyle === bg.id
                      ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800'
                      : 'hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600'
                  }`}
                >
                  <div className={`h-16 rounded-lg mb-2 ${bg.class}`}></div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{bg.name}</p>
                </button>
              ))}
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col h-[600px]">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Bot className="h-6 w-6 text-indigo-500" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">AI Study Buddy</h3>
                </div>
              </div>

              {studyMaterials.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Loaded Materials:</p>
                  <div className="flex flex-wrap gap-2">
                    {studyMaterials.map(material => (
                      <div
                        key={material.id}
                        className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg text-xs"
                      >
                        {material.fileType.startsWith('image/') ? (
                          <ImageIcon className="h-3 w-3 text-indigo-500" />
                        ) : (
                          <FileText className="h-3 w-3 text-indigo-500" />
                        )}
                        <span className="text-slate-700 dark:text-slate-300">{material.fileName}</span>
                        <button
                          onClick={() => removeMaterial(material.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-indigo-500" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] p-3 rounded-xl ${
                        msg.role === 'user'
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl">
                      <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.txt,.png,.jpg,.jpeg"
                    className="hidden"
                    multiple
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 text-slate-600 dark:text-slate-400 animate-spin" />
                    ) : (
                      <Upload className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything about your study materials..."
                    className="flex-1 p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isChatLoading || !chatInput.trim()}
                    className="p-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                  Upload PDFs, images, or text files to study together
                </p>
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
