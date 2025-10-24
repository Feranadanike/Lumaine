import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SavedLink } from '../types';
import { Bookmark, Plus, X, Edit2, Trash2, ExternalLink, Search, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'Groceries',
  'Clothing & Fashion',
  'Videos',
  'Articles & Reading',
  'Gift Ideas',
  'Home & Decor',
  'Tech & Gadgets',
  'Recipes',
  'Other'
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  'Groceries': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-100' },
  'Clothing & Fashion': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', icon: 'bg-pink-100' },
  'Videos': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'bg-red-100' },
  'Articles & Reading': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-100' },
  'Gift Ideas': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'bg-purple-100' },
  'Home & Decor': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-100' },
  'Tech & Gadgets': { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'bg-cyan-100' },
  'Recipes': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: 'bg-orange-100' },
  'Other': { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'bg-gray-100' }
};

export default function SavedLinks() {
  const { user } = useAuth();
  const [links, setLinks] = useState<SavedLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<SavedLink | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    url: '',
    title: '',
    description: '',
    category: 'Other',
    tags: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_links')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching links:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = formData.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const linkData = {
      user_id: user?.id,
      url: formData.url,
      title: formData.title || null,
      description: formData.description,
      category: formData.category,
      tags: tagsArray,
      notes: formData.notes || null
    };

    try {
      if (editingLink) {
        const { error } = await supabase
          .from('saved_links')
          .update({ ...linkData, updated_at: new Date().toISOString() })
          .eq('id', editingLink.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_links')
          .insert([linkData]);

        if (error) throw error;
      }

      setFormData({
        url: '',
        title: '',
        description: '',
        category: 'Other',
        tags: '',
        notes: ''
      });
      setShowForm(false);
      setEditingLink(null);
      fetchLinks();
    } catch (error) {
      console.error('Error saving link:', error);
    }
  };

  const handleEdit = (link: SavedLink) => {
    setEditingLink(link);
    setFormData({
      url: link.url,
      title: link.title || '',
      description: link.description,
      category: link.category,
      tags: link.tags?.join(', ') || '',
      notes: link.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this link?')) return;

    try {
      const { error } = await supabase
        .from('saved_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchLinks();
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };


  const cancelForm = () => {
    setShowForm(false);
    setEditingLink(null);
    setFormData({
      url: '',
      title: '',
      description: '',
      category: 'Other',
      tags: '',
      notes: ''
    });
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };


  const filteredLinks = links.filter(link => {
    return searchQuery === '' ||
      link.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const linksByCategory = CATEGORIES.reduce((acc, category) => {
    acc[category] = filteredLinks.filter(link => link.category === category);
    return acc;
  }, {} as Record<string, SavedLink[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading saved links...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Bookmark className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saved Links</h1>
            <p className="text-sm text-gray-600">Your bookmarked favorites, organized beautifully</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add Link'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingLink ? 'Edit Link' : 'Add New Link'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Give it a memorable name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Why did you save this?"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="summer, sale, wishlist"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Any extra details..."
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
                {editingLink ? 'Update Link' : 'Save Link'}
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
            placeholder="Search your links..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredLinks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No links saved yet</h3>
          <p className="text-gray-600">Click "Add Link" to start bookmarking your favorite finds</p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const categoryLinks = linksByCategory[category];
            if (categoryLinks.length === 0) return null;

            const isCollapsed = collapsedCategories.has(category);
            const colors = CATEGORY_COLORS[category];

            return (
              <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${colors.bg}`}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className={`w-5 h-5 ${colors.text}`} />
                    ) : (
                      <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                    )}
                    <h2 className={`text-lg font-semibold ${colors.text}`}>{category}</h2>
                    <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${colors.icon} ${colors.text}`}>
                      {categoryLinks.length}
                    </span>
                  </div>
                </button>

                {!isCollapsed && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryLinks.map((link) => (
                      <div
                        key={link.id}
                        className={`relative group border-2 ${colors.border} rounded-lg p-4 hover:shadow-md transition-all`}
                      >
                        <div className="mb-3">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {link.title || 'Untitled'}
                          </h3>

                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {link.description}
                          </p>

                          <div className="text-xs text-gray-500 mb-3">
                            {getDomainFromUrl(link.url)}
                          </div>

                          {link.tags && link.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {link.tags.slice(0, 2).map((tag, index) => (
                                <span
                                  key={index}
                                  className={`px-2 py-0.5 ${colors.bg} ${colors.text} rounded text-xs`}
                                >
                                  {tag}
                                </span>
                              ))}
                              {link.tags.length > 2 && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{link.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 ${colors.bg} ${colors.text} rounded-lg hover:opacity-80 transition-opacity text-sm font-medium`}
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open
                          </a>
                          <button
                            onClick={() => handleEdit(link)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 mb-1">Organization Tips</h4>
          <p className="text-sm text-blue-800">
            Categories auto-group your links for easy browsing. Use tags for cross-category themes like "urgent" or "wishlist".
          </p>
        </div>
      </div>
    </div>
  );
}