import { useEffect, useState } from 'react';
import { Plus, X, Edit2, Trash2, Save, FileText, Zap, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Note {
  id: string;
  title: string;
  content: string;
  is_quick: boolean;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

const colorGradients = {
  energetic: 'from-orange-400 via-amber-400 to-yellow-400',
  calm: 'from-blue-400 via-cyan-400 to-teal-400',
  creative: 'from-purple-400 via-pink-400 to-rose-400',
  success: 'from-green-400 via-emerald-400 to-teal-400',
  sunset: 'from-pink-400 via-orange-400 to-amber-400',
  ocean: 'from-teal-400 via-blue-400 to-indigo-400',
  default: 'from-gray-300 via-gray-400 to-gray-500',
};

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickInput, setShowQuickInput] = useState(false);
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [selectedColor, setSelectedColor] = useState('energetic');
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    if (user) {
      loadNotes();
    }
  }, [user]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_quick', { ascending: false })
        .order('position', { ascending: false })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      if (data) setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickNoteSubmit = async () => {
    if (!quickNoteText.trim()) return;

    try {
      const { error } = await supabase
        .from('notes')
        .insert([{
          user_id: user?.id,
          title: '',
          content: quickNoteText,
          is_quick: true,
          color: selectedColor,
          position: Date.now(),
        }]);

      if (error) throw error;

      setQuickNoteText('');
      setShowQuickInput(false);
      setSelectedColor('energetic');
      loadNotes();
    } catch (error) {
      console.error('Error saving quick note:', error);
    }
  };

  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingNote) {
        const { error } = await supabase
          .from('notes')
          .update({
            title: formData.title,
            content: formData.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingNote.id)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([{
            user_id: user?.id,
            title: formData.title,
            content: formData.content,
            is_quick: false,
            color: 'default',
            position: Date.now(),
          }]);

        if (error) throw error;
      }

      setFormData({ title: '', content: '' });
      setShowDetailedForm(false);
      setEditingNote(null);
      loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleEdit = (note: Note) => {
    if (note.is_quick) {
      setQuickNoteText(note.content);
      setSelectedColor(note.color);
      setShowQuickInput(true);
      handleDelete(note.id, true);
    } else {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
      });
      setShowDetailedForm(true);
    }
  };

  const handleDelete = async (noteId: string, skipConfirm = false) => {
    if (!skipConfirm && !confirm('Delete this note?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', user?.id);

      if (error) throw error;
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleCancel = () => {
    setShowDetailedForm(false);
    setEditingNote(null);
    setFormData({ title: '', content: '' });
  };

  const quickNotes = notes.filter(n => n.is_quick);
  const detailedNotes = notes.filter(n => !n.is_quick);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Notes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Quick thoughts & detailed notes</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickInput(!showQuickInput)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Zap className="w-5 h-5" />
            Quick Note
          </button>
          <button
            onClick={() => setShowDetailedForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" />
            Detailed Note
          </button>
        </div>
      </div>

      {showQuickInput && (
        <div className="mb-8 animate-fade-in">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl shadow-xl p-6 border-2 border-amber-200 dark:border-gray-500">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">Quick Note</h3>
            </div>
            <textarea
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey) {
                  handleQuickNoteSubmit();
                }
              }}
              placeholder="Capture your thought instantly... (⌘+Enter to save)"
              rows={3}
              autoFocus
              className="w-full px-4 py-3 rounded-xl border-2 border-amber-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none text-base"
            />
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-2">
                {Object.entries(colorGradients).slice(0, -1).map(([key, gradient]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedColor(key)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} transition-all ${
                      selectedColor === key
                        ? 'ring-2 ring-offset-2 ring-amber-500 dark:ring-offset-gray-700 scale-110'
                        : 'hover:scale-110'
                    }`}
                    title={key}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowQuickInput(false);
                    setQuickNoteText('');
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickNoteSubmit}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailedForm && (
        <div className="mb-8 animate-fade-in">
          <div className="bg-white dark:bg-gray-600 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingNote ? 'Edit Note' : 'New Detailed Note'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleDetailedSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter note title..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your detailed note here..."
                  rows={8}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingNote ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {quickNotes.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Quick Thoughts</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({quickNotes.length})
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickNotes.map((note, index) => (
              <div
                key={note.id}
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                  className={`relative bg-gradient-to-br ${
                    colorGradients[note.color as keyof typeof colorGradients]
                  } rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer transform hover:scale-105 hover:-rotate-1 border-2 border-white/30 backdrop-blur-sm ${
                    expandedNote === note.id ? 'scale-105 -rotate-1' : ''
                  }`}
                >
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(note);
                      }}
                      className="p-1.5 bg-white/80 hover:bg-white rounded-lg transition-colors shadow-sm"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      className="p-1.5 bg-white/80 hover:bg-white rounded-lg transition-colors shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                  <div className="flex items-start gap-2 mb-3">
                    <Zap className="w-4 h-4 text-white/90 mt-1 flex-shrink-0" />
                    <p
                      className={`text-white font-medium leading-relaxed ${
                        expandedNote === note.id ? '' : 'line-clamp-4'
                      }`}
                    >
                      {note.content}
                    </p>
                  </div>
                  <div className="text-xs text-white/70 mt-4">
                    {new Date(note.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {detailedNotes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Detailed Notes</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({detailedNotes.length})
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detailedNotes.map((note, index) => (
              <div
                key={note.id}
                className="group bg-white dark:bg-gray-600 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-500 p-6 transform hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold line-clamp-2 flex-1 mr-2">
                    {note.title}
                  </h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(note)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-5 mb-4 whitespace-pre-wrap leading-relaxed">
                  {note.content || 'No content'}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(note.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notes.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-500">
          <div className="inline-block p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full mb-4">
            <FileText className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Start Capturing Your Ideas</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Quick notes for fleeting thoughts, detailed notes for deep thinking
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowQuickInput(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <Zap className="w-5 h-5" />
              Quick Note
            </button>
            <button
              onClick={() => setShowDetailedForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              Detailed Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
