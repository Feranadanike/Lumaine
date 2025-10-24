import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { EntertainmentItem } from '../types';
import { Film, Plus, X, Edit2, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react';

const TYPES = ['Book', 'Movie', 'TV Show', 'Artist', 'Podcast'] as const;

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Book': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  'Movie': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  'TV Show': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  'Artist': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  'Podcast': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' }
};

export default function Entertainment() {
  const { user } = useAuth();
  const [items, setItems] = useState<EntertainmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<EntertainmentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    title: '',
    type: 'Movie' as typeof TYPES[number],
    where_to_find: '',
    notes: '',
    playlist: ''
  });

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('entertainment_items')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const itemData = {
      user_id: user?.id,
      title: formData.title,
      type: formData.type,
      where_to_find: formData.where_to_find || null,
      notes: formData.notes || null,
      playlist: formData.playlist || null
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('entertainment_items')
          .update({ ...itemData, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('entertainment_items')
          .insert([itemData]);

        if (error) throw error;
      }

      setFormData({
        title: '',
        type: 'Movie',
        where_to_find: '',
        notes: '',
        playlist: ''
      });
      setShowForm(false);
      setEditingItem(null);
      fetchItems();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleEdit = (item: EntertainmentItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      type: item.type,
      where_to_find: item.where_to_find || '',
      notes: item.notes || '',
      playlist: item.playlist || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this from your list?')) return;

    try {
      const { error } = await supabase
        .from('entertainment_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      title: '',
      type: 'Movie',
      where_to_find: '',
      notes: '',
      playlist: ''
    });
  };

  const toggleCategory = (type: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(type)) {
      newCollapsed.delete(type);
    } else {
      newCollapsed.add(type);
    }
    setCollapsedCategories(newCollapsed);
  };

  const filteredItems = items.filter(item => {
    return searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.where_to_find?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.playlist?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get unique playlists for autocomplete
  const existingPlaylists = Array.from(new Set(
    items.map(item => item.playlist).filter(Boolean)
  )).sort();

  // Group items by playlist
  const itemsByPlaylist = filteredItems.reduce((acc, item) => {
    const playlistName = item.playlist || 'Uncategorized';
    if (!acc[playlistName]) {
      acc[playlistName] = [];
    }
    acc[playlistName].push(item);
    return acc;
  }, {} as Record<string, EntertainmentItem[]>);

  // Sort playlists: Uncategorized last, rest alphabetically
  const sortedPlaylistNames = Object.keys(itemsByPlaylist).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Film className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Entertainment</h1>
            <p className="text-sm text-gray-600">Quick list for things you want to check out</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? 'Edit Item' : 'Quick Add'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Name of the book, movie, show..."
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof TYPES[number] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Playlist (Optional)
                </label>
                <input
                  type="text"
                  list="playlists"
                  value={formData.playlist}
                  onChange={(e) => setFormData({ ...formData, playlist: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Horror Romance, 90s Action..."
                />
                <datalist id="playlists">
                  {existingPlaylists.map(playlist => (
                    <option key={playlist} value={playlist} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Where to Find It
                </label>
                <input
                  type="text"
                  value={formData.where_to_find}
                  onChange={(e) => setFormData({ ...formData, where_to_find: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Netflix, Spotify, Library..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quick Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sarah recommended, trending on TikTok..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelForm}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingItem ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your list..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Film className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nothing here yet</h3>
          <p className="text-gray-600">Jot down that show everyone's talking about</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedPlaylistNames.map((playlistName) => {
            const playlistItems = itemsByPlaylist[playlistName];
            if (playlistItems.length === 0) return null;

            const isCollapsed = collapsedCategories.has(playlistName);
            const isUncategorized = playlistName === 'Uncategorized';

            return (
              <div key={playlistName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleCategory(playlistName)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                    isUncategorized ? 'bg-gray-50' : 'bg-gradient-to-r from-blue-50 to-cyan-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-blue-600" />
                    )}
                    <h2 className={`text-lg font-semibold ${
                      isUncategorized ? 'text-gray-700' : 'text-blue-700'
                    }`}>
                      {playlistName}
                    </h2>
                    <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${
                      isUncategorized ? 'bg-gray-200 text-gray-700' : 'bg-white text-blue-700'
                    }`}>
                      {playlistItems.length}
                    </span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="p-4 space-y-2">
                    {playlistItems.map((item) => {
                      const colors = TYPE_COLORS[item.type];
                      return (
                        <div
                          key={item.id}
                          className={`border-l-4 ${colors.border} bg-gray-50 rounded-r-lg p-4 hover:shadow-sm transition-all`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">
                                  {item.title}
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}>
                                  {item.type}
                                </span>
                              </div>
                              {item.where_to_find && (
                                <p className="text-sm text-gray-600 mb-1">
                                  <span className="text-gray-500">On:</span> {item.where_to_find}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-sm text-gray-600 italic">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-2 text-gray-600 hover:bg-white rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
