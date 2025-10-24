import { useEffect, useState } from 'react';
import { Plus, X, Calendar, Check, Briefcase, Heart, Activity, Home, Sparkles, AlertCircle, AlertTriangle, AlertOctagon, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DailyPlan, PlanTask } from '../types';

export default function Planner() {
  const { user } = useAuth();
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showToast, setShowToast] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    time_slot: '',
    category: '',
    urgency_level: 2,
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadDailyPlan();
    }
  }, [user, selectedDate]);

  const loadDailyPlan = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_planner')
        .select('*')
        .eq('user_id', user?.id)
        .eq('plan_date', selectedDate)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setDailyPlan(data);
    } catch (error) {
      console.error('Error loading plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const task: PlanTask = {
      id: crypto.randomUUID(),
      title: newTask.title,
      time_slot: newTask.time_slot || undefined,
      category: newTask.category || undefined,
      urgency_level: newTask.urgency_level,
      notes: newTask.notes || undefined,
      completed: false,
    };

    try {
      if (dailyPlan) {
        const updatedTasks = [...(dailyPlan.tasks || []), task];
        const { data, error } = await supabase
          .from('daily_planner')
          .update({ tasks: updatedTasks, updated_at: new Date().toISOString() })
          .eq('id', dailyPlan.id)
          .select()
          .single();

        if (error) throw error;
        setDailyPlan(data);
      } else {
        const { data, error } = await supabase
          .from('daily_planner')
          .insert([
            {
              user_id: user.id,
              plan_date: selectedDate,
              tasks: [task],
            },
          ])
          .select()
          .single();

        if (error) throw error;
        setDailyPlan(data);
      }

      setNewTask({ title: '', time_slot: '', category: '', urgency_level: 2, notes: '' });
      setShowTaskForm(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!dailyPlan) return;

    const updatedTasks = dailyPlan.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    try {
      const { data, error } = await supabase
        .from('daily_planner')
        .update({ tasks: updatedTasks, updated_at: new Date().toISOString() })
        .eq('id', dailyPlan.id)
        .select()
        .single();

      if (error) throw error;
      setDailyPlan(data);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-8 w-8 text-purple-400" />
            Planner
          </h1>
          <p className="text-slate-600 mt-1">Organize your day and week</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('daily')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'daily' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setView('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'weekly' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>

      {view === 'daily' && (
        <>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-lg font-bold px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <button
                onClick={() => setShowTaskForm(true)}
                className="flex items-center gap-2 bg-purple-400 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Add Task
              </button>
            </div>

            <div className="space-y-2">
              {!dailyPlan || !dailyPlan.tasks || dailyPlan.tasks.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No tasks for this day. Add your first task!</p>
                </div>
              ) : (
                [...dailyPlan.tasks]
                  .sort((a, b) => {
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    return (b.urgency_level || 0) - (a.urgency_level || 0);
                  })
                  .map((task) => {
                  const getCategoryColor = (category?: string) => {
                    switch (category) {
                      case 'Work': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Briefcase };
                      case 'Personal': return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: Heart };
                      case 'Health': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: Activity };
                      case 'Home': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Home };
                      default: return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: Sparkles };
                    }
                  };
                  const categoryStyle = getCategoryColor(task.category);
                  const CategoryIcon = categoryStyle.icon;

                  const getUrgencyStyle = (urgency?: number) => {
                    switch (urgency) {
                      case 4:
                        return { icon: Zap, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-300', label: 'Urgent' };
                      case 3:
                        return { icon: AlertOctagon, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-300', label: 'High' };
                      case 2:
                        return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-300', label: 'Medium' };
                      case 1:
                        return { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-300', label: 'Low' };
                      default:
                        return { icon: AlertCircle, color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', label: 'Normal' };
                    }
                  };
                  const urgencyStyle = getUrgencyStyle(task.urgency_level);
                  const UrgencyIcon = urgencyStyle.icon;

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                        task.completed
                          ? 'bg-slate-50 border-slate-200'
                          : `bg-white ${categoryStyle.border} hover:${categoryStyle.bg}`
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            task.completed
                              ? 'bg-purple-400 border-purple-400'
                              : 'border-slate-300 hover:border-purple-400'
                          }`}
                        >
                          {task.completed && <Check className="h-4 w-4 text-white" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`font-medium flex-1 ${
                                task.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                              }`}
                            >
                              {task.title}
                            </p>
                            {task.urgency_level && task.urgency_level > 0 && (
                              <span className={`text-xs ${urgencyStyle.color} ${urgencyStyle.bg} px-2 py-1 rounded flex items-center gap-1 font-semibold`}>
                                <UrgencyIcon className="h-3 w-3" />
                                {urgencyStyle.label}
                              </span>
                            )}
                          </div>
                          {task.notes && (
                            <p className="text-xs text-slate-500 mt-1 italic">{task.notes}</p>
                          )}
                          <div className="flex gap-2 mt-1">
                            {task.time_slot && (
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                {task.time_slot}
                              </span>
                            )}
                            {task.category && (
                              <span className={`text-xs ${categoryStyle.text} ${categoryStyle.bg} px-2 py-1 rounded flex items-center gap-1`}>
                                <CategoryIcon className="h-3 w-3" />
                                {task.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {view === 'weekly' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Weekly Overview</h2>
          <p className="text-slate-500 text-center py-12">
            Weekly planner coming soon. Track multiple days at once!
          </p>
        </div>
      )}

      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
              <Check className="h-4 w-4 text-green-500" />
            </div>
            <span className="font-medium">Task added to today's planner!</span>
          </div>
        </div>
      )}

      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Add Task</h2>
              <button onClick={() => setShowTaskForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddTask} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Task</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">Add a task like "Buy groceries" or "Finish report"</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time (optional)</label>
                <input
                  type="time"
                  value={newTask.time_slot}
                  onChange={(e) => setNewTask({ ...newTask, time_slot: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">When do you plan to do this?</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Urgency Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { level: 1, label: 'Low', icon: AlertCircle, color: 'bg-blue-50 border-blue-400 text-blue-700' },
                    { level: 2, label: 'Medium', icon: AlertTriangle, color: 'bg-yellow-50 border-yellow-400 text-yellow-700' },
                    { level: 3, label: 'High', icon: AlertOctagon, color: 'bg-orange-50 border-orange-400 text-orange-700' },
                    { level: 4, label: 'Urgent', icon: Zap, color: 'bg-red-50 border-red-400 text-red-700' },
                  ].map((urgency) => {
                    const Icon = urgency.icon;
                    const isSelected = newTask.urgency_level === urgency.level;
                    return (
                      <button
                        key={urgency.level}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, urgency_level: urgency.level })}
                        className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border-2 transition-all ${
                          isSelected ? urgency.color : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-xs">{urgency.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">How urgent is this task?</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                <textarea
                  value={newTask.notes}
                  onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Add any additional notes or details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category (optional)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Work', icon: Briefcase, selectedClass: 'bg-blue-50 border-blue-400 text-blue-700' },
                    { name: 'Personal', icon: Heart, selectedClass: 'bg-rose-50 border-rose-400 text-rose-700' },
                    { name: 'Health', icon: Activity, selectedClass: 'bg-green-50 border-green-400 text-green-700' },
                    { name: 'Home', icon: Home, selectedClass: 'bg-amber-50 border-amber-400 text-amber-700' },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = newTask.category === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setNewTask({ ...newTask, category: isSelected ? '' : cat.name })}
                        className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? cat.selectedClass
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium text-sm">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-2">Choose a category to organize your tasks</p>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-400 text-white py-3 rounded-lg hover:bg-purple-500 font-medium transition-colors shadow-lg"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
