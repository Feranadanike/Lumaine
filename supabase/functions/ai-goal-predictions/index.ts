import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface Goal {
  id: string;
  category: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  target_date: string | null;
  status: string;
}

interface ActivityData {
  workouts: number;
  journalEntries: number;
  skincareRoutines: number;
  hobbyLogs: number;
  averageMood: number;
}

interface PredictionRequest {
  goals: Goal[];
  activityData: ActivityData;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { goals, activityData }: PredictionRequest = await req.json();

    if (!goals || goals.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No goals provided' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const predictions: any[] = [];

    for (const goal of goals) {
      if (goal.status !== 'active') continue;

      const prediction: any = {
        goalId: goal.id,
        goalTitle: goal.title,
        category: goal.category,
        analysis: '',
        prediction: '',
        recommendations: [],
        likelihood: 0,
        estimatedCompletion: null,
      };

      const progress = goal.target_value ? (goal.current_value / goal.target_value) * 100 : 0;
      const daysToTarget = goal.target_date ? Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

      if (goal.category === 'fitness') {
        const weeklyWorkouts = activityData.workouts;
        
        if (goal.target_value && daysToTarget) {
          const remaining = goal.target_value - goal.current_value;
          const weeksRemaining = Math.max(1, Math.ceil(daysToTarget / 7));
          const requiredPerWeek = remaining / weeksRemaining;
          
          if (weeklyWorkouts >= requiredPerWeek) {
            prediction.likelihood = Math.min(95, 70 + (weeklyWorkouts / requiredPerWeek) * 20);
            prediction.prediction = `On track! At your current pace of ${weeklyWorkouts} workouts per week, you're likely to achieve this goal.`;
          } else {
            prediction.likelihood = Math.max(30, 60 - ((requiredPerWeek - weeklyWorkouts) / requiredPerWeek) * 40);
            prediction.prediction = `You need to increase your workout frequency. Currently ${weeklyWorkouts}/week, but need ${requiredPerWeek.toFixed(1)}/week to reach your goal.`;
            prediction.recommendations.push(`Increase workout frequency to ${Math.ceil(requiredPerWeek)} times per week`);
          }
        } else {
          prediction.prediction = `You've completed ${goal.current_value} workouts. Keep up the momentum!`;
          prediction.likelihood = weeklyWorkouts >= 3 ? 75 : 50;
        }

        prediction.analysis = `Based on ${weeklyWorkouts} workouts per week over the past month.`;
        
        if (weeklyWorkouts < 2) {
          prediction.recommendations.push('Aim for at least 3 workouts per week for optimal progress');
        }
        prediction.recommendations.push('Track your progress weekly to stay motivated');
        prediction.recommendations.push('Consider varying your workout types for better results');

      } else if (goal.category === 'skincare') {
        const routinesPerWeek = activityData.skincareRoutines;
        
        if (goal.target_value && daysToTarget) {
          const remaining = goal.target_value - goal.current_value;
          const weeksRemaining = Math.max(1, Math.ceil(daysToTarget / 7));
          const requiredPerWeek = remaining / weeksRemaining;
          
          if (routinesPerWeek >= requiredPerWeek) {
            prediction.likelihood = Math.min(90, 65 + (routinesPerWeek / requiredPerWeek) * 25);
            prediction.prediction = `Excellent consistency! You're on track to meet your skincare goals.`;
          } else {
            prediction.likelihood = 55;
            prediction.prediction = `Increase consistency. Currently ${routinesPerWeek}/week, need ${requiredPerWeek.toFixed(1)}/week.`;
            prediction.recommendations.push('Set daily reminders for your AM and PM routines');
          }
        } else {
          prediction.prediction = `You've logged ${goal.current_value} routines. Consistency is key!`;
          prediction.likelihood = routinesPerWeek >= 10 ? 80 : 60;
        }

        prediction.analysis = `Based on ${routinesPerWeek} skincare routines per week.`;
        prediction.recommendations.push('Morning and evening routines yield best results');
        prediction.recommendations.push('Take progress photos to track visible changes');

      } else if (goal.category === 'wellness') {
        const journalConsistency = activityData.journalEntries;
        const avgMood = activityData.averageMood;
        
        prediction.analysis = `Based on ${journalConsistency} journal entries and average mood of ${avgMood.toFixed(1)}/5.`;
        
        if (goal.title.toLowerCase().includes('journal') || goal.title.toLowerCase().includes('mood')) {
          if (journalConsistency >= 15) {
            prediction.likelihood = 85;
            prediction.prediction = `Outstanding journaling habit! You're building strong self-awareness.`;
          } else if (journalConsistency >= 7) {
            prediction.likelihood = 70;
            prediction.prediction = `Good progress with journaling. Try to make it a daily habit.`;
            prediction.recommendations.push('Set a consistent time each day for journaling');
          } else {
            prediction.likelihood = 50;
            prediction.prediction = `Journal more frequently to build the habit and achieve your wellness goals.`;
            prediction.recommendations.push('Start with just 5 minutes per day');
            prediction.recommendations.push('Use prompts if you\'re not sure what to write');
          }
        } else {
          prediction.prediction = `Focus on holistic wellness through consistent habits.`;
          prediction.likelihood = avgMood >= 3.5 ? 75 : 60;
        }

        if (avgMood < 3) {
          prediction.recommendations.push('Consider adding stress-management practices');
          prediction.recommendations.push('Prioritize sleep and outdoor time');
        }
        prediction.recommendations.push('Track multiple wellness metrics for comprehensive insights');

      } else if (goal.category === 'financial') {
        if (goal.target_value) {
          const monthlyRequired = goal.target_value / 12;
          const currentMonthly = goal.current_value / 4;
          
          if (currentMonthly >= monthlyRequired) {
            prediction.likelihood = 85;
            prediction.prediction = `Great savings rate! You're on track to meet your financial goal.`;
          } else {
            prediction.likelihood = 60;
            prediction.prediction = `Current pace: $${currentMonthly.toFixed(2)}/month. Need $${monthlyRequired.toFixed(2)}/month.`;
            prediction.recommendations.push('Review spending habits to increase savings');
          }
          
          prediction.analysis = `Based on current savings progress of ${progress.toFixed(1)}%.`;
        } else {
          prediction.prediction = `You've saved $${goal.current_value}. Keep building that financial cushion!`;
          prediction.likelihood = 70;
          prediction.analysis = `Tracking ${goal.current_value} in savings.`;
        }

        prediction.recommendations.push('Automate savings to ensure consistency');
        prediction.recommendations.push('Review and celebrate milestones regularly');

      } else if (goal.category === 'hobby') {
        const hobbyFrequency = activityData.hobbyLogs;
        
        if (goal.target_value && daysToTarget) {
          const remaining = goal.target_value - goal.current_value;
          const weeksRemaining = Math.max(1, Math.ceil(daysToTarget / 7));
          const requiredPerWeek = remaining / weeksRemaining;
          
          if (hobbyFrequency >= requiredPerWeek) {
            prediction.likelihood = 80;
            prediction.prediction = `Wonderful! You're dedicating time to what you love.`;
          } else {
            prediction.likelihood = 65;
            prediction.prediction = `Try to engage with your hobby ${Math.ceil(requiredPerWeek)} times per week.`;
            prediction.recommendations.push('Schedule dedicated hobby time in your calendar');
          }
        } else {
          prediction.prediction = `You've logged ${goal.current_value} hobby sessions. Keep nurturing your passion!`;
          prediction.likelihood = hobbyFrequency >= 2 ? 75 : 55;
        }

        prediction.analysis = `Based on ${hobbyFrequency} hobby sessions per week.`;
        prediction.recommendations.push('Balance hobby time with other commitments');
        prediction.recommendations.push('Share your hobby progress with others for motivation');
      }

      if (daysToTarget) {
        if (daysToTarget < 30) {
          prediction.estimatedCompletion = `${daysToTarget} days remaining`;
        } else if (daysToTarget < 90) {
          prediction.estimatedCompletion = `${Math.ceil(daysToTarget / 7)} weeks remaining`;
        } else {
          prediction.estimatedCompletion = `${Math.ceil(daysToTarget / 30)} months remaining`;
        }
      } else if (goal.target_value && goal.current_value > 0) {
        const rate = goal.current_value / 30;
        const remaining = goal.target_value - goal.current_value;
        const daysNeeded = Math.ceil(remaining / rate);
        
        if (daysNeeded < 365) {
          prediction.estimatedCompletion = `Estimated ${daysNeeded} days at current pace`;
        }
      }

      predictions.push(prediction);
    }

    const summary = {
      totalGoals: goals.length,
      activeGoals: goals.filter(g => g.status === 'active').length,
      overallMotivation: predictions.length > 0 
        ? `You have ${predictions.length} active ${predictions.length === 1 ? 'goal' : 'goals'}. Stay focused and consistent!`
        : 'Set some goals to get personalized predictions and insights!',
      predictions,
    };

    return new Response(JSON.stringify(summary), {
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