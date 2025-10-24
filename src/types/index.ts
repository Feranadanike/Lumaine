export interface UserProfile {
  id: string;
  display_name?: string;
  skin_type?: string;
  skin_concerns?: string[];
  fitness_goals?: string;
  created_at: string;
  updated_at: string;
}

export interface SkincareProduct {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  type: string;
  active_ingredients?: string[];
  notes?: string;
  created_at: string;
}

export interface SkincareLog {
  id: string;
  user_id: string;
  log_date: string;
  time_of_day: 'AM' | 'PM';
  products_used?: string[];
  skin_condition_rating?: number;
  photo_url?: string;
  notes?: string;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_date: string;
  workout_name: string;
  exercises: Exercise[];
  duration_minutes?: number;
  notes?: string;
  created_at: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavingsTransaction {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal';
  transaction_date: string;
  notes?: string;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  title?: string;
  content: string;
  mood_score?: number;
  mood_tags?: string[];
  gratitude_items?: string[];
  ai_detected_mood?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyAchievement {
  id: string;
  user_id: string;
  achievement_date: string;
  win_description: string;
  category?: string;
  created_at: string;
}

export interface WeeklyReflection {
  id: string;
  user_id: string;
  week_start_date: string;
  highlights?: string[];
  reflection?: string;
  ai_summary?: string;
  created_at: string;
}

export interface Hobby {
  id: string;
  user_id: string;
  hobby_name: string;
  hobby_type: string;
  frequency_goal: string;
  target_count: number;
  is_active: boolean;
  days_of_week?: string[];
  preferred_time?: string;
  created_at: string;
}

export interface HobbyLog {
  id: string;
  hobby_id: string;
  user_id: string;
  log_date: string;
  duration_minutes?: number;
  notes?: string;
  progress_details?: Record<string, unknown>;
  created_at: string;
}

export interface DailyPlan {
  id: string;
  user_id: string;
  plan_date: string;
  tasks: PlanTask[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanTask {
  id: string;
  title: string;
  time_slot?: string;
  completed: boolean;
  category?: string;
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start_date: string;
  goals?: string[];
  tasks: Record<string, unknown>;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyPlan {
  id: string;
  user_id: string;
  month_date: string;
  milestones?: string[];
  budget_plan?: Record<string, unknown>;
  habit_overview?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface YearlyGoal {
  id: string;
  user_id: string;
  year: number;
  vision_board?: string[];
  major_goals?: Record<string, unknown>;
  reflection_prompts?: string[];
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description?: string;
  target_value?: number;
  current_value: number;
  target_date?: string;
  status: string;
  daily_task_enabled: boolean;
  daily_task_description?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  reminder_type: string;
  reminder_time: string;
  frequency: string;
  days_of_week?: number[];
  is_active: boolean;
  message?: string;
  created_at: string;
}

export interface PlannedWorkout {
  id: string;
  user_id: string;
  day_of_week: number;
  workout_name: string;
  exercises: Exercise[];
  notes?: string;
  created_at: string;
}

export interface PlannedSkincareRoutine {
  id: string;
  user_id: string;
  time_of_day: 'AM' | 'PM';
  products?: string[];
  notes?: string;
  created_at: string;
}

export interface SkincareRoutineSchedule {
  id: string;
  user_id: string;
  time_of_day: 'AM' | 'PM';
  scheduled_time: string;
  day_of_week: string[];
  products: string[];
  is_active: boolean;
  reminder_enabled: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedLink {
  id: string;
  user_id: string;
  url: string;
  title?: string;
  description: string;
  category: string;
  tags?: string[];
  priority?: string;
  is_completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EntertainmentItem {
  id: string;
  user_id: string;
  title: string;
  type: 'Book' | 'Movie' | 'TV Show' | 'Artist' | 'Podcast';
  where_to_find?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
