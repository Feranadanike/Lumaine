import { useEffect, useState } from 'react';
import { Plus, X, Dumbbell, Calendar, TrendingUp, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { WorkoutSession, Exercise, PlannedWorkout } from '../types';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function Gym() {
  const { user } = useAuth();
  const [view, setView] = useState<'plan' | 'log'>('plan');
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [plannedWorkouts, setPlannedWorkouts] = useState<PlannedWorkout[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [newWorkout, setNewWorkout] = useState({
    workout_name: '',
    exercises: [] as Exercise[],
    duration_minutes: 0,
    notes: '',
  });

  const [newPlan, setNewPlan] = useState({
    day_of_week: 1,
    workout_name: '',
    exercises: [] as Exercise[],
    notes: '',
  });

  const [currentExercise, setCurrentExercise] = useState({
    name: '',
    sets: 0,
    reps: 0,
    weight: 0,
    notes: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [workoutsData, plansData] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user?.id)
          .order('workout_date', { ascending: false })
          .limit(20),
        supabase
          .from('planned_workouts')
          .select('*')
          .eq('user_id', user?.id)
          .order('day_of_week', { ascending: true }),
      ]);

      if (workoutsData.error) throw workoutsData.error;
      if (workoutsData.data) setWorkouts(workoutsData.data);

      if (plansData.error) throw plansData.error;
      if (plansData.data) setPlannedWorkouts(plansData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExerciseToPlan = () => {
    if (currentExercise.name && currentExercise.sets > 0 && currentExercise.reps > 0) {
      setNewPlan({
        ...newPlan,
        exercises: [...newPlan.exercises, { ...currentExercise }],
      });
      setCurrentExercise({ name: '', sets: 0, reps: 0, weight: 0, notes: '' });
    }
  };

  const handleAddExercise = () => {
    if (currentExercise.name && currentExercise.sets > 0 && currentExercise.reps > 0) {
      setNewWorkout({
        ...newWorkout,
        exercises: [...newWorkout.exercises, { ...currentExercise }],
      });
      setCurrentExercise({ name: '', sets: 0, reps: 0, weight: 0, notes: '' });
    }
  };

  const handleRemoveExerciseFromPlan = (index: number) => {
    setNewPlan({
      ...newPlan,
      exercises: newPlan.exercises.filter((_, i) => i !== index),
    });
  };

  const handleRemoveExercise = (index: number) => {
    setNewWorkout({
      ...newWorkout,
      exercises: newWorkout.exercises.filter((_, i) => i !== index),
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('planned_workouts')
        .upsert(
          {
            user_id: user.id,
            day_of_week: newPlan.day_of_week,
            workout_name: newPlan.workout_name,
            exercises: newPlan.exercises,
            notes: newPlan.notes || null,
          },
          { onConflict: 'user_id,day_of_week' }
        )
        .select()
        .single();

      if (error) throw error;

      await loadData();
      setNewPlan({ day_of_week: 1, workout_name: '', exercises: [], notes: '' });
      setShowPlanForm(false);
      setSelectedDay(null);
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert([
          {
            user_id: user.id,
            workout_name: newWorkout.workout_name,
            exercises: newWorkout.exercises,
            duration_minutes: newWorkout.duration_minutes || null,
            notes: newWorkout.notes || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setWorkouts([data, ...workouts]);
      setNewWorkout({ workout_name: '', exercises: [], duration_minutes: 0, notes: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding workout:', error);
    }
  };

  const handleEditPlan = (plan: PlannedWorkout) => {
    setNewPlan({
      day_of_week: plan.day_of_week,
      workout_name: plan.workout_name,
      exercises: plan.exercises as Exercise[],
      notes: plan.notes || '',
    });
    setSelectedDay(plan.day_of_week);
    setShowPlanForm(true);
  };


  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-amber-400" />
            Gym
          </h1>
          <p className="text-slate-600 mt-1">Plan your week and track your workouts</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('plan')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'plan' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
              }`}
            >
              Weekly Plan
            </button>
            <button
              onClick={() => setView('log')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'log' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
              }`}
            >
              Workout Log
            </button>
          </div>
        </div>
      </div>

      {view === 'plan' && (
        <>
          <div className="grid gap-4">
            {DAYS_OF_WEEK.map((day, index) => {
              const plan = plannedWorkouts.find((p) => p.day_of_week === index);
              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-slate-900">{day}</h3>
                    <button
                      onClick={() => {
                        if (plan) {
                          handleEditPlan(plan);
                        } else {
                          setNewPlan({ day_of_week: index, workout_name: '', exercises: [], notes: '' });
                          setSelectedDay(index);
                          setShowPlanForm(true);
                        }
                      }}
                      className="flex items-center gap-2 bg-amber-100 text-amber-700 px-3 py-2 rounded-lg hover:bg-amber-200 text-sm font-medium transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      {plan ? 'Edit' : 'Add Workout'}
                    </button>
                  </div>
                  {plan ? (
                    <div>
                      <p className="font-semibold text-slate-900 mb-2">{plan.workout_name}</p>
                      {plan.exercises && Array.isArray(plan.exercises) && plan.exercises.length > 0 && (
                        <div className="space-y-2">
                          {plan.exercises.map((exercise: Exercise, i: number) => (
                            <div key={i} className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                              {exercise.name} - {exercise.sets}x{exercise.reps}
                              {exercise.weight ? ` @ ${exercise.weight} lbs` : ''}
                            </div>
                          ))}
                        </div>
                      )}
                      {plan.notes && <p className="text-sm text-slate-500 mt-2">{plan.notes}</p>}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">Rest day or no workout planned</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'log' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-amber-400 text-white px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
              Log Workout
            </button>
          </div>

          <div className="grid gap-6">
            {workouts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Dumbbell className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No workouts yet. Start tracking your fitness journey!</p>
              </div>
            ) : (
              workouts.map((workout) => (
                <div key={workout.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{workout.workout_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(workout.workout_date).toLocaleDateString()}
                        </div>
                        {workout.duration_minutes && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            {workout.duration_minutes} mins
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {workout.exercises && Array.isArray(workout.exercises) && workout.exercises.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {workout.exercises.map((exercise: Exercise, index: number) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg">
                          <p className="font-medium text-slate-900">{exercise.name}</p>
                          <p className="text-sm text-slate-600">
                            {exercise.sets} sets × {exercise.reps} reps
                            {exercise.weight ? ` @ ${exercise.weight} lbs` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {workout.notes && (
                    <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">{workout.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {showPlanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                Plan Workout - {DAYS_OF_WEEK[newPlan.day_of_week]}
              </h2>
              <button
                onClick={() => {
                  setShowPlanForm(false);
                  setSelectedDay(null);
                  setNewPlan({ day_of_week: 1, workout_name: '', exercises: [], notes: '' });
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Workout Name</label>
                <input
                  type="text"
                  value={newPlan.workout_name}
                  onChange={(e) => setNewPlan({ ...newPlan, workout_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g., Upper Body Day"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-slate-900">Add Exercise</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={currentExercise.name}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                    className="col-span-2 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                    placeholder="Exercise name"
                  />
                  <input
                    type="number"
                    value={currentExercise.sets || ''}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, sets: parseInt(e.target.value) || 0 })
                    }
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                    placeholder="Sets"
                  />
                  <input
                    type="number"
                    value={currentExercise.reps || ''}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, reps: parseInt(e.target.value) || 0 })
                    }
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                    placeholder="Reps"
                  />
                  <input
                    type="number"
                    value={currentExercise.weight || ''}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, weight: parseInt(e.target.value) || 0 })
                    }
                    className="col-span-2 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                    placeholder="Weight (lbs)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddExerciseToPlan}
                  className="w-full bg-amber-100 text-amber-700 py-2 rounded-lg hover:bg-amber-200 font-medium transition-colors"
                >
                  Add Exercise
                </button>
              </div>

              {newPlan.exercises.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">Exercises</h3>
                  {newPlan.exercises.map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{exercise.name}</p>
                        <p className="text-sm text-slate-600">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight ? ` @ ${exercise.weight} lbs` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExerciseFromPlan(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newPlan.notes}
                  onChange={(e) => setNewPlan({ ...newPlan, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  rows={3}
                  placeholder="Any notes about this workout?"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-400 text-white py-3 rounded-lg hover:bg-amber-500 font-medium transition-colors shadow-lg"
              >
                Save Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Log Workout</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Workout Name</label>
                <input
                  type="text"
                  value={newWorkout.workout_name}
                  onChange={(e) => setNewWorkout({ ...newWorkout, workout_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  placeholder="e.g., Upper Body Day"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-slate-900">Add Exercise</h3>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={currentExercise.name}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                    className="col-span-2 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                    placeholder="Exercise name"
                  />
                  <input
                    type="number"
                    value={currentExercise.sets || ''}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, sets: parseInt(e.target.value) || 0 })
                    }
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                    placeholder="Sets"
                  />
                  <input
                    type="number"
                    value={currentExercise.reps || ''}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, reps: parseInt(e.target.value) || 0 })
                    }
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                    placeholder="Reps"
                  />
                  <input
                    type="number"
                    value={currentExercise.weight || ''}
                    onChange={(e) =>
                      setCurrentExercise({ ...currentExercise, weight: parseInt(e.target.value) || 0 })
                    }
                    className="col-span-2 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                    placeholder="Weight (lbs)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddExercise}
                  className="w-full bg-amber-100 text-amber-700 py-2 rounded-lg hover:bg-amber-200 font-medium transition-colors"
                >
                  Add Exercise
                </button>
              </div>

              {newWorkout.exercises.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">Exercises</h3>
                  {newWorkout.exercises.map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{exercise.name}</p>
                        <p className="text-sm text-slate-600">
                          {exercise.sets} sets × {exercise.reps} reps
                          {exercise.weight ? ` @ ${exercise.weight} lbs` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={newWorkout.duration_minutes || ''}
                  onChange={(e) =>
                    setNewWorkout({ ...newWorkout, duration_minutes: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  placeholder="60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newWorkout.notes}
                  onChange={(e) => setNewWorkout({ ...newWorkout, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400"
                  rows={3}
                  placeholder="How did it go?"
                />
              </div>

              <button
                type="submit"
                disabled={newWorkout.exercises.length === 0}
                className="w-full bg-amber-400 text-white py-3 rounded-lg hover:bg-amber-500 font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Workout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
