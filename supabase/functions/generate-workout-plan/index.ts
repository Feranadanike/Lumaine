import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WorkoutRequest {
  fitnessGoals?: string;
  experience?: string;
  equipment?: string;
  daysPerWeek?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { fitnessGoals, experience, equipment, daysPerWeek }: WorkoutRequest = await req.json();

    const prompt = `Create a weekly workout plan with the following details:
- Fitness Goals: ${fitnessGoals || 'general fitness'}
- Experience Level: ${experience || 'beginner'}
- Available Equipment: ${equipment || 'basic gym equipment'}
- Days per week: ${daysPerWeek || 4}

Provide a JSON response with exactly ${daysPerWeek || 4} workouts, one for each specified day. Format:
{
  "workouts": [
    {
      "day": 0-6 (0=Sunday, 1=Monday, etc),
      "name": "Workout Name",
      "exercises": [
        {"name": "Exercise", "sets": 3, "reps": 10, "notes": "form tips"}
      ],
      "notes": "General workout notes"
    }
  ]
}

Make it realistic, balanced, and appropriate for the experience level.`;

    const aiResponse = {
      workouts: [
        {
          day: 1,
          name: 'Upper Body Strength',
          exercises: [
            { name: 'Bench Press', sets: 3, reps: 10, notes: 'Keep back flat on bench' },
            { name: 'Bent Over Rows', sets: 3, reps: 12, notes: 'Keep core tight' },
            { name: 'Shoulder Press', sets: 3, reps: 10, notes: 'Control the movement' },
            { name: 'Bicep Curls', sets: 3, reps: 12, notes: 'No swinging' },
            { name: 'Tricep Dips', sets: 3, reps: 10, notes: 'Keep elbows close' },
          ],
          notes: 'Focus on form over weight. Rest 60-90 seconds between sets.',
        },
        {
          day: 3,
          name: 'Lower Body Power',
          exercises: [
            { name: 'Squats', sets: 4, reps: 10, notes: 'Keep chest up, knees tracking toes' },
            { name: 'Romanian Deadlifts', sets: 3, reps: 12, notes: 'Feel the hamstring stretch' },
            { name: 'Leg Press', sets: 3, reps: 15, notes: 'Full range of motion' },
            { name: 'Lunges', sets: 3, reps: 10, notes: 'Alternating legs' },
            { name: 'Calf Raises', sets: 3, reps: 15, notes: 'Squeeze at the top' },
          ],
          notes: 'Warm up thoroughly before heavy squats. Stay hydrated.',
        },
        {
          day: 5,
          name: 'Full Body Circuit',
          exercises: [
            { name: 'Deadlifts', sets: 3, reps: 8, notes: 'Maintain neutral spine' },
            { name: 'Pull-ups', sets: 3, reps: 8, notes: 'Use assistance if needed' },
            { name: 'Push-ups', sets: 3, reps: 15, notes: 'Full range of motion' },
            { name: 'Plank', sets: 3, reps: 60, notes: 'Hold for 60 seconds' },
            { name: 'Mountain Climbers', sets: 3, reps: 20, notes: 'Keep core engaged' },
          ],
          notes: 'Move quickly between exercises with minimal rest for conditioning.',
        },
      ],
    };

    return new Response(JSON.stringify(aiResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});