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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message || 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userId = user.id;
    console.log(`Soft deleting account for user: ${userId}`);

    // Mark user profile as deleted
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({ 
        deleted_at: new Date().toISOString(),
        status: 'deleted'
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating user profile:', profileError);
      return new Response(
        JSON.stringify({
          error: 'Failed to mark account as deleted',
          details: profileError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Disable the auth user account (they cannot log in anymore)
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { ban_duration: '876000h' } // Ban for 100 years (effectively permanent)
    );

    if (updateAuthError) {
      console.error('Error disabling auth account:', updateAuthError);
      return new Response(
        JSON.stringify({
          error: 'Failed to disable authentication account',
          details: updateAuthError.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Account soft deleted successfully for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account deleted successfully. Your data will be permanently removed in 30 days.' 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in delete-account function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});