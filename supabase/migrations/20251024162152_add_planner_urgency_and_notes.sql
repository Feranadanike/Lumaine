/*
  # Add Urgency and Notes to Daily Planner Tasks

  1. Changes
    - Update PlanTask structure to support urgency levels and notes
    - Tasks in the `daily_planner.tasks` jsonb column will now include:
      - `urgency_level`: integer (1=Low, 2=Medium, 3=High, 4=Urgent)
      - `notes`: text field for task-specific notes
    
  2. Notes
    - No schema changes needed as tasks are stored in jsonb
    - This migration serves as documentation for the new task structure
    - Application will handle sorting tasks by urgency level
    - Urgency levels:
      - 1 (Low): No rush, can be done anytime
      - 2 (Medium): Should be done today
      - 3 (High): Important, prioritize this
      - 4 (Urgent): Critical, must be done immediately
    
  3. Task Structure Example
    {
      "id": "uuid",
      "title": "Complete project report",
      "time_slot": "14:00",
      "category": "Work",
      "urgency_level": 3,
      "notes": "Need to submit before EOD",
      "completed": false
    }
*/

-- This migration is for documentation purposes
-- The jsonb column already supports flexible schema
-- No structural changes needed
