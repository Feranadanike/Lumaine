import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Book, Plus, X, Star, BookOpen, CheckCircle, Clock, Edit2 } from 'lucide-react';

interface BookData {
  id: string;
  title: string;
  author: string;
  status: 'want_to_read' | 'reading' | 'completed';
  rating: number | null;
  review: string;
  notes: string;
  cover_url: string;
  started_date: string | null;
  completed_date: string | null;
  pages: number | null;
  current_page: number;
  created_at: string;
}

export default function Books() {
  const { user } = useAuth();
  const [books, setBooks] = useState<BookData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<BookData | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'want_to_read' | 'reading' | 'completed'>('all');
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    status: 'want_to_read' as const,
    rating: null as number | null,
    review: '',
    notes: '',
    cover_url: '',
    started_date: '',
    completed_date: '',
    pages: null as number | null,
    current_page: 0
  });

  useEffect(() => {
    if (user) {
      loadBooks();
    }
  }, [user]);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      status: 'want_to_read',
      rating: null,
      review: '',
      notes: '',
      cover_url: '',
      started_date: '',
      completed_date: '',
      pages: null,
      current_page: 0
    });
    setEditingBook(null);
    setShowForm(false);
  };

  const handleEdit = (book: BookData) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      status: book.status,
      rating: book.rating,
      review: book.review,
      notes: book.notes,
      cover_url: book.cover_url,
      started_date: book.started_date || '',
      completed_date: book.completed_date || '',
      pages: book.pages,
      current_page: book.current_page
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.author.trim()) return;

    try {
      const bookData = {
        user_id: user?.id,
        title: formData.title,
        author: formData.author,
        status: formData.status,
        rating: formData.rating,
        review: formData.review,
        notes: formData.notes,
        cover_url: formData.cover_url,
        started_date: formData.started_date || null,
        completed_date: formData.completed_date || null,
        pages: formData.pages,
        current_page: formData.current_page
      };

      if (editingBook) {
        const { error } = await supabase
          .from('books')
          .update(bookData)
          .eq('id', editingBook.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('books')
          .insert([bookData]);

        if (error) throw error;
      }

      resetForm();
      loadBooks();
    } catch (error) {
      console.error('Error saving book:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this book?')) return;

    try {
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadBooks();
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'want_to_read':
        return <Clock className="w-5 h-5 text-gray-500" />;
      case 'reading':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'want_to_read':
        return 'Want to Read';
      case 'reading':
        return 'Reading';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const filteredBooks = activeFilter === 'all'
    ? books
    : books.filter(book => book.status === activeFilter);

  const stats = {
    total: books.length,
    want_to_read: books.filter(b => b.status === 'want_to_read').length,
    reading: books.filter(b => b.status === 'reading').length,
    completed: books.filter(b => b.status === 'completed').length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reading List</h1>
          <p className="text-gray-600 mt-1">Track your reading journey</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Book
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Books</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Want to Read</p>
          <p className="text-2xl font-bold text-gray-500">{stats.want_to_read}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Currently Reading</p>
          <p className="text-2xl font-bold text-blue-600">{stats.reading}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'want_to_read', 'reading', 'completed'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {filter === 'all' ? 'All Books' : getStatusLabel(filter)}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Book className="w-5 h-5" />
            {editingBook ? 'Edit Book' : 'Add New Book'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="The Great Gatsby"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="F. Scott Fitzgerald"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="want_to_read">Want to Read</option>
                  <option value="reading">Currently Reading</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Pages
                </label>
                <input
                  type="number"
                  value={formData.pages || ''}
                  onChange={(e) => setFormData({ ...formData, pages: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="350"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Page
                </label>
                <input
                  type="number"
                  value={formData.current_page}
                  onChange={(e) => setFormData({ ...formData, current_page: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Started Date
                </label>
                <input
                  type="date"
                  value={formData.started_date}
                  onChange={(e) => setFormData({ ...formData, started_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Completed Date
                </label>
                <input
                  type="date"
                  value={formData.completed_date}
                  onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        formData.rating && formData.rating >= star
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {formData.rating && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: null })}
                    className="ml-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Review
              </label>
              <textarea
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                placeholder="Your thoughts on this book..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Key takeaways, favorite quotes, etc..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingBook ? 'Update Book' : 'Add Book'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Book className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {activeFilter === 'all'
              ? 'No books yet. Start building your reading list!'
              : `No books in ${getStatusLabel(activeFilter)}`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-xl shadow-sm border-2 border-amber-200 overflow-hidden hover:shadow-lg hover:border-amber-300 transition-all"
            >
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-12 h-16 bg-gradient-to-br from-amber-400 to-orange-400 rounded-md flex items-center justify-center shadow-md">
                    <Book className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-1">{book.title}</h3>
                    <p className="text-sm text-gray-600 italic">by {book.author}</p>
                  </div>
                  {getStatusIcon(book.status)}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs px-2 py-1 bg-white/80 text-gray-700 rounded-full font-medium">
                    {getStatusLabel(book.status)}
                  </span>
                  {book.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(book.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                  )}
                </div>

                {book.pages && (
                  <div className="mb-3 bg-white/60 rounded-lg p-2">
                    <div className="flex justify-between text-xs text-gray-700 mb-1 font-medium">
                      <span>📖 Progress</span>
                      <span>{book.current_page} / {book.pages} pages</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((book.current_page / book.pages) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {book.review && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2 bg-white/60 rounded-lg p-2">{book.review}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(book)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white text-amber-700 rounded-lg hover:bg-amber-100 transition-colors font-medium shadow-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="flex-1 px-3 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium shadow-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
