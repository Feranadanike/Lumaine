import { useEffect, useState } from 'react';
import { Plus, X, CreditCard, Star, Search, Edit2, Trash2, Save, Wallet as WalletIcon } from 'lucide-react';
import Barcode from 'react-barcode';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface LoyaltyCard {
  id: string;
  card_name: string;
  card_number: string;
  barcode_type: string;
  category: string;
  color: string;
  notes: string;
  is_favorite: boolean;
  points_balance: string;
  expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

const categories = [
  { value: 'grocery', label: 'Grocery', icon: '🛒' },
  { value: 'coffee', label: 'Coffee', icon: '☕' },
  { value: 'retail', label: 'Retail', icon: '🛍️' },
  { value: 'gas', label: 'Gas', icon: '⛽' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { value: 'gym', label: 'Gym', icon: '💪' },
  { value: 'other', label: 'Other', icon: '📇' },
];

const colorOptions = [
  { value: 'red', label: 'Red', class: 'from-red-500 to-red-600' },
  { value: 'orange', label: 'Orange', class: 'from-orange-500 to-orange-600' },
  { value: 'amber', label: 'Amber', class: 'from-amber-500 to-amber-600' },
  { value: 'green', label: 'Green', class: 'from-green-500 to-green-600' },
  { value: 'teal', label: 'Teal', class: 'from-teal-500 to-teal-600' },
  { value: 'blue', label: 'Blue', class: 'from-blue-500 to-blue-600' },
  { value: 'indigo', label: 'Indigo', class: 'from-indigo-500 to-indigo-600' },
  { value: 'purple', label: 'Purple', class: 'from-purple-500 to-purple-600' },
  { value: 'pink', label: 'Pink', class: 'from-pink-500 to-pink-600' },
  { value: 'gray', label: 'Gray', class: 'from-gray-500 to-gray-600' },
];

const barcodeTypes = [
  { value: 'CODE128', label: 'Code 128' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'EAN8', label: 'EAN-8' },
  { value: 'UPC', label: 'UPC' },
];

export default function Wallet() {
  const { user } = useAuth();
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<LoyaltyCard | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    card_name: '',
    card_number: '',
    barcode_type: 'CODE128',
    category: 'other',
    color: 'blue',
    notes: '',
    is_favorite: false,
    points_balance: '',
    expiry_date: '',
  });

  useEffect(() => {
    if (user) {
      loadCards();
    }
  }, [user]);

  const loadCards = async () => {
    try {
      const { data, error } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_favorite', { ascending: false })
        .order('card_name', { ascending: true });

      if (error) throw error;
      if (data) setCards(data);
    } catch (error) {
      console.error('Error loading cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.card_name.trim() || !formData.card_number.trim()) return;

    try {
      if (editingCard) {
        const { error } = await supabase
          .from('loyalty_cards')
          .update({
            ...formData,
            expiry_date: formData.expiry_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCard.id)
          .eq('user_id', user?.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_cards')
          .insert([{
            user_id: user?.id,
            ...formData,
            expiry_date: formData.expiry_date || null,
          }]);

        if (error) throw error;
      }

      setFormData({
        card_name: '',
        card_number: '',
        barcode_type: 'CODE128',
        category: 'other',
        color: 'blue',
        notes: '',
        is_favorite: false,
        points_balance: '',
        expiry_date: '',
      });
      setShowForm(false);
      setEditingCard(null);
      loadCards();
    } catch (error) {
      console.error('Error saving card:', error);
    }
  };

  const handleEdit = (card: LoyaltyCard) => {
    setEditingCard(card);
    setFormData({
      card_name: card.card_name,
      card_number: card.card_number,
      barcode_type: card.barcode_type,
      category: card.category,
      color: card.color,
      notes: card.notes,
      is_favorite: card.is_favorite,
      points_balance: card.points_balance,
      expiry_date: card.expiry_date || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Delete this loyalty card?')) return;

    try {
      const { error } = await supabase
        .from('loyalty_cards')
        .delete()
        .eq('id', cardId)
        .eq('user_id', user?.id);

      if (error) throw error;
      loadCards();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const toggleFavorite = async (card: LoyaltyCard) => {
    try {
      const { error } = await supabase
        .from('loyalty_cards')
        .update({ is_favorite: !card.is_favorite })
        .eq('id', card.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      loadCards();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCard(null);
    setFormData({
      card_name: '',
      card_number: '',
      barcode_type: 'CODE128',
      category: 'other',
      color: 'blue',
      notes: '',
      is_favorite: false,
      points_balance: '',
      expiry_date: '',
    });
  };

  const filteredCards = cards.filter((card) => {
    const matchesSearch = card.card_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         card.card_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || card.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getColorClass = (color: string) => {
    return colorOptions.find(c => c.value === color)?.class || 'from-blue-500 to-blue-600';
  };

  const getCategoryEmoji = (category: string) => {
    return categories.find(c => c.value === category)?.icon || '📇';
  };

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
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <WalletIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Wallet</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Your loyalty cards in one place</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Add Card
        </button>
      </div>

      {showForm && (
        <div className="mb-8 animate-fade-in">
          <div className="bg-white dark:bg-gray-600 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingCard ? 'Edit Card' : 'Add New Card'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Store/Brand Name</label>
                  <input
                    type="text"
                    value={formData.card_name}
                    onChange={(e) => setFormData({ ...formData, card_name: e.target.value })}
                    placeholder="e.g., Starbucks, Target"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Card Number</label>
                  <input
                    type="text"
                    value={formData.card_number}
                    onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
                    placeholder="Enter card/barcode number"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Barcode Type</label>
                  <select
                    value={formData.barcode_type}
                    onChange={(e) => setFormData({ ...formData, barcode_type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {barcodeTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Card Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color.class} transition-all ${
                          formData.color === color.value
                            ? 'ring-2 ring-offset-2 ring-purple-500 dark:ring-offset-gray-700 scale-110'
                            : 'hover:scale-110'
                        }`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Points/Balance (Optional)</label>
                  <input
                    type="text"
                    value={formData.points_balance}
                    onChange={(e) => setFormData({ ...formData, points_balance: e.target.value })}
                    placeholder="e.g., 1,250 points"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="e.g., Member ID, phone number"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_favorite}
                    onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                    className="w-4 h-4 text-purple-500 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Mark as favorite</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingCard ? 'Update' : 'Save'}
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

      {cards.length > 0 && (
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-400 bg-white dark:bg-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {filteredCards.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card, index) => (
            <div
              key={card.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={`relative bg-gradient-to-br ${getColorClass(card.color)} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group`}
              >
                <div className="absolute top-3 right-3 flex gap-1">
                  <button
                    onClick={() => toggleFavorite(card)}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-sm"
                    title={card.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        card.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleEdit(card)}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-2 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-3xl">{getCategoryEmoji(card.category)}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{card.card_name}</h3>
                      <p className="text-white/80 text-sm">
                        {categories.find(c => c.value === card.category)?.label}
                      </p>
                    </div>
                  </div>

                  {card.points_balance && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 mb-4">
                      <p className="text-white text-sm font-medium">{card.points_balance}</p>
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                    className="w-full bg-white/90 hover:bg-white backdrop-blur-sm rounded-lg px-4 py-3 transition-colors flex items-center justify-center gap-2 font-medium text-gray-800"
                  >
                    <CreditCard className="w-4 h-4" />
                    {expandedCard === card.id ? 'Hide Barcode' : 'Show Barcode'}
                  </button>

                  {expandedCard === card.id && (
                    <div className="mt-4 bg-white rounded-lg p-4 animate-fade-in">
                      <div className="flex justify-center mb-2">
                        <Barcode
                          value={card.card_number}
                          format={card.barcode_type}
                          width={1.5}
                          height={60}
                          displayValue={true}
                          fontSize={14}
                        />
                      </div>
                      {card.notes && (
                        <p className="text-xs text-gray-600 text-center mt-2">{card.notes}</p>
                      )}
                      {card.expiry_date && (
                        <p className="text-xs text-gray-500 text-center mt-1">
                          Expires: {new Date(card.expiry_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : cards.length > 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-2xl">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No cards found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-2xl border-2 border-dashed border-purple-300 dark:border-gray-500">
          <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <WalletIcon className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">Your Digital Wallet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            Add your loyalty cards and never miss out on rewards again
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Add Your First Card
          </button>
        </div>
      )}
    </div>
  );
}
