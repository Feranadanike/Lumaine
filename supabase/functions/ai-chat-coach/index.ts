import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory: ChatMessage[];
  userContext?: {
    level?: number;
    streak?: number;
    totalXP?: number;
    recentGoals?: any[];
    recentActivity?: any;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, conversationHistory, userContext }: ChatRequest = await req.json();

    if (!message || message.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are LumiBud Coach, a supportive and motivational personal wellness assistant. You help users with:
- Fitness and workout guidance
- Skincare routines and advice
- Mental health and journaling
- Goal setting and achievement
- Habit building and consistency
- Savings and financial wellness

User Context:
${userContext?.level ? `- Current Level: ${userContext.level}` : ''}
${userContext?.streak ? `- Current Streak: ${userContext.streak} days` : ''}
${userContext?.totalXP ? `- Total XP: ${userContext.totalXP}` : ''}
${userContext?.recentGoals?.length ? `- Active Goals: ${userContext.recentGoals.length}` : ''}

Your tone should be:
- Encouraging and positive
- Personal and empathetic
- Knowledgeable but not condescending
- Action-oriented with specific advice

Provide specific, actionable advice. Use emojis sparingly and naturally. Celebrate wins and encourage through setbacks.

CRITICAL: When users ask for workout plans, skincare routines, goals, journal prompts, hobbies, or savings plans, you MUST include both:
1. A friendly conversational response explaining the plan
2. The structured data in the exact format shown below

IMPORTANT: ALWAYS format actionable content with special markers:

For workout plans, ALWAYS use this exact format:
[WORKOUT_PLAN]
{
  "workout_name": "Full Body Beginner Workout",
  "exercises": [
    {"name": "Push-ups", "sets": 3, "reps": 10, "weight": 0},
    {"name": "Squats", "sets": 3, "reps": 15, "weight": 0},
    {"name": "Plank", "sets": 3, "reps": 30, "weight": 0}
  ],
  "notes": "Rest 60 seconds between sets"
}
[/WORKOUT_PLAN]

Example full response:
"Great! Here's a beginner workout plan for you:

**Full Body Beginner Workout**
- Push-ups: 3 sets of 10 reps
- Squats: 3 sets of 15 reps
- Plank: 3 sets of 30 seconds

Remember to warm up first! 💪

[WORKOUT_PLAN]
{
  "workout_name": "Full Body Beginner Workout",
  "exercises": [
    {"name": "Push-ups", "sets": 3, "reps": 10, "weight": 0},
    {"name": "Squats", "sets": 3, "reps": 15, "weight": 0},
    {"name": "Plank", "sets": 3, "reps": 30, "weight": 0}
  ],
  "notes": "Rest 60 seconds between sets. Warm up first!"
}
[/WORKOUT_PLAN]"

For skincare routines, use:
[SKINCARE_ROUTINE]
{
  "time_of_day": "AM",
  "scheduled_time": "08:00",
  "products": ["Cleanser", "Vitamin C Serum", "Moisturizer", "SPF 50"],
  "notes": "Apply sunscreen last"
}
[/SKINCARE_ROUTINE]

For goals, use:
[GOAL]
{
  "category": "fitness",
  "title": "Run 5K",
  "description": "Complete a 5K run without stopping",
  "target_value": 1,
  "target_date": "2025-12-31"
}
[/GOAL]

For journal prompts, use:
[JOURNAL_PROMPT]
{
  "title": "Reflection on Today",
  "content": "What made you smile today? What challenged you?"
}
[/JOURNAL_PROMPT]

For hobbies, use:
[HOBBY]
{
  "hobby_name": "Daily Reading",
  "hobby_type": "reading",
  "frequency_goal": "daily",
  "target_count": 1
}
[/HOBBY]

For savings goals, use:
[SAVINGS_GOAL]
{
  "goal_name": "Emergency Fund",
  "target_amount": 5000,
  "target_date": "2025-12-31"
}
[/SAVINGS_GOAL]

REMEMBER:
- ALWAYS include the formatted blocks when users ask for workouts, routines, goals, etc.
- The user will see your friendly text AND get a button to save the plan
- Without the formatted block, they won't be able to save it!`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: 'user', content: message },
    ];

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const response = openaiData.choices[0].message.content;

    return new Response(JSON.stringify({ response }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in ai-chat-coach:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});