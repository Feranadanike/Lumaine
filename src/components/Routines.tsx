import { useState, useEffect } from 'react';
import { Zap, Plus, Play, Edit2, Trash2, Sparkles, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Routine {
  id: string;
  name: string;
  type: 'morning' | 'evening' | 'custom';
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  actions: RoutineAction[];
}

interface RoutineAction {
  id?: string;
  action_type: string;
  action_data: any;
  order_index: number;
}

interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  actions: any[];
}

export default function Routines() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [templates, setTemplates] = useState<RoutineTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [runningRoutine, setRunningRoutine] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadRoutines();
      loadTemplates();
    }
  }, [user]);

  const loadRoutines = async () => {
    try {
      const { data: routinesData, error: routinesError } = await supabase
        .from('routines')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (routinesError) throw routinesError;

      const routinesWithActions = await Promise.all(
        (routinesData || []).map(async (routine) => {
          const { data: actions } = await supabase
            .from('routine_actions')
            .select('*')
            .eq('routine_id', routine.id)
            .order('order_index', { ascending: true });

          return { ...routine, actions: actions || [] };
        })
      );

      setRoutines(routinesWithActions);
    } catch (error) {
      console.error('Error loading routines:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('routine_templates')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const createRoutineFromTemplate = async (template: RoutineTemplate) => {
    try {
      const { data: routine, error: routineError } = await supabase
        .from('routines')
        .insert({
          user_id: user?.id,
          name: template.name,
          type: 'custom',
          description: template.description,
          icon: template.icon,
          enabled: true
        })
        .select()
        .single();

      if (routineError) throw routineError;

      const actions = template.actions.map((action: any, index: number) => ({
        routine_id: routine.id,
        action_type: action.type,
        action_data: action.data,
        order_index: index
      }));

      const { error: actionsError } = await supabase
        .from('routine_actions')
        .insert(actions);

      if (actionsError) throw actionsError;

      await loadRoutines();
      setShowTemplates(false);
    } catch (error) {
      console.error('Error creating routine from template:', error);
    }
  };

  const createRoutine = async (routineData: Partial<Routine>) => {
    try {
      const { data: routine, error } = await supabase
        .from('routines')
        .insert({
          user_id: user?.id,
          name: routineData.name,
          type: routineData.type || 'custom',
          description: routineData.description || '',
          icon: routineData.icon || 'Zap',
          color: routineData.color || 'blue',
          enabled: true
        })
        .select()
        .single();

      if (error) throw error;
      await loadRoutines();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating routine:', error);
    }
  };

  const updateRoutine = async (id: string, updates: Partial<Routine>) => {
    try {
      const { error } = await supabase
        .from('routines')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadRoutines();
      setEditingRoutine(null);
    } catch (error) {
      console.error('Error updating routine:', error);
    }
  };

  const deleteRoutine = async (id: string) => {
    if (!confirm('Delete this routine?')) return;

    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadRoutines();
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const runRoutine = async (routine: Routine) => {
    setRunningRoutine(routine.id);

    for (const action of routine.actions) {
      await executeAction(action);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setTimeout(() => setRunningRoutine(null), 1000);
  };

  const executeAction = async (action: RoutineAction) => {
    const actionData = action.action_data || {};

    switch (action.action_type) {
      case 'log_mood':
        console.log('Opening mood diary...');
        break;
      case 'open_planner':
        console.log('Opening planner...');
        break;
      case 'open_journal':
        console.log('Opening journal...');
        break;
      case 'open_gym':
        console.log('Opening gym tracker...');
        break;
      case 'open_meal_prep':
        console.log('Opening meal prep...');
        break;
      case 'open_savings':
        console.log('Opening savings...');
        break;
      case 'open_finance':
        console.log('Opening finance...');
        break;
      case 'open_skincare':
        console.log('Opening skincare...');
        break;
      case 'open_wellness':
        console.log('Opening wellness...');
        break;
      case 'review_goals':
        console.log('Opening goals...');
        break;
      case 'review_achievements':
        console.log('Opening achievements...');
        break;
      case 'create_planner_task':
        if (actionData.title) {
          await supabase.from('planner').insert({
            user_id: user?.id,
            title: actionData.title,
            description: actionData.description || '',
            priority: actionData.priority || 'medium',
            completed: false
          });
        }
        break;
    }
  };

  const toggleRoutine = async (id: string, enabled: boolean) => {
    await updateRoutine(id, { enabled });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'morning': return 'text-amber-600';
      case 'evening': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Routines & Automation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create workflows that trigger multiple actions at once
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg hover:from-pink-600 hover:to-orange-600 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Browse Templates
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Routine
          </button>
        </div>
      </div>

      {routines.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No routines yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first routine or start with a template
          </p>
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Browse Templates
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routines.map((routine) => (
            <div
              key={routine.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 ${
                routine.enabled
                  ? 'border-blue-200 dark:border-blue-800'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    routine.enabled ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Zap className={`w-5 h-5 ${
                      routine.enabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {routine.name}
                    </h3>
                    <span className={`text-xs ${getTypeColor(routine.type)}`}>
                      {routine.type}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={routine.enabled}
                    onChange={(e) => toggleRoutine(routine.id, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {routine.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {routine.description}
                </p>
              )}

              <div className="mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {routine.actions.length} actions
                </p>
                <div className="flex flex-wrap gap-1">
                  {routine.actions.slice(0, 3).map((action, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-400"
                    >
                      {action.action_type.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {routine.actions.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-400">
                      +{routine.actions.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => runRoutine(routine)}
                  disabled={!routine.enabled || runningRoutine === routine.id}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {runningRoutine === routine.id ? (
                    <Check className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  {runningRoutine === routine.id ? 'Running...' : 'Run'}
                </button>
                <button
                  onClick={() => setEditingRoutine(routine)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteRoutine(routine.id)}
                  className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Routine Templates
              </h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900 dark:to-orange-900 rounded-lg">
                      <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {template.name}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-400">
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>
                  <button
                    onClick={() => createRoutineFromTemplate(template)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateRoutineModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createRoutine}
        />
      )}
    </div>
  );
}

function CreateRoutineModal({ onClose, onCreate }: { onClose: () => void; onCreate: (data: Partial<Routine>) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'morning' | 'evening' | 'custom'>('custom');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name, type, description });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Routine</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Routine Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Morning Boost"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              rows={3}
              placeholder="What does this routine do?"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
