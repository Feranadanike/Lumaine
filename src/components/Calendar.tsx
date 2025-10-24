import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  category: string;
  color: string;
  data?: any;
}

const categoryColors: Record<string, string> = {
  workout: 'bg-gradient-to-br from-orange-500 to-red-500',
  skincare: 'bg-gradient-to-br from-pink-500 to-rose-500',
  meal: 'bg-gradient-to-br from-green-500 to-emerald-500',
  finance: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  social: 'bg-gradient-to-br from-purple-500 to-pink-500',
  goal: 'bg-gradient-to-br from-yellow-500 to-orange-500',
  hobby: 'bg-gradient-to-br from-teal-500 to-cyan-500',
  journal: 'bg-gradient-to-br from-slate-500 to-gray-500',
  planner: 'bg-gradient-to-br from-gray-600 to-slate-600',
  mood: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
  achievement: 'bg-gradient-to-br from-amber-500 to-yellow-500',
};

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user, currentDate]);

  const loadEvents = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      console.log('Loading events for:', {
        year,
        month,
        firstDay: firstDay.toISOString().split('T')[0],
        lastDay: lastDay.toISOString().split('T')[0]
      });

      const allEvents: CalendarEvent[] = [];

      const [
        workouts,
        plannedWorkouts,
        skincareLogs,
        journalEntries,
        achievements,
        hobbyLogs,
        dailyPlanner,
        mealPlans,
        goals,
        moodEntries,
      ] = await Promise.all([
        supabase
          .from('workout_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('workout_date', firstDay.toISOString().split('T')[0])
          .lte('workout_date', lastDay.toISOString().split('T')[0]),
        supabase
          .from('planned_workouts')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('skincare_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', firstDay.toISOString().split('T')[0])
          .lte('log_date', lastDay.toISOString().split('T')[0]),
        supabase
          .from('journal_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('entry_date', firstDay.toISOString().split('T')[0])
          .lte('entry_date', lastDay.toISOString().split('T')[0]),
        supabase
          .from('daily_achievements')
          .select('*')
          .eq('user_id', user.id)
          .gte('achievement_date', firstDay.toISOString().split('T')[0])
          .lte('achievement_date', lastDay.toISOString().split('T')[0]),
        supabase
          .from('hobby_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', firstDay.toISOString().split('T')[0])
          .lte('log_date', lastDay.toISOString().split('T')[0]),
        supabase
          .from('daily_planner')
          .select('*')
          .eq('user_id', user.id)
          .gte('plan_date', firstDay.toISOString().split('T')[0])
          .lte('plan_date', lastDay.toISOString().split('T')[0]),
        supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id)
          .gte('plan_date', firstDay.toISOString().split('T')[0])
          .lte('plan_date', lastDay.toISOString().split('T')[0]),
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .not('target_date', 'is', null)
          .gte('target_date', firstDay.toISOString().split('T')[0])
          .lte('target_date', lastDay.toISOString().split('T')[0]),
        supabase
          .from('mood_entries')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('entry_date', firstDay.toISOString().split('T')[0])
          .lte('entry_date', lastDay.toISOString().split('T')[0]),
      ]);

      if (workouts.data) {
        workouts.data.forEach((w) => {
          allEvents.push({
            id: `workout-${w.id}`,
            title: w.workout_name,
            date: new Date(w.workout_date + 'T00:00:00'),
            category: 'workout',
            color: categoryColors.workout,
            data: w,
          });
        });
      }

      if (plannedWorkouts.data) {
        plannedWorkouts.data.forEach((pw) => {
          const dates = getDatesForDayOfWeek(pw.day_of_week, year, month);
          dates.forEach((date) => {
            allEvents.push({
              id: `planned-workout-${pw.id}-${date.getTime()}`,
              title: `${pw.workout_name} (Planned)`,
              date,
              category: 'workout',
              color: categoryColors.workout,
              data: pw,
            });
          });
        });
      }

      if (skincareLogs.data) {
        skincareLogs.data.forEach((sl) => {
          allEvents.push({
            id: `skincare-log-${sl.id}`,
            title: `Skincare ${sl.time_of_day}`,
            date: new Date(sl.log_date + 'T00:00:00'),
            category: 'skincare',
            color: categoryColors.skincare,
            data: sl,
          });
        });
      }

      if (journalEntries.data) {
        journalEntries.data.forEach((je) => {
          allEvents.push({
            id: `journal-${je.id}`,
            title: je.title || 'Journal Entry',
            date: new Date(je.entry_date + 'T00:00:00'),
            category: 'journal',
            color: categoryColors.journal,
            data: je,
          });
        });
      }

      if (achievements.data) {
        achievements.data.forEach((a) => {
          allEvents.push({
            id: `achievement-${a.id}`,
            title: a.win_description.substring(0, 30),
            date: new Date(a.achievement_date + 'T00:00:00'),
            category: 'achievement',
            color: categoryColors.achievement,
            data: a,
          });
        });
      }

      if (hobbyLogs.data) {
        hobbyLogs.data.forEach((hl) => {
          allEvents.push({
            id: `hobby-log-${hl.id}`,
            title: 'Hobby Session',
            date: new Date(hl.log_date + 'T00:00:00'),
            category: 'hobby',
            color: categoryColors.hobby,
            data: hl,
          });
        });
      }

      if (dailyPlanner.data) {
        dailyPlanner.data.forEach((dp) => {
          const tasks = dp.tasks as any[];
          if (tasks && tasks.length > 0) {
            allEvents.push({
              id: `planner-${dp.id}`,
              title: `${tasks.length} Task${tasks.length > 1 ? 's' : ''}`,
              date: new Date(dp.plan_date + 'T00:00:00'),
              category: 'planner',
              color: categoryColors.planner,
              data: dp,
            });
          }
        });
      }

      if (mealPlans.data) {
        mealPlans.data.forEach((mp) => {
          allEvents.push({
            id: `meal-${mp.id}`,
            title: `${mp.meal_type} Planned`,
            date: new Date(mp.plan_date + 'T00:00:00'),
            category: 'meal',
            color: categoryColors.meal,
            data: mp,
          });
        });
      }

      if (goals.data) {
        goals.data.forEach((g) => {
          allEvents.push({
            id: `goal-${g.id}`,
            title: `${g.title} Deadline`,
            date: new Date(g.target_date + 'T00:00:00'),
            category: 'goal',
            color: categoryColors.goal,
            data: g,
          });
        });
      }

      if (moodEntries.data) {
        moodEntries.data.forEach((me) => {
          allEvents.push({
            id: `mood-${me.id}`,
            title: 'Mood Entry',
            date: new Date(me.entry_date + 'T00:00:00'),
            category: 'mood',
            color: categoryColors.mood,
            data: me,
          });
        });
      }

      console.log('Total events loaded:', allEvents.length);
      console.log('Events by category:', {
        workout: allEvents.filter(e => e.category === 'workout').length,
        journal: allEvents.filter(e => e.category === 'journal').length,
        planner: allEvents.filter(e => e.category === 'planner').length,
        meal: allEvents.filter(e => e.category === 'meal').length,
        mood: allEvents.filter(e => e.category === 'mood').length,
        goal: allEvents.filter(e => e.category === 'goal').length,
      });

      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDatesForDayOfWeek = (dayOfWeek: number, year: number, month: number): Date[] => {
    const dates: Date[] = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() === dayOfWeek) {
        dates.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return dates;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = new Date();
  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day));
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Calendar
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                All your events in one place
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {monthNames[month]} {year}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading calendar...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-gray-600 dark:text-gray-400 py-2"
                  >
                    {day}
                  </div>
                ))}

                {calendarDays.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const dayEvents = getEventsForDate(date);
                  const isCurrentDay = isToday(date);

                  return (
                    <div
                      key={date.toISOString()}
                      className={`aspect-square border rounded-lg p-2 ${
                        isCurrentDay
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } cursor-pointer transition`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className={`text-sm font-semibold mb-1 ${
                        isCurrentDay
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1 overflow-y-auto max-h-16">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded text-white truncate ${event.color}`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {events.length === 0 && !loading && (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No events found for this month
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Start adding workouts, journal entries, goals, and more to see them here!
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {selectedDate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-3">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No events on this day
                    </p>
                  ) : (
                    getEventsForDate(selectedDate).map((event) => (
                      <div
                        key={event.id}
                        className={`p-4 rounded-lg ${event.color} text-white`}
                      >
                        <div className="font-semibold mb-1">{event.title}</div>
                        <div className="text-sm opacity-90 capitalize">
                          {event.category}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Legend
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Object.entries(categoryColors).map(([category, color]) => (
              <div key={category} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${color}`} />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
