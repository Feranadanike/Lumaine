import { useEffect, useState } from 'react';
import { Plus, X, Target, Edit2, Trash2, TrendingUp, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Goal {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  target_date: string | null;
  status: string;
  daily_task_enabled: boolean;
  daily_task_description: string | null;
  created_at: string;
  updated_at: string;
}

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  const [newGoal, setNewGoal] = useState({
    category: 'fitness',
    title: '',
    description: '',
    target_value: '',
    current_value: '0',
    target_date: '',
    status: 'active',
    daily_task_enabled: false,
    daily_task_description: '',
  });

  const categories = [
    { value: 'fitness', label: 'Fitness', color: 'from-orange-400 to-red-400' },
    { value: 'skincare', label: 'Skincare', color: 'from-pink-400 to-rose-400' },
    { value: 'wellness', label: 'Wellness', color: 'from-purple-400 to-indigo-400' },
    { value: 'financial', label: 'Financial', color: 'from-green-400 to-teal-400' },
    { value: 'hobby', label: 'Hobby', color: 'from-amber-400 to-yellow-400' },
  ];

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingGoal) {
        const { data, error } = await supabase
          .from('goals')
          .update({
            category: newGoal.category,
            title: newGoal.title,
            description: newGoal.description || null,
            target_value: newGoal.target_value ? parseFloat(newGoal.target_value) : null,
            current_value: parseFloat(newGoal.current_value) || 0,
            target_date: newGoal.target_date || null,
            status: newGoal.status,
            daily_task_enabled: newGoal.daily_task_enabled,
            daily_task_description: newGoal.daily_task_description || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingGoal.id)
          .select()
          .single();

        if (error) throw error;
        setGoals(goals.map((g) => (g.id === data.id ? data : g)));
        setEditingGoal(null);
      } else {
        const { data, error } = await supabase
          .from('goals')
          .insert([
            {
              user_id: user.id,
              category: newGoal.category,
              title: newGoal.title,
              description: newGoal.description || null,
              target_value: newGoal.target_value ? parseFloat(newGoal.target_value) : null,
              current_value: parseFloat(newGoal.current_value) || 0,
              target_date: newGoal.target_date || null,
              status: newGoal.status,
              daily_task_enabled: newGoal.daily_task_enabled,
              daily_task_description: newGoal.daily_task_description || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        setGoals([data, ...goals]);
      }

      setNewGoal({
        category: 'fitness',
        title: '',
        description: '',
        target_value: '',
        current_value: '0',
        target_date: '',
        status: 'active',
        daily_task_enabled: false,
        daily_task_description: '',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving goal:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      setGoals(goals.filter((g) => g.id !== id));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleEdit = (goal: Goal) => {
    setNewGoal({
      category: goal.category,
      title: goal.title,
      description: goal.description || '',
      target_value: goal.target_value?.toString() || '',
      current_value: goal.current_value.toString(),
      target_date: goal.target_date || '',
      status: goal.status,
      daily_task_enabled: goal.daily_task_enabled,
      daily_task_description: goal.daily_task_description || '',
    });
    setEditingGoal(goal);
    setShowForm(true);
  };

  const calculateProgress = (goal: Goal) => {
    if (!goal.target_value) return 0;
    return Math.min(100, (goal.current_value / goal.target_value) * 100);
  };

  const getCategoryColor = (category: string) => {
    return categories.find((c) => c.value === category)?.color || 'from-gray-400 to-gray-500';
  };


  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Target className="h-8 w-8 text-indigo-500" />
            Goals
          </h1>
          <p className="text-slate-600 mt-1">Set and track your personal goals</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          New Goal
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingGoal ? 'Edit Goal' : 'New Goal'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Run a 5K marathon"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your goal and why it matters to you..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Value (optional)
                  </label>
                  <input
                    type="number"
                    value={newGoal.target_value}
                    onChange={(e) => setNewGoal({ ...newGoal, target_value: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="e.g., 10 for 10 workouts"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Current Progress
                  </label>
                  <input
                    type="number"
                    value={newGoal.current_value}
                    onChange={(e) => setNewGoal({ ...newGoal, current_value: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Date (optional)
                  </label>
                  <input
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={newGoal.status}
                    onChange={(e) => setNewGoal({ ...newGoal, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGoal.daily_task_enabled}
                    onChange={(e) => setNewGoal({ ...newGoal, daily_task_enabled: e.target.checked })}
                    className="w-5 h-5 text-indigo-500 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-700">Show in Today's Tasks</span>
                    <p className="text-xs text-slate-500">Add a daily reminder for this goal</p>
                  </div>
                </label>

                {newGoal.daily_task_enabled && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Daily Task Description
                    </label>
                    <input
                      type="text"
                      value={newGoal.daily_task_description}
                      onChange={(e) => setNewGoal({ ...newGoal, daily_task_description: e.target.value })}
                      placeholder="e.g., Practice piano for 30 minutes"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-500 text-white py-3 rounded-lg hover:bg-indigo-600 font-medium transition-colors shadow-lg"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {activeGoals.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Active Goals</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getCategoryColor(
                          goal.category
                        )} mb-2`}
                      >
                        {categories.find((c) => c.value === goal.category)?.label}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-slate-600 mt-1">{goal.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {goal.target_value && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-medium text-slate-900">
                          {goal.current_value} / {goal.target_value}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${getCategoryColor(
                            goal.category
                          )} transition-all duration-300`}
                          style={{ width: `${calculateProgress(goal)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {goal.target_date && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                      <TrendingUp className="h-4 w-4" />
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Completed Goals</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {completedGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-gradient-to-br from-green-50 to-teal-50 rounded-2xl shadow-lg p-6 border-2 border-green-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-green-700">Completed</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{goal.title}</h3>
                      {goal.description && (
                        <p className="text-sm text-slate-600 mt-1">{goal.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {goals.length === 0 && (
          <div className="text-center py-16">
            <Target className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-slate-600 mb-2">No goals yet</h3>
            <p className="text-slate-500 mb-4">Start by creating your first goal!</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-lg hover:bg-indigo-600 transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Create Your First Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
