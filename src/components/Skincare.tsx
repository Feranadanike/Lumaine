import { useEffect, useState } from 'react';
import { Plus, X, Star, Calendar, Edit2, Trash2, Clock, Bell, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { SkincareProduct, SkincareLog, SkincareRoutineSchedule } from '../types';

export default function Skincare() {
  const { user } = useAuth();
  const [products, setProducts] = useState<SkincareProduct[]>([]);
  const [logs, setLogs] = useState<SkincareLog[]>([]);
  const [schedules, setSchedules] = useState<SkincareRoutineSchedule[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SkincareProduct | null>(null);
  const [editingLog, setEditingLog] = useState<SkincareLog | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<SkincareRoutineSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    type: 'cleanser',
    active_ingredients: '',
    notes: '',
  });

  const [newLog, setNewLog] = useState({
    time_of_day: 'AM',
    products_used: [] as string[],
    skin_condition_rating: 3,
    notes: '',
  });

  const [newSchedule, setNewSchedule] = useState({
    time_of_day: 'AM' as 'AM' | 'PM',
    scheduled_time: '08:00',
    day_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    products: [] as string[],
    is_active: true,
    reminder_enabled: false,
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [productsData, logsData, schedulesData] = await Promise.all([
        supabase
          .from('skincare_products')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('skincare_logs')
          .select('*')
          .eq('user_id', user?.id)
          .order('log_date', { ascending: false })
          .limit(10),
        supabase
          .from('skincare_routine_schedules')
          .select('*')
          .eq('user_id', user?.id)
          .order('time_of_day', { ascending: true }),
      ]);

      if (productsData.data) setProducts(productsData.data);
      if (logsData.data) setLogs(logsData.data);
      if (schedulesData.data) setSchedules(schedulesData.data);
    } catch (error) {
      console.error('Error loading skincare data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingProduct) {
        const { data, error } = await supabase
          .from('skincare_products')
          .update({
            name: newProduct.name,
            brand: newProduct.brand || null,
            type: newProduct.type,
            active_ingredients: newProduct.active_ingredients
              ? newProduct.active_ingredients.split(',').map((i) => i.trim())
              : null,
            notes: newProduct.notes || null,
          })
          .eq('id', editingProduct.id)
          .select()
          .single();

        if (error) throw error;

        setProducts(products.map((p) => (p.id === data.id ? data : p)));
        setEditingProduct(null);
      } else {
        const { data, error } = await supabase
          .from('skincare_products')
          .insert([
            {
              user_id: user.id,
              name: newProduct.name,
              brand: newProduct.brand || null,
              type: newProduct.type,
              active_ingredients: newProduct.active_ingredients
                ? newProduct.active_ingredients.split(',').map((i) => i.trim())
                : null,
              notes: newProduct.notes || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setProducts([data, ...products]);
      }

      setNewProduct({ name: '', brand: '', type: 'cleanser', active_ingredients: '', notes: '' });
      setShowProductForm(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase.from('skincare_products').delete().eq('id', id);

      if (error) throw error;

      setProducts(products.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEditProduct = (product: SkincareProduct) => {
    setNewProduct({
      name: product.name,
      brand: product.brand || '',
      type: product.type,
      active_ingredients: product.active_ingredients?.join(', ') || '',
      notes: product.notes || '',
    });
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingLog) {
        const { data, error} = await supabase
          .from('skincare_logs')
          .update({
            time_of_day: newLog.time_of_day,
            products_used: newLog.products_used.length > 0 ? newLog.products_used : null,
            skin_condition_rating: newLog.skin_condition_rating,
            notes: newLog.notes || null,
          })
          .eq('id', editingLog.id)
          .select()
          .single();

        if (error) throw error;

        setLogs(logs.map((l) => (l.id === data.id ? data : l)));
        setEditingLog(null);
      } else {
        const { data, error } = await supabase
          .from('skincare_logs')
          .insert([
            {
              user_id: user.id,
              time_of_day: newLog.time_of_day,
              products_used: newLog.products_used.length > 0 ? newLog.products_used : null,
              skin_condition_rating: newLog.skin_condition_rating,
              notes: newLog.notes || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setLogs([data, ...logs]);
      }

      setNewLog({
        time_of_day: 'AM',
        products_used: [],
        skin_condition_rating: 3,
        notes: '',
      });
      setShowLogForm(false);
    } catch (error) {
      console.error('Error saving log:', error);
    }
  };

  const handleDeleteLog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;

    try {
      const { error } = await supabase.from('skincare_logs').delete().eq('id', id);

      if (error) throw error;

      setLogs(logs.filter((l) => l.id !== id));
    } catch (error) {
      console.error('Error deleting log:', error);
    }
  };

  const handleEditLog = (log: SkincareLog) => {
    setNewLog({
      time_of_day: log.time_of_day,
      products_used: log.products_used || [],
      skin_condition_rating: log.skin_condition_rating || 3,
      notes: log.notes || '',
    });
    setEditingLog(log);
    setShowLogForm(true);
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingSchedule) {
        const { data, error } = await supabase
          .from('skincare_routine_schedules')
          .update({
            time_of_day: newSchedule.time_of_day,
            scheduled_time: newSchedule.scheduled_time,
            day_of_week: newSchedule.day_of_week,
            products: newSchedule.products,
            is_active: newSchedule.is_active,
            reminder_enabled: newSchedule.reminder_enabled,
            notes: newSchedule.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSchedule.id)
          .select()
          .single();

        if (error) throw error;

        setSchedules(schedules.map((s) => (s.id === data.id ? data : s)));
        setEditingSchedule(null);
      } else {
        const { data, error } = await supabase
          .from('skincare_routine_schedules')
          .insert([
            {
              user_id: user.id,
              time_of_day: newSchedule.time_of_day,
              scheduled_time: newSchedule.scheduled_time,
              day_of_week: newSchedule.day_of_week,
              products: newSchedule.products,
              is_active: newSchedule.is_active,
              reminder_enabled: newSchedule.reminder_enabled,
              notes: newSchedule.notes || null,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        setSchedules([...schedules, data]);
      }

      setNewSchedule({
        time_of_day: 'AM',
        scheduled_time: '08:00',
        day_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        products: [],
        is_active: true,
        reminder_enabled: false,
        notes: '',
      });
      setShowScheduleForm(false);
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const { error } = await supabase.from('skincare_routine_schedules').delete().eq('id', id);

      if (error) throw error;

      setSchedules(schedules.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleEditSchedule = (schedule: SkincareRoutineSchedule) => {
    setNewSchedule({
      time_of_day: schedule.time_of_day,
      scheduled_time: schedule.scheduled_time,
      day_of_week: schedule.day_of_week,
      products: schedule.products,
      is_active: schedule.is_active,
      reminder_enabled: schedule.reminder_enabled,
      notes: schedule.notes || '',
    });
    setEditingSchedule(schedule);
    setShowScheduleForm(true);
  };

  const toggleScheduleActive = async (schedule: SkincareRoutineSchedule) => {
    try {
      const { data, error } = await supabase
        .from('skincare_routine_schedules')
        .update({ is_active: !schedule.is_active, updated_at: new Date().toISOString() })
        .eq('id', schedule.id)
        .select()
        .single();

      if (error) throw error;

      setSchedules(schedules.map((s) => (s.id === data.id ? data : s)));
    } catch (error) {
      console.error('Error toggling schedule:', error);
    }
  };


  const productTypes = [
    'cleanser',
    'toner',
    'serum',
    'moisturizer',
    'sunscreen',
    'eye_cream',
    'mask',
    'exfoliant',
    'oil',
    'other',
  ];

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-pink-400" />
            Skincare
          </h1>
          <p className="text-slate-600 mt-1">Track your routine and products</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowScheduleForm(true)}
            className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors shadow-lg"
          >
            <Clock className="h-5 w-5" />
            Schedule
          </button>
          <button
            onClick={() => setShowProductForm(true)}
            className="flex items-center gap-2 bg-pink-400 text-white px-4 py-2 rounded-lg hover:bg-pink-500 transition-colors shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Add Product
          </button>
          <button
            onClick={() => setShowLogForm(true)}
            className="flex items-center gap-2 bg-rose-400 text-white px-4 py-2 rounded-lg hover:bg-rose-500 transition-colors shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Log Routine
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-500" />
          Skincare Routine Timetable
        </h2>
        {schedules.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">No routines scheduled yet</h3>
            <p className="text-slate-500 mb-4">Create a morning or evening routine schedule</p>
            <button
              onClick={() => setShowScheduleForm(true)}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Your First Routine
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className={`p-5 rounded-xl shadow-md transition-all ${schedule.is_active ? 'bg-white' : 'bg-slate-100 opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-2xl font-bold ${schedule.time_of_day === 'AM' ? 'text-amber-500' : 'text-indigo-600'}`}>
                        {schedule.scheduled_time}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${schedule.time_of_day === 'AM' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {schedule.time_of_day === 'AM' ? 'Morning Routine' : 'Evening Routine'}
                      </span>
                      {schedule.reminder_enabled && (
                        <Bell className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {schedule.day_of_week.map((day) => (
                        <span key={day} className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full capitalize">
                          {day.slice(0, 3)}
                        </span>
                      ))}
                    </div>
                    {schedule.products.length > 0 ? (
                      <div className="mt-4 bg-gradient-to-r from-blue-50 to-pink-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                          <Star className="h-4 w-4 text-pink-500" />
                          Your Routine Steps:
                        </p>
                        <div className="space-y-2">
                          {schedule.products.map((productId, index) => {
                            const product = products.find((p) => p.id === productId);
                            return product ? (
                              <div key={productId} className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                                <span className="flex-shrink-0 w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                  {index + 1}
                                </span>
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{product.name}</p>
                                  <p className="text-xs text-slate-600 capitalize">{product.type}</p>
                                  {product.notes && (
                                    <p className="text-xs text-slate-500 mt-1 italic">{product.notes}</p>
                                  )}
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <p className="text-sm text-amber-800">
                          No products added yet. Click Edit to add products to this routine.
                        </p>
                      </div>
                    )}
                    {schedule.notes && (
                      <p className="text-sm text-slate-600 mt-2 italic">{schedule.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => toggleScheduleActive(schedule)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${schedule.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                    >
                      {schedule.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleEditSchedule(schedule)}
                      className="text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="text-red-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowProductForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Product Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-400"
                  placeholder="e.g., Hydrating Cleanser"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-400"
                  placeholder="e.g., CeraVe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                <select
                  value={newProduct.type}
                  onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-400"
                >
                  {productTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Active Ingredients (comma-separated)
                </label>
                <input
                  type="text"
                  value={newProduct.active_ingredients}
                  onChange={(e) => setNewProduct({ ...newProduct, active_ingredients: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-400"
                  placeholder="e.g., Niacinamide, Hyaluronic Acid"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newProduct.notes}
                  onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-400"
                  rows={3}
                  placeholder="Any additional notes..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-pink-400 text-white py-3 rounded-lg hover:bg-pink-500 font-medium transition-colors shadow-lg"
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showLogForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{editingLog ? 'Edit Log' : 'Log Routine'}</h2>
              <button onClick={() => setShowLogForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time of Day</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="AM"
                      checked={newLog.time_of_day === 'AM'}
                      onChange={(e) => setNewLog({ ...newLog, time_of_day: e.target.value as 'AM' | 'PM' })}
                      className="mr-2"
                    />
                    <span className="text-slate-700">AM</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="PM"
                      checked={newLog.time_of_day === 'PM'}
                      onChange={(e) => setNewLog({ ...newLog, time_of_day: e.target.value as 'AM' | 'PM' })}
                      className="mr-2"
                    />
                    <span className="text-slate-700">PM</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Products Used</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {products.map((product) => (
                    <label key={product.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newLog.products_used.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewLog({ ...newLog, products_used: [...newLog.products_used, product.id] });
                          } else {
                            setNewLog({
                              ...newLog,
                              products_used: newLog.products_used.filter((id) => id !== product.id),
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-slate-700 text-sm">
                        {product.name} ({product.type})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Skin Condition Rating: {newLog.skin_condition_rating}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setNewLog({ ...newLog, skin_condition_rating: rating })}
                      className="p-2"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          rating <= newLog.skin_condition_rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400"
                  rows={3}
                  placeholder="How's your skin feeling?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-rose-400 text-white py-3 rounded-lg hover:bg-rose-500 font-medium transition-colors shadow-lg"
              >
                {editingLog ? 'Update Log' : 'Save Log'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showScheduleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{editingSchedule ? 'Edit Schedule' : 'Create Schedule'}</h2>
              <button onClick={() => {setShowScheduleForm(false); setEditingSchedule(null);}} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Time of Day</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="AM"
                      checked={newSchedule.time_of_day === 'AM'}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time_of_day: e.target.value as 'AM' | 'PM', scheduled_time: e.target.value === 'AM' ? '08:00' : '22:00' })}
                      className="mr-2"
                    />
                    <span className="text-slate-700">AM (Morning)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="PM"
                      checked={newSchedule.time_of_day === 'PM'}
                      onChange={(e) => setNewSchedule({ ...newSchedule, time_of_day: e.target.value as 'AM' | 'PM', scheduled_time: e.target.value === 'AM' ? '08:00' : '22:00' })}
                      className="mr-2"
                    />
                    <span className="text-slate-700">PM (Evening)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Scheduled Time</label>
                <input
                  type="time"
                  value={newSchedule.scheduled_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, scheduled_time: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Days of Week</label>
                <div className="grid grid-cols-2 gap-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <label key={day} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newSchedule.day_of_week.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSchedule({ ...newSchedule, day_of_week: [...newSchedule.day_of_week, day] });
                          } else {
                            setNewSchedule({ ...newSchedule, day_of_week: newSchedule.day_of_week.filter((d) => d !== day) });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-slate-700 text-sm capitalize">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Products</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-3">
                  {products.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-2">No products available. Add products first!</p>
                  ) : (
                    products.map((product) => (
                      <label key={product.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newSchedule.products.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewSchedule({ ...newSchedule, products: [...newSchedule.products, product.id] });
                            } else {
                              setNewSchedule({ ...newSchedule, products: newSchedule.products.filter((id) => id !== product.id) });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-slate-700 text-sm">{product.name} ({product.type})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newSchedule.reminder_enabled}
                    onChange={(e) => setNewSchedule({ ...newSchedule, reminder_enabled: e.target.checked })}
                    className="mr-2"
                  />
                  <Bell className="h-4 w-4 mr-1 text-slate-600" />
                  <span className="text-sm text-slate-700">Enable reminder notifications</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newSchedule.notes}
                  onChange={(e) => setNewSchedule({ ...newSchedule, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400"
                  rows={2}
                  placeholder="Any special instructions..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-400 text-white py-3 rounded-lg hover:bg-blue-500 font-medium transition-colors shadow-lg"
              >
                {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">My Products</h2>
          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No products yet. Add your first product!</p>
            ) : (
              products.map((product) => (
                <div key={product.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{product.name}</h3>
                      {product.brand && <p className="text-sm text-slate-600">{product.brand}</p>}
                      <p className="text-xs text-slate-500 mt-1 capitalize">{product.type.replace('_', ' ')}</p>
                      {product.active_ingredients && product.active_ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.active_ingredients.map((ingredient, i) => (
                            <span
                              key={i}
                              className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-3">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-slate-400 hover:text-pink-500 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Logs</h2>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No logs yet. Start tracking your routine!</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(log.log_date).toLocaleDateString()}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          log.time_of_day === 'AM' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {log.time_of_day}
                      </span>
                      {log.skin_condition_rating && (
                        <div className="flex gap-1">
                          {[...Array(log.skin_condition_rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditLog(log)}
                        className="text-slate-400 hover:text-pink-500 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {log.notes && <p className="text-sm text-slate-600">{log.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
