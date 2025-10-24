import { useState, useEffect } from 'react';
import { Heart, Smile, Frown, Meh, Cloud, Sparkles, Zap, Wind, Calendar, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface MoodEntry {
  id: string;
  entry_date: string;
  emotions: string[];
  context_factors: string[];
  notes: string;
  intensity: number;
  created_at: string;
}

const EMOTIONS = [
  { id: 'happy', label: 'Happy', icon: Smile, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  { id: 'sad', label: 'Sad', icon: Frown, color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'anxious', label: 'Anxious', icon: Wind, color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'excited', label: 'Excited', icon: Sparkles, color: 'bg-pink-100 text-pink-700 border-pink-300' },
  { id: 'stressed', label: 'Stressed', icon: Zap, color: 'bg-red-100 text-red-700 border-red-300' },
  { id: 'calm', label: 'Calm', icon: Cloud, color: 'bg-teal-100 text-teal-700 border-teal-300' },
  { id: 'angry', label: 'Angry', icon: Zap, color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'grateful', label: 'Grateful', icon: Heart, color: 'bg-rose-100 text-rose-700 border-rose-300' },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: 'bg-gray-100 text-gray-700 border-gray-300' },
];

const CONTEXT_FACTORS = [
  { id: 'family', label: 'Family' },
  { id: 'friends', label: 'Friends' },
  { id: 'work', label: 'Work' },
  { id: 'school', label: 'School' },
  { id: 'health', label: 'Health' },
  { id: 'hobbies', label: 'Hobbies' },
  { id: 'finances', label: 'Finances' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'weather', label: 'Weather' },
  { id: 'sleep', label: 'Sleep' },
];

export default function MoodDiary() {
  const { user } = useAuth();
  const { getColorClasses } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user?.id)
      .is('deleted_at', null)
      .order('entry_date', { ascending: false })
      .limit(30);

    if (!error && data) {
      setEntries(data);
    }
  };

  const toggleEmotion = (emotionId: string) => {
    setSelectedEmotions(prev =>
      prev.includes(emotionId)
        ? prev.filter(e => e !== emotionId)
        : [...prev, emotionId]
    );
  };

  const toggleContext = (contextId: string) => {
    setSelectedContexts(prev =>
      prev.includes(contextId)
        ? prev.filter(c => c !== contextId)
        : [...prev, contextId]
    );
  };

  const handleSave = async () => {
    if (selectedEmotions.length === 0) {
      alert('Please select at least one emotion');
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('mood_entries')
      .insert({
        user_id: user?.id,
        entry_date: selectedDate,
        emotions: selectedEmotions,
        context_factors: selectedContexts,
        notes,
        intensity,
      });

    if (!error) {
      setShowForm(false);
      setSelectedEmotions([]);
      setSelectedContexts([]);
      setNotes('');
      setIntensity(5);
      setSelectedDate(new Date().toISOString().split('T')[0]);
      loadEntries();
    } else {
      alert('Failed to save mood entry');
    }

    setLoading(false);
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase
      .from('mood_entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      loadEntries();
    }
  };

  const getEmotionDisplay = (emotionId: string) => {
    return EMOTIONS.find(e => e.id === emotionId)?.label || emotionId;
  };

  const getContextDisplay = (contextId: string) => {
    return CONTEXT_FACTORS.find(c => c.id === contextId)?.label || contextId;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Heart className={`h-8 w-8 ${getColorClasses('text')}`} />
            Mood Diary
          </h1>
          <p className="text-slate-600 mt-1">Track your emotions and discover patterns</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className={`${getColorClasses('bg')} text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-lg`}
          >
            <Plus className="h-5 w-5" />
            New Entry
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">How are you feeling?</h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select your emotions
              </label>
              <div className="grid grid-cols-3 gap-3">
                {EMOTIONS.map(emotion => {
                  const Icon = emotion.icon;
                  const isSelected = selectedEmotions.includes(emotion.id);
                  return (
                    <button
                      key={emotion.id}
                      onClick={() => toggleEmotion(emotion.id)}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        isSelected
                          ? emotion.color
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{emotion.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Intensity: {intensity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                What's influencing your mood?
              </label>
              <div className="flex flex-wrap gap-2">
                {CONTEXT_FACTORS.map(context => {
                  const isSelected = selectedContexts.includes(context.id);
                  return (
                    <button
                      key={context.id}
                      onClick={() => toggleContext(context.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? `${getColorClasses('bg')} text-white`
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {context.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tell us more (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="What happened today? What made you feel this way?"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={loading || selectedEmotions.length === 0}
              className={`w-full ${getColorClasses('bg')} text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Your Mood History
        </h2>

        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No mood entries yet</p>
            <p className="text-slate-400 text-sm mt-1">Start tracking your emotions today!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <div key={entry.id} className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {new Date(entry.entry_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-slate-500">
                      Intensity: {entry.intensity}/10
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Delete this mood entry?')) {
                        deleteEntry(entry.id);
                      }
                    }}
                    className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mb-3">
                  <p className="text-xs font-medium text-slate-600 mb-2">Emotions:</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.emotions.map(emotionId => {
                      const emotion = EMOTIONS.find(e => e.id === emotionId);
                      if (!emotion) return null;
                      const Icon = emotion.icon;
                      return (
                        <span
                          key={emotionId}
                          className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${emotion.color}`}
                        >
                          <Icon className="h-3 w-3" />
                          {emotion.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {entry.context_factors.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-slate-600 mb-2">Influenced by:</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.context_factors.map(contextId => (
                        <span
                          key={contextId}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm"
                        >
                          {getContextDisplay(contextId)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entry.notes && (
                  <div className="bg-slate-50 rounded-lg p-3 mt-3">
                    <p className="text-sm text-slate-700">{entry.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
