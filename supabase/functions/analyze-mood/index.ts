import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MoodAnalysisRequest {
  entries: Array<{
    content: string;
    mood_score: number;
    entry_date: string;
    gratitude_items?: string[];
  }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { entries }: MoodAnalysisRequest = await req.json();

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No journal entries provided' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const avgMood = entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length;
    const moodTrend = entries.length > 1 ? 
      (entries[0].mood_score - entries[entries.length - 1].mood_score > 0 ? 'improving' : 'declining') : 'stable';

    const commonThemes: string[] = [];
    const allContent = entries.map((e) => e.content.toLowerCase()).join(' ');
    
    if (allContent.includes('stress') || allContent.includes('anxious') || allContent.includes('worried')) {
      commonThemes.push('stress management');
    }
    if (allContent.includes('work') || allContent.includes('job') || allContent.includes('career')) {
      commonThemes.push('career/work life');
    }
    if (allContent.includes('friend') || allContent.includes('family') || allContent.includes('relationship')) {
      commonThemes.push('relationships');
    }
    if (allContent.includes('exercise') || allContent.includes('workout') || allContent.includes('health')) {
      commonThemes.push('health and fitness');
    }
    if (allContent.includes('tired') || allContent.includes('sleep') || allContent.includes('exhausted')) {
      commonThemes.push('sleep and energy');
    }

    const gratitudeCount = entries.reduce(
      (sum, e) => sum + (e.gratitude_items?.length || 0),
      0
    );

    const insights = [];
    
    if (avgMood >= 4) {
      insights.push('Your overall mood has been positive! Keep up the great work.');
    } else if (avgMood < 3) {
      insights.push('Your mood scores suggest you might be going through a challenging time. Consider reaching out to friends or a professional.');
    }

    if (moodTrend === 'improving') {
      insights.push('Great news! Your mood has been trending upward. Whatever you\'re doing, it\'s working!');
    } else if (moodTrend === 'declining') {
      insights.push('Your mood has been declining. Consider what might be contributing and how you can address it.');
    }

    if (gratitudeCount > entries.length * 2) {
      insights.push('You\'re doing an excellent job with gratitude practice. This is proven to boost mental well-being!');
    }

    if (commonThemes.includes('stress management')) {
      insights.push('Stress appears to be a recurring theme. Consider incorporating stress-reduction techniques like meditation or exercise.');
    }

    if (commonThemes.includes('sleep and energy')) {
      insights.push('Sleep quality seems to be a concern. Prioritizing good sleep hygiene could significantly improve your overall well-being.');
    }

    const recommendations = [];
    
    if (avgMood < 3.5) {
      recommendations.push('Try to get 30 minutes of outdoor time daily');
      recommendations.push('Connect with a friend or loved one');
      recommendations.push('Practice 5 minutes of deep breathing');
    }
    
    if (commonThemes.includes('stress management')) {
      recommendations.push('Set boundaries with work time');
      recommendations.push('Try progressive muscle relaxation before bed');
    }
    
    if (commonThemes.includes('sleep and energy')) {
      recommendations.push('Establish a consistent sleep schedule');
      recommendations.push('Avoid screens 1 hour before bed');
      recommendations.push('Create a relaxing bedtime routine');
    }

    recommendations.push('Continue journaling - you\'re building a great habit!');

    const analysis = {
      summary: {
        totalEntries: entries.length,
        averageMood: Math.round(avgMood * 10) / 10,
        moodTrend,
        gratitudeItemsLogged: gratitudeCount,
      },
      commonThemes,
      insights,
      recommendations,
      encouragement: 'Remember: progress isn\'t always linear, and taking time to reflect through journaling is a powerful act of self-care. Keep going!',
    };

    return new Response(JSON.stringify(analysis), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});