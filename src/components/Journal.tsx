import { useEffect, useState } from 'react';
import { Plus, X, BookOpen, Smile, Meh, Frown, Edit2, Trash2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { JournalEntry } from '../types';

export default function Journal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood_score: 3,
    gratitude_items: ['', '', ''],
  });

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEntries(entries);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = entries.filter(entry =>
        entry.title?.toLowerCase().includes(query) ||
        entry.content?.toLowerCase().includes(query) ||
        entry.gratitude_items?.some(item => item.toLowerCase().includes(query))
      );
      setFilteredEntries(filtered);
    }
  }, [searchQuery, entries]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user?.id)
        .order('entry_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) {
        setEntries(data);
        setFilteredEntries(data);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const gratitudeFiltered = newEntry.gratitude_items.filter((item) => item.trim() !== '');

      const { data, error } = await supabase
        .from('journal_entries')
        .insert([
          {
            user_id: user.id,
            title: newEntry.title || null,
            content: newEntry.content,
            mood_score: newEntry.mood_score,
            gratitude_items: gratitudeFiltered.length > 0 ? gratitudeFiltered : null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setEntries([data, ...entries]);
      setNewEntry({ title: '', content: '', mood_score: 3, gratitude_items: ['', '', ''] });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setNewEntry({
      title: entry.title || '',
      content: entry.content,
      mood_score: entry.mood_score || 3,
      gratitude_items: entry.gratitude_items || ['', '', ''],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEntries(entries.filter((e) => e.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingEntry) return;

    try {
      const gratitudeFiltered = newEntry.gratitude_items.filter((item) => item.trim() !== '');

      const { data, error } = await supabase
        .from('journal_entries')
        .update({
          title: newEntry.title || null,
          content: newEntry.content,
          mood_score: newEntry.mood_score,
          gratitude_items: gratitudeFiltered.length > 0 ? gratitudeFiltered : null,
        })
        .eq('id', editingEntry.id)
        .select()
        .single();

      if (error) throw error;

      setEntries(entries.map((e) => (e.id === editingEntry.id ? data : e)));
      setNewEntry({ title: '', content: '', mood_score: 3, gratitude_items: ['', '', ''] });
      setShowForm(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry');
    }
  };


  const getMoodIcon = (score: number) => {
    if (score >= 4) return <Smile className="h-5 w-5 text-green-500" />;
    if (score === 3) return <Meh className="h-5 w-5 text-yellow-500" />;
    return <Frown className="h-5 w-5 text-red-500" />;
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-purple-300" />
            Journal
          </h1>
          <p className="text-slate-600 mt-1">Reflect on your day and track your mood</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-purple-300 text-white px-4 py-2 rounded-lg hover:bg-purple-400 transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          New Entry
        </button>
      </div>

{showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingEntry(null);
                  setNewEntry({ title: '', content: '', mood_score: 3, gratitude_items: ['', '', ''] });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={editingEntry ? handleUpdate : handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title (optional)</label>
                <input
                  type="text"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-300"
                  placeholder="Today's reflection..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">How are you feeling?</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setNewEntry({ ...newEntry, mood_score: score })}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        newEntry.mood_score === score
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {getMoodIcon(score)}
                      <div className="text-xs mt-1 text-slate-600">{score}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">What are you grateful for?</label>
                {newEntry.gratitude_items.map((item, index) => (
                  <input
                    key={index}
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newGratitude = [...newEntry.gratitude_items];
                      newGratitude[index] = e.target.value;
                      setNewEntry({ ...newEntry, gratitude_items: newGratitude });
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-2"
                    placeholder={`Gratitude ${index + 1}`}
                  />
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Journal Entry</label>
                <textarea
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-300"
                  rows={8}
                  placeholder="Write your thoughts..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-300 text-white py-3 rounded-lg hover:bg-purple-400 font-medium transition-colors shadow-lg"
              >
                {editingEntry ? 'Update Entry' : 'Save Entry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search journal entries by title, content, or gratitude..."
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-300 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-slate-600">
              Found {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6">
        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <BookOpen className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No journal entries yet. Start reflecting on your day!</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Search className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No entries match your search</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {entry.title && <h3 className="text-xl font-bold text-slate-900 mb-2">{entry.title}</h3>}
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
                    {entry.mood_score && <div className="flex items-center gap-1">{getMoodIcon(entry.mood_score)}</div>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Edit entry"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {entry.gratitude_items && entry.gratitude_items.length > 0 && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 mb-2">Grateful for:</p>
                  <ul className="list-disc list-inside text-sm text-purple-700 space-y-1">
                    {entry.gratitude_items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-slate-700 whitespace-pre-wrap">{entry.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
