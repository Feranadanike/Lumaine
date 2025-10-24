import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, X, Calendar, Gift, Heart, Edit2, Cake, PartyPopper } from 'lucide-react';

interface Relationship {
  id: string;
  name: string;
  relationship_type: 'family' | 'friend' | 'partner' | 'colleague' | 'other';
  birthday: string | null;
  anniversary_date: string | null;
  other_important_dates: Array<{ name: string; date: string }>;
  gift_ideas: string[];
  notes: string;
  created_at: string;
}

interface UpcomingDate {
  personName: string;
  personId: string;
  eventType: string;
  date: Date;
  daysUntil: number;
}

export default function Relationships() {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Relationship | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship_type: 'friend' as const,
    birthday: '',
    anniversary_date: '',
    other_important_dates: [] as Array<{ name: string; date: string }>,
    gift_ideas: [] as string[],
    notes: '',
    newDateName: '',
    newDateValue: '',
    newGiftIdea: ''
  });

  useEffect(() => {
    if (user) {
      loadRelationships();
    }
  }, [user]);

  const loadRelationships = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('social_relationships')
        .select('*')
        .order('name');

      if (error) throw error;
      setRelationships(data || []);
    } catch (error) {
      console.error('Error loading relationships:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      relationship_type: 'friend',
      birthday: '',
      anniversary_date: '',
      other_important_dates: [],
      gift_ideas: [],
      notes: '',
      newDateName: '',
      newDateValue: '',
      newGiftIdea: ''
    });
    setEditingRelationship(null);
    setShowForm(false);
  };

  const handleEdit = (relationship: Relationship) => {
    setEditingRelationship(relationship);
    setFormData({
      name: relationship.name,
      relationship_type: relationship.relationship_type,
      birthday: relationship.birthday || '',
      anniversary_date: relationship.anniversary_date || '',
      other_important_dates: relationship.other_important_dates || [],
      gift_ideas: relationship.gift_ideas || [],
      notes: relationship.notes,
      newDateName: '',
      newDateValue: '',
      newGiftIdea: ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const relationshipData = {
        user_id: user?.id,
        name: formData.name,
        relationship_type: formData.relationship_type,
        birthday: formData.birthday || null,
        anniversary_date: formData.anniversary_date || null,
        other_important_dates: formData.other_important_dates,
        gift_ideas: formData.gift_ideas,
        notes: formData.notes
      };

      if (editingRelationship) {
        const { error } = await supabase
          .from('social_relationships')
          .update(relationshipData)
          .eq('id', editingRelationship.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('social_relationships')
          .insert([relationshipData]);

        if (error) throw error;
      }

      resetForm();
      loadRelationships();
    } catch (error) {
      console.error('Error saving relationship:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this person?')) return;

    try {
      const { error } = await supabase
        .from('social_relationships')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadRelationships();
      setSelectedPerson(null);
    } catch (error) {
      console.error('Error deleting relationship:', error);
    }
  };

  const addImportantDate = () => {
    if (formData.newDateName.trim() && formData.newDateValue) {
      setFormData({
        ...formData,
        other_important_dates: [
          ...formData.other_important_dates,
          { name: formData.newDateName, date: formData.newDateValue }
        ],
        newDateName: '',
        newDateValue: ''
      });
    }
  };

  const removeImportantDate = (index: number) => {
    setFormData({
      ...formData,
      other_important_dates: formData.other_important_dates.filter((_, i) => i !== index)
    });
  };

  const addGiftIdea = () => {
    if (formData.newGiftIdea.trim() && !formData.gift_ideas.includes(formData.newGiftIdea.trim())) {
      setFormData({
        ...formData,
        gift_ideas: [...formData.gift_ideas, formData.newGiftIdea.trim()],
        newGiftIdea: ''
      });
    }
  };

  const removeGiftIdea = (idea: string) => {
    setFormData({
      ...formData,
      gift_ideas: formData.gift_ideas.filter(g => g !== idea)
    });
  };

  const getUpcomingDates = (): UpcomingDate[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDates: UpcomingDate[] = [];

    relationships.forEach((person) => {
      if (person.birthday) {
        const birthday = new Date(person.birthday);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        upcomingDates.push({
          personName: person.name,
          personId: person.id,
          eventType: 'Birthday',
          date: thisYearBirthday,
          daysUntil
        });
      }

      if (person.anniversary_date) {
        const anniversary = new Date(person.anniversary_date);
        const thisYearAnniversary = new Date(today.getFullYear(), anniversary.getMonth(), anniversary.getDate());
        if (thisYearAnniversary < today) {
          thisYearAnniversary.setFullYear(today.getFullYear() + 1);
        }
        const daysUntil = Math.ceil((thisYearAnniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        upcomingDates.push({
          personName: person.name,
          personId: person.id,
          eventType: 'Anniversary',
          date: thisYearAnniversary,
          daysUntil
        });
      }

      person.other_important_dates?.forEach((importantDate) => {
        const date = new Date(importantDate.date);
        const thisYearDate = new Date(today.getFullYear(), date.getMonth(), date.getDate());
        if (thisYearDate < today) {
          thisYearDate.setFullYear(today.getFullYear() + 1);
        }
        const daysUntil = Math.ceil((thisYearDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        upcomingDates.push({
          personName: person.name,
          personId: person.id,
          eventType: importantDate.name,
          date: thisYearDate,
          daysUntil
        });
      });
    });

    return upcomingDates
      .filter((d) => d.daysUntil >= 0 && d.daysUntil <= 90)
      .sort((a, b) => a.daysUntil - b.daysUntil);
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'partner':
        return <Heart className="w-5 h-5 text-gray-500" />;
      case 'family':
        return <Users className="w-5 h-5 text-gray-500" />;
      default:
        return <Users className="w-5 h-5 text-gray-500" />;
    }
  };

  const upcomingDates = getUpcomingDates();

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
          <h1 className="text-3xl font-bold text-gray-900">Relationships</h1>
          <p className="text-gray-600 mt-1">Track important people and dates in your life</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Person
        </button>
      </div>

      {upcomingDates.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-600" />
            Upcoming Events (Next 90 Days)
          </h3>
          <div className="space-y-3">
            {upcomingDates.slice(0, 5).map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white rounded-lg p-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3">
                  {event.eventType === 'Birthday' ? (
                    <Cake className="w-5 h-5 text-pink-500" />
                  ) : event.eventType === 'Anniversary' ? (
                    <Heart className="w-5 h-5 text-red-500" />
                  ) : (
                    <PartyPopper className="w-5 h-5 text-purple-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {event.personName} - {event.eventType}
                    </p>
                    <p className="text-sm text-gray-600">
                      {event.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {event.daysUntil === 0
                      ? 'Today!'
                      : event.daysUntil === 1
                      ? 'Tomorrow'
                      : `In ${event.daysUntil} days`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {editingRelationship ? 'Edit Person' : 'Add New Person'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship Type
                </label>
                <select
                  value={formData.relationship_type}
                  onChange={(e) => setFormData({ ...formData, relationship_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="friend">Friend</option>
                  <option value="family">Family</option>
                  <option value="partner">Partner</option>
                  <option value="colleague">Colleague</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Birthday
                </label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anniversary Date
                </label>
                <input
                  type="date"
                  value={formData.anniversary_date}
                  onChange={(e) => setFormData({ ...formData, anniversary_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Other Important Dates
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.newDateName}
                  onChange={(e) => setFormData({ ...formData, newDateName: e.target.value })}
                  placeholder="Event name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={formData.newDateValue}
                  onChange={(e) => setFormData({ ...formData, newDateValue: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addImportantDate}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.other_important_dates.length > 0 && (
                <div className="space-y-2">
                  {formData.other_important_dates.map((date, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div>
                        <p className="font-medium text-gray-900">{date.name}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(date.date).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImportantDate(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gift Ideas
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={formData.newGiftIdea}
                  onChange={(e) => setFormData({ ...formData, newGiftIdea: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGiftIdea())}
                  placeholder="Add a gift idea"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addGiftIdea}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.gift_ideas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.gift_ideas.map((idea) => (
                    <span
                      key={idea}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      <Gift className="w-3 h-3" />
                      {idea}
                      <button
                        type="button"
                        onClick={() => removeGiftIdea(idea)}
                        className="hover:text-green-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this person..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingRelationship ? 'Update Person' : 'Add Person'}
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

      {relationships.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No relationships added yet. Start tracking important people!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {relationships.map((person) => (
            <div
              key={person.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {getRelationshipIcon(person.relationship_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{person.name}</h3>
                  <span className="text-xs text-gray-600 capitalize">
                    {person.relationship_type}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                {person.birthday && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Cake className="w-4 h-4" />
                    {new Date(person.birthday).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                )}
                {person.anniversary_date && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Heart className="w-4 h-4" />
                    {new Date(person.anniversary_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                )}
                {person.gift_ideas.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Gift className="w-4 h-4" />
                    {person.gift_ideas.length} gift {person.gift_ideas.length === 1 ? 'idea' : 'ideas'}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPerson(person)}
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(person)}
                  className="flex items-center justify-center px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPerson && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPerson(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPerson.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getRelationshipIcon(selectedPerson.relationship_type)}
                      <span className="text-gray-600 capitalize">{selectedPerson.relationship_type}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {(selectedPerson.birthday || selectedPerson.anniversary_date || selectedPerson.other_important_dates.length > 0) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Important Dates
                    </h3>
                    <div className="space-y-2">
                      {selectedPerson.birthday && (
                        <div className="flex items-center gap-3 bg-pink-50 rounded-lg p-3">
                          <Cake className="w-5 h-5 text-pink-500" />
                          <div>
                            <p className="font-medium text-gray-900">Birthday</p>
                            <p className="text-sm text-gray-600">
                              {new Date(selectedPerson.birthday).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedPerson.anniversary_date && (
                        <div className="flex items-center gap-3 bg-red-50 rounded-lg p-3">
                          <Heart className="w-5 h-5 text-red-500" />
                          <div>
                            <p className="font-medium text-gray-900">Anniversary</p>
                            <p className="text-sm text-gray-600">
                              {new Date(selectedPerson.anniversary_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      )}
                      {selectedPerson.other_important_dates.map((date, index) => (
                        <div key={index} className="flex items-center gap-3 bg-purple-50 rounded-lg p-3">
                          <PartyPopper className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="font-medium text-gray-900">{date.name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(date.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPerson.gift_ideas.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Gift className="w-5 h-5" />
                      Gift Ideas
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPerson.gift_ideas.map((idea) => (
                        <span
                          key={idea}
                          className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm"
                        >
                          {idea}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPerson.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                      {selectedPerson.notes}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => handleDelete(selectedPerson.id)}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Person
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
