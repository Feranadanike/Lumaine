import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log(`Deleting account for user: ${user.id}`);

    const tables = [
      'daily_activities',
      'user_achievements',
      'meditation_sessions',
      'sleep_logs',
      'water_intake',
      'planned_workouts',
      'planned_skincare_routines',
      'skincare_routine_schedules',
      'savings_transactions',
      'hobby_logs',
      'workout_sessions',
      'skincare_logs',
      'skincare_products',
      'journal_entries',
      'daily_achievements',
      'weekly_reflections',
      'hobbies',
      'daily_planner',
      'weekly_planner',
      'monthly_planner',
      'yearly_goals',
      'reminders',
      'goals',
      'savings_goals',
      'saved_links',
      'entertainment_items',
      'user_profiles',
    ];

    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('user_id', user.id);

        if (error) {
          console.error(`Error deleting from ${table}:`, error);
        } else {
          console.log(`Successfully deleted from ${table}`);
        }
      } catch (tableError) {
        console.error(`Exception deleting from ${table}:`, tableError);
      }
    }

    try {
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) {
        console.error('Error deleting user_profiles:', profileError);
      } else {
        console.log('Successfully deleted user_profiles');
      }
    } catch (profileException) {
      console.error('Exception deleting user_profiles:', profileException);
    }

    console.log('Attempting to delete auth user...');
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id,
      true
    );

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      console.error('Delete auth error details:', JSON.stringify(deleteAuthError));
      return new Response(
        JSON.stringify({
          error: 'Failed to delete authentication account',
          details: deleteAuthError.message || 'Unknown error'
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    console.log('Account deleted successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in delete-account function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
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