import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find accounts marked for deletion over 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`Checking for accounts deleted before: ${thirtyDaysAgo.toISOString()}`);

    const { data: deletedProfiles, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('status', 'deleted')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', thirtyDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching deleted profiles:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch deleted profiles', details: fetchError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!deletedProfiles || deletedProfiles.length === 0) {
      console.log('No accounts to permanently delete');
      return new Response(
        JSON.stringify({ success: true, message: 'No accounts to delete', count: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Found ${deletedProfiles.length} accounts to permanently delete`);

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
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const profile of deletedProfiles) {
      const userId = profile.id;
      console.log(`Permanently deleting user: ${userId}`);

      try {
        // Delete data from all tables
        for (const table of tables) {
          try {
            await supabaseAdmin.from(table).delete().eq('user_id', userId);
          } catch (e) {
            console.error(`Error deleting from ${table} for user ${userId}:`, e);
          }
        }

        // Delete user profile
        await supabaseAdmin.from('user_profiles').delete().eq('id', userId);

        // Delete auth user
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (deleteAuthError) {
          console.error(`Error deleting auth user ${userId}:`, deleteAuthError);
          errorCount++;
        } else {
          console.log(`Successfully deleted user: ${userId}`);
          successCount++;
        }
      } catch (e) {
        console.error(`Error during permanent deletion for user ${userId}:`, e);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup complete`,
        total: deletedProfiles.length,
        successful: successCount,
        errors: errorCount
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in cleanup-deleted-accounts function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});