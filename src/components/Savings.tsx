import { useEffect, useState } from 'react';
import { Plus, X, PiggyBank, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SavingsGoal, SavingsTransaction } from '../types';

export default function Savings() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [newGoal, setNewGoal] = useState({
    goal_name: '',
    target_amount: 0,
    target_date: '',
  });

  const [newTransaction, setNewTransaction] = useState({
    amount: 0,
    transaction_type: 'deposit' as 'deposit' | 'withdrawal',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('savings_goals')
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

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .insert([
          {
            user_id: user.id,
            goal_name: newGoal.goal_name,
            target_amount: newGoal.target_amount,
            target_date: newGoal.target_date || null,
            current_amount: 0,
            is_completed: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setGoals([data, ...goals]);
      setNewGoal({ goal_name: '', target_amount: 0, target_date: '' });
      setShowGoalForm(false);
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedGoal) return;

    try {
      const goal = goals.find((g) => g.id === selectedGoal);
      if (!goal) return;

      const newAmount =
        newTransaction.transaction_type === 'deposit'
          ? goal.current_amount + newTransaction.amount
          : goal.current_amount - newTransaction.amount;

      await supabase.from('savings_transactions').insert([
        {
          goal_id: selectedGoal,
          user_id: user.id,
          amount: newTransaction.amount,
          transaction_type: newTransaction.transaction_type,
          notes: newTransaction.notes || null,
        },
      ]);

      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({
          current_amount: newAmount,
          is_completed: newAmount >= goal.target_amount,
        })
        .eq('id', selectedGoal);

      if (updateError) throw updateError;

      await loadGoals();
      setNewTransaction({ amount: 0, transaction_type: 'deposit', notes: '' });
      setShowTransactionForm(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const calculateProgress = (goal: SavingsGoal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const calculateDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <PiggyBank className="h-8 w-8 text-teal-400" />
            Savings
          </h1>
          <p className="text-slate-600 mt-1">Track your savings goals and progress</p>
        </div>
        <button
          onClick={() => setShowGoalForm(true)}
          className="flex items-center gap-2 bg-teal-400 text-white px-4 py-2 rounded-lg hover:bg-teal-500 transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          New Goal
        </button>
      </div>

      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">New Savings Goal</h2>
              <button onClick={() => setShowGoalForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Goal Name</label>
                <input
                  type="text"
                  value={newGoal.goal_name}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                  placeholder="e.g., Emergency Fund"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Amount</label>
                <input
                  type="number"
                  value={newGoal.target_amount || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, target_amount: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Date (optional)</label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-teal-400 text-white py-3 rounded-lg hover:bg-teal-500 font-medium transition-colors shadow-lg"
              >
                Create Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Add Transaction</h2>
              <button
                onClick={() => {
                  setShowTransactionForm(false);
                  setSelectedGoal(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="deposit"
                      checked={newTransaction.transaction_type === 'deposit'}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          transaction_type: e.target.value as 'deposit' | 'withdrawal',
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-slate-700">Deposit</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="withdrawal"
                      checked={newTransaction.transaction_type === 'withdrawal'}
                      onChange={(e) =>
                        setNewTransaction({
                          ...newTransaction,
                          transaction_type: e.target.value as 'deposit' | 'withdrawal',
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-slate-700">Withdrawal</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={newTransaction.amount || ''}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })
                  }
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                  placeholder="100.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-400"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-teal-400 text-white py-3 rounded-lg hover:bg-teal-500 font-medium transition-colors shadow-lg"
              >
                Add Transaction
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <PiggyBank className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No savings goals yet. Create your first goal!</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal);
            const daysRemaining = goal.target_date ? calculateDaysRemaining(goal.target_date) : null;

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-2xl shadow-lg p-6 ${
                  goal.is_completed ? 'border-2 border-green-400' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{goal.goal_name}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                      </div>
                      {goal.target_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {daysRemaining !== null && daysRemaining >= 0 ? `${daysRemaining} days left` : 'Past due'}
                        </div>
                      )}
                    </div>
                  </div>
                  {goal.is_completed && (
                    <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
                      Completed
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>Progress</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-300 to-emerald-300 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {!goal.is_completed && (
                  <button
                    onClick={() => {
                      setSelectedGoal(goal.id);
                      setShowTransactionForm(true);
                    }}
                    className="w-full bg-teal-50 text-teal-700 py-2 rounded-lg hover:bg-teal-100 font-medium transition-colors"
                  >
                    Add Transaction
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
