import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WeeklySummaryRequest {
  workouts?: number;
  journalEntries?: number;
  skincareRoutines?: number;
  hobbyLogs?: number;
  averageMood?: number;
  achievements?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const data: WeeklySummaryRequest = await req.json();
    const { workouts = 0, journalEntries = 0, skincareRoutines = 0, hobbyLogs = 0, averageMood = 3, achievements = [] } = data;

    const totalActivities = workouts + journalEntries + skincareRoutines + hobbyLogs;
    
    let summary = `# Your Week in Review\n\n`;
    
    if (totalActivities > 20) {
      summary += `🌟 **Outstanding Week!** You logged ${totalActivities} activities this week. Your dedication is truly inspiring!\n\n`;
    } else if (totalActivities > 10) {
      summary += `✨ **Great Week!** You stayed consistent with ${totalActivities} logged activities. Keep up the momentum!\n\n`;
    } else if (totalActivities > 5) {
      summary += `💫 **Good Start!** You logged ${totalActivities} activities. Every small step counts!\n\n`;
    } else {
      summary += `🌱 **Building Habits:** You logged ${totalActivities} activities. Remember, consistency beats perfection!\n\n`;
    }

    summary += `## Activity Breakdown\n\n`;
    
    if (workouts > 0) {
      summary += `💪 **Fitness:** ${workouts} workout${workouts > 1 ? 's' : ''} completed`;
      if (workouts >= 4) summary += ` - Excellent consistency!`;
      else if (workouts >= 3) summary += ` - Great work!`;
      summary += `\n`;
    }
    
    if (skincareRoutines > 0) {
      summary += `✨ **Skincare:** ${skincareRoutines} routine${skincareRoutines > 1 ? 's' : ''} logged`;
      if (skincareRoutines >= 10) summary += ` - Your skin is loving this attention!`;
      summary += `\n`;
    }
    
    if (journalEntries > 0) {
      summary += `📝 **Journaling:** ${journalEntries} entr${journalEntries > 1 ? 'ies' : 'y'} written`;
      if (journalEntries >= 5) summary += ` - Excellent self-reflection habit!`;
      summary += `\n`;
    }
    
    if (hobbyLogs > 0) {
      summary += `🎨 **Hobbies:** ${hobbyLogs} session${hobbyLogs > 1 ? 's' : ''} enjoyed`;
      if (hobbyLogs >= 3) summary += ` - Great work-life balance!`;
      summary += `\n`;
    }

    summary += `\n## Mood & Wellness\n\n`;
    
    if (averageMood >= 4) {
      summary += `😊 Your average mood was **${averageMood.toFixed(1)}/5** - You're thriving! Whatever you're doing is working beautifully.\n\n`;
    } else if (averageMood >= 3) {
      summary += `🙂 Your average mood was **${averageMood.toFixed(1)}/5** - Steady and balanced. Remember to celebrate small wins!\n\n`;
    } else {
      summary += `💙 Your average mood was **${averageMood.toFixed(1)}/5** - Remember, it's okay to have challenging weeks. Be gentle with yourself.\n\n`;
    }

    if (achievements && achievements.length > 0) {
      summary += `## 🏆 Achievements Unlocked\n\n`;
      achievements.forEach((achievement) => {
        summary += `• ${achievement}\n`;
      });
      summary += `\n`;
    }

    summary += `## 💡 Insights & Suggestions\n\n`;
    
    if (workouts < 3) {
      summary += `• Consider adding 1-2 more workouts to reach your weekly fitness goals\n`;
    }
    
    if (journalEntries < 3) {
      summary += `• Try journaling more regularly - even 5 minutes can make a difference\n`;
    }
    
    if (skincareRoutines < 7) {
      summary += `• Consistency is key with skincare - aim for daily AM and PM routines\n`;
    }
    
    if (totalActivities > 15) {
      summary += `• You're doing amazing! Don't forget to include rest days for recovery\n`;
    }
    
    summary += `\n## Looking Ahead\n\n`;
    summary += `This week, focus on:\n`;
    summary += `1. Maintaining your current momentum\n`;
    summary += `2. Being kind to yourself on challenging days\n`;
    summary += `3. Celebrating your progress, no matter how small\n\n`;
    summary += `Remember: You're not competing with anyone. You're building a better version of yourself, one day at a time. 💖`;

    return new Response(
      JSON.stringify({ summary }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
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