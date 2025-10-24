import { useEffect, useState } from 'react';
import { Plus, X, Wallet, CreditCard, RefreshCw, Calendar, DollarSign, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SavingsGoal, Bill, Subscription, UserProfile } from '../types';
import { getCurrencySymbol } from '../lib/currency';

type Tab = 'savings' | 'bills' | 'subscriptions';

interface FinanceProps {
  defaultTab?: Tab;
}

export default function Finance({ defaultTab = 'savings' }: FinanceProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [loading, setLoading] = useState(true);

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const currencySymbol = getCurrencySymbol(userProfile?.currency || 'USD');

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showBillForm, setShowBillForm] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const [newGoal, setNewGoal] = useState({
    goal_name: '',
    target_amount: 0,
    target_date: '',
  });

  const [newBill, setNewBill] = useState({
    bill_name: '',
    amount: 0,
    due_day: 1,
    category: 'utilities',
    is_autopay: false,
    notes: '',
  });

  const [newSubscription, setNewSubscription] = useState({
    service_name: '',
    amount: 0,
    billing_cycle: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    next_billing_date: '',
    category: 'entertainment',
    notes: '',
  });

  const [newTransaction, setNewTransaction] = useState({
    amount: 0,
    transaction_type: 'deposit' as 'deposit' | 'withdrawal',
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [goalsRes, billsRes, subscriptionsRes, profileRes] = await Promise.all([
        supabase.from('savings_goals').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('bills').select('*').eq('user_id', user?.id).eq('is_active', true).order('due_day'),
        supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user?.id)
          .eq('is_active', true)
          .order('next_billing_date'),
        supabase.from('user_profiles').select('*').eq('id', user?.id).maybeSingle(),
      ]);

      if (goalsRes.data) setGoals(goalsRes.data);
      if (billsRes.data) setBills(billsRes.data);
      if (subscriptionsRes.data) setSubscriptions(subscriptionsRes.data);
      if (profileRes.data) setUserProfile(profileRes.data);
    } catch (error) {
      console.error('Error loading finance data:', error);
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

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bills')
        .insert([
          {
            user_id: user.id,
            ...newBill,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setBills([...bills, data]);
      setNewBill({ bill_name: '', amount: 0, due_day: 1, category: 'utilities', is_autopay: false, notes: '' });
      setShowBillForm(false);
    } catch (error) {
      console.error('Error adding bill:', error);
    }
  };

  const handleAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: user.id,
            ...newSubscription,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSubscriptions([...subscriptions, data]);
      setNewSubscription({
        service_name: '',
        amount: 0,
        billing_cycle: 'monthly',
        next_billing_date: '',
        category: 'entertainment',
        notes: '',
      });
      setShowSubscriptionForm(false);
    } catch (error) {
      console.error('Error adding subscription:', error);
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

      await loadData();
      setNewTransaction({ amount: 0, transaction_type: 'deposit', notes: '' });
      setShowTransactionForm(false);
      setSelectedGoal(null);
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handlePayBill = async (billId: string) => {
    if (!user) return;

    try {
      const bill = bills.find((b) => b.id === billId);
      if (!bill) return;

      await supabase.from('bill_payments').insert([
        {
          bill_id: billId,
          user_id: user.id,
          amount: bill.amount,
          payment_date: new Date().toISOString().split('T')[0],
        },
      ]);

      alert('Payment recorded successfully!');
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const handleCancelSubscription = async (subId: string) => {
    if (!user) return;

    try {
      await supabase.from('subscriptions').update({ is_active: false }).eq('id', subId);

      setSubscriptions(subscriptions.filter((s) => s.id !== subId));
    } catch (error) {
      console.error('Error canceling subscription:', error);
    }
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setNewGoal({
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      target_date: goal.target_date || '',
    });
    setShowGoalForm(true);
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingGoal) return;

    try {
      const { error } = await supabase
        .from('savings_goals')
        .update({
          goal_name: newGoal.goal_name,
          target_amount: newGoal.target_amount,
          target_date: newGoal.target_date || null,
        })
        .eq('id', editingGoal.id);

      if (error) throw error;

      await loadData();
      setNewGoal({ goal_name: '', target_amount: 0, target_date: '' });
      setShowGoalForm(false);
      setEditingGoal(null);
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this savings goal? All transactions will also be deleted.')) return;

    try {
      const { error } = await supabase.from('savings_goals').delete().eq('id', goalId);

      if (error) throw error;

      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setNewBill({
      bill_name: bill.bill_name,
      amount: bill.amount,
      due_day: bill.due_day,
      category: bill.category,
      is_autopay: bill.is_autopay,
      notes: bill.notes || '',
    });
    setShowBillForm(true);
  };

  const handleUpdateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingBill) return;

    try {
      const { error } = await supabase
        .from('bills')
        .update({
          bill_name: newBill.bill_name,
          amount: newBill.amount,
          due_day: newBill.due_day,
          category: newBill.category,
          is_autopay: newBill.is_autopay,
          notes: newBill.notes,
        })
        .eq('id', editingBill.id);

      if (error) throw error;

      await loadData();
      setNewBill({ bill_name: '', amount: 0, due_day: 1, category: 'utilities', is_autopay: false, notes: '' });
      setShowBillForm(false);
      setEditingBill(null);
    } catch (error) {
      console.error('Error updating bill:', error);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      const { error } = await supabase.from('bills').update({ is_active: false }).eq('id', billId);

      if (error) throw error;

      setBills(bills.filter((b) => b.id !== billId));
    } catch (error) {
      console.error('Error deleting bill:', error);
    }
  };

  const handleEditSubscription = (sub: Subscription) => {
    setEditingSubscription(sub);
    setNewSubscription({
      service_name: sub.service_name,
      amount: sub.amount,
      billing_cycle: sub.billing_cycle,
      next_billing_date: sub.next_billing_date,
      category: sub.category,
      notes: sub.notes || '',
    });
    setShowSubscriptionForm(true);
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingSubscription) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          service_name: newSubscription.service_name,
          amount: newSubscription.amount,
          billing_cycle: newSubscription.billing_cycle,
          next_billing_date: newSubscription.next_billing_date,
          category: newSubscription.category,
          notes: newSubscription.notes,
        })
        .eq('id', editingSubscription.id);

      if (error) throw error;

      await loadData();
      setNewSubscription({
        service_name: '',
        amount: 0,
        billing_cycle: 'monthly',
        next_billing_date: '',
        category: 'entertainment',
        notes: '',
      });
      setShowSubscriptionForm(false);
      setEditingSubscription(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const calculateProgress = (goal: SavingsGoal) => {
    return Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  };

  const getTotalMonthlyBills = () => {
    return bills.reduce((sum, bill) => sum + bill.amount, 0);
  };

  const getTotalMonthlySubscriptions = () => {
    return subscriptions.reduce((sum, sub) => {
      if (sub.billing_cycle === 'yearly') return sum + sub.amount / 12;
      if (sub.billing_cycle === 'weekly') return sum + sub.amount * 4.33;
      return sum + sub.amount;
    }, 0);
  };

  const getDaysUntilDue = (dueDay: number) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let dueDate = new Date(currentYear, currentMonth, dueDay);
    if (dueDay < currentDay) {
      dueDate = new Date(currentYear, currentMonth + 1, dueDay);
    }

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const billCategories = ['utilities', 'insurance', 'rent', 'mortgage', 'loans', 'phone', 'internet', 'other'];
  const subscriptionCategories = [
    'entertainment',
    'software',
    'fitness',
    'education',
    'news',
    'cloud storage',
    'other',
  ];

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  const getHeaderConfig = () => {
    switch (activeTab) {
      case 'bills':
        return {
          icon: CreditCard,
          title: 'Bills',
          description: 'Track and manage your recurring bills',
          action: () => setShowBillForm(true),
          actionLabel: 'New Bill',
        };
      case 'subscriptions':
        return {
          icon: RefreshCw,
          title: 'Subscriptions',
          description: 'Manage your subscriptions and recurring payments',
          action: () => setShowSubscriptionForm(true),
          actionLabel: 'New Subscription',
        };
      default:
        return {
          icon: DollarSign,
          title: 'Savings Goals',
          description: 'Track your savings goals and progress',
          action: () => setShowGoalForm(true),
          actionLabel: 'New Goal',
        };
    }
  };

  const headerConfig = getHeaderConfig();
  const HeaderIcon = headerConfig.icon;

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <HeaderIcon className="h-8 w-8 text-emerald-500" />
            {headerConfig.title}
          </h1>
          <p className="text-slate-600 mt-1">{headerConfig.description}</p>
        </div>
        <button
          onClick={headerConfig.action}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-lg"
        >
          <Plus className="h-5 w-5" />
          {headerConfig.actionLabel}
        </button>
      </div>

      {activeTab === 'savings' && (
        <div className="grid gap-6">
            {goals.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <DollarSign className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No savings goals yet. Create your first goal!</p>
              </div>
            ) : (
              goals.map((goal) => {
                const progress = calculateProgress(goal);

                return (
                  <div
                    key={goal.id}
                    className={`bg-white rounded-2xl shadow-lg p-6 ${
                      goal.is_completed ? 'border-2 border-emerald-400' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{goal.goal_name}</h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {currencySymbol}{goal.current_amount.toFixed(2)} / {currencySymbol}{goal.target_amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {goal.is_completed && (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        )}
                        <button
                          onClick={() => handleEditGoal(goal)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit goal"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                        <span>Progress</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500"
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
                        className="w-full bg-emerald-50 text-emerald-700 py-2 rounded-lg hover:bg-emerald-100 font-medium transition-colors"
                      >
                        Add Transaction
                      </button>
                    )}
                  </div>
                );
              })
            )}
        </div>
      )}

      {activeTab === 'bills' && (
        <div className="grid gap-4">
            {bills.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <CreditCard className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No bills tracked yet. Add your first bill!</p>
              </div>
            ) : (
              bills.map((bill) => {
                const daysUntilDue = getDaysUntilDue(bill.due_day);
                const isDueSoon = daysUntilDue <= 3;

                return (
                  <div key={bill.id} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900">{bill.bill_name}</h3>
                          {bill.is_autopay && (
                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">AutoPay</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 capitalize mt-1">{bill.category}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <div>
                            <p className="text-2xl font-bold text-slate-900">{currencySymbol}{bill.amount.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            <span className={isDueSoon ? 'text-orange-600 font-medium' : 'text-slate-600'}>
                              Due in {daysUntilDue} {daysUntilDue === 1 ? 'day' : 'days'}
                            </span>
                            {isDueSoon && <AlertCircle className="h-4 w-4 text-orange-600 ml-1" />}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePayBill(bill.id)}
                          className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-100 font-medium transition-colors text-sm"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleEditBill(bill)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit bill"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete bill"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="grid gap-4">
            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <RefreshCw className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No subscriptions tracked yet. Add your first subscription!</p>
              </div>
            ) : (
              subscriptions.map((sub) => {
                const monthlyAmount =
                  sub.billing_cycle === 'yearly'
                    ? sub.amount / 12
                    : sub.billing_cycle === 'weekly'
                    ? sub.amount * 4.33
                    : sub.amount;

                return (
                  <div key={sub.id} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900">{sub.service_name}</h3>
                        <p className="text-sm text-slate-600 capitalize mt-1">{sub.category}</p>
                        <div className="flex items-center gap-6 mt-3">
                          <div>
                            <p className="text-xs text-slate-500">Per {sub.billing_cycle}</p>
                            <p className="text-xl font-bold text-slate-900">{currencySymbol}{sub.amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Monthly equivalent</p>
                            <p className="text-lg font-semibold text-slate-700">{currencySymbol}{monthlyAmount.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Calendar className="h-4 w-4" />
                            <span>Next: {new Date(sub.next_billing_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSubscription(sub)}
                          className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit subscription"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCancelSubscription(sub.id)}
                          className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 font-medium transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
        </div>
      )}

      {showGoalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingGoal ? 'Edit Savings Goal' : 'New Savings Goal'}
              </h2>
              <button
                onClick={() => {
                  setShowGoalForm(false);
                  setEditingGoal(null);
                  setNewGoal({ goal_name: '', target_amount: 0, target_date: '' });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={editingGoal ? handleUpdateGoal : handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Goal Name</label>
                <input
                  type="text"
                  value={newGoal.goal_name}
                  onChange={(e) => setNewGoal({ ...newGoal, goal_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  placeholder="5000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Date (optional)</label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 font-medium transition-colors shadow-lg"
              >
                {editingGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showBillForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{editingBill ? 'Edit Bill' : 'New Bill'}</h2>
              <button
                onClick={() => {
                  setShowBillForm(false);
                  setEditingBill(null);
                  setNewBill({ bill_name: '', amount: 0, due_day: 1, category: 'utilities', is_autopay: false, notes: '' });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={editingBill ? handleUpdateBill : handleAddBill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Bill Name</label>
                <input
                  type="text"
                  value={newBill.bill_name}
                  onChange={(e) => setNewBill({ ...newBill, bill_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  placeholder="e.g., Electricity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={newBill.amount || ''}
                  onChange={(e) => setNewBill({ ...newBill, amount: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  placeholder="150.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Due Day (1-31)</label>
                <input
                  type="number"
                  value={newBill.due_day}
                  onChange={(e) => setNewBill({ ...newBill, due_day: parseInt(e.target.value) || 1 })}
                  required
                  min="1"
                  max="31"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={newBill.category}
                  onChange={(e) => setNewBill({ ...newBill, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                >
                  {billCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newBill.is_autopay}
                  onChange={(e) => setNewBill({ ...newBill, is_autopay: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-slate-700">Auto-pay enabled</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                <textarea
                  value={newBill.notes}
                  onChange={(e) => setNewBill({ ...newBill, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 font-medium transition-colors shadow-lg"
              >
                {editingBill ? 'Update Bill' : 'Add Bill'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showSubscriptionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingSubscription ? 'Edit Subscription' : 'New Subscription'}
              </h2>
              <button
                onClick={() => {
                  setShowSubscriptionForm(false);
                  setEditingSubscription(null);
                  setNewSubscription({
                    service_name: '',
                    amount: 0,
                    billing_cycle: 'monthly',
                    next_billing_date: '',
                    category: 'entertainment',
                    notes: '',
                  });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={editingSubscription ? handleUpdateSubscription : handleAddSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Service Name</label>
                <input
                  type="text"
                  value={newSubscription.service_name}
                  onChange={(e) => setNewSubscription({ ...newSubscription, service_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  placeholder="e.g., Netflix"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
                <input
                  type="number"
                  value={newSubscription.amount || ''}
                  onChange={(e) => setNewSubscription({ ...newSubscription, amount: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  placeholder="15.99"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Billing Cycle</label>
                <select
                  value={newSubscription.billing_cycle}
                  onChange={(e) =>
                    setNewSubscription({
                      ...newSubscription,
                      billing_cycle: e.target.value as 'weekly' | 'monthly' | 'yearly',
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Next Billing Date</label>
                <input
                  type="date"
                  value={newSubscription.next_billing_date}
                  onChange={(e) => setNewSubscription({ ...newSubscription, next_billing_date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select
                  value={newSubscription.category}
                  onChange={(e) => setNewSubscription({ ...newSubscription, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                >
                  {subscriptionCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                <textarea
                  value={newSubscription.notes}
                  onChange={(e) => setNewSubscription({ ...newSubscription, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 font-medium transition-colors shadow-lg"
              >
                {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
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
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  placeholder="100.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-400"
                  rows={3}
                  placeholder="Optional notes..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-500 text-white py-3 rounded-lg hover:bg-emerald-600 font-medium transition-colors shadow-lg"
              >
                Add Transaction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
