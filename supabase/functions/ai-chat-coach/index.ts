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

    const systemPrompt = `You are Lumaine AI Coach, a supportive and motivational personal wellness assistant. You help users with:
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
- Brief and conversational (2-4 sentences usually)

Provide specific, actionable advice. Use emojis sparingly and naturally. Celebrate wins and encourage through setbacks.

IMPORTANT: When you create a workout plan, skincare routine, goal, journal prompt, hobby suggestion, or savings plan, format your response with special markers:

For workout plans, use:
[WORKOUT_PLAN]
{
  "workout_name": "Upper Body Day",
  "exercises": [
    {"name": "Bench Press", "sets": 3, "reps": 10, "weight": 135},
    {"name": "Rows", "sets": 3, "reps": 12, "weight": 100}
  ],
  "notes": "Focus on form"
}
[/WORKOUT_PLAN]

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

Include these blocks in your conversational response when creating plans, routines, or goals for users.`;

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