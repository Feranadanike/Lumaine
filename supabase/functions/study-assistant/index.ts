import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StudyAssistantRequest {
  sessionId: string;
  message: string;
  conversationHistory: ChatMessage[];
  studyMaterials?: {
    fileName: string;
    extractedText: string;
  }[];
}

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
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { sessionId, message, conversationHistory, studyMaterials }: StudyAssistantRequest = await req.json();

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

    await supabase
      .from('study_chat_messages')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        role: 'user',
        content: message,
      });

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    let materialsContext = '';
    if (studyMaterials && studyMaterials.length > 0) {
      materialsContext = '\n\nStudy Materials Available:\n' +
        studyMaterials.map((m, i) =>
          `\n--- Material ${i + 1}: ${m.fileName} ---\n${m.extractedText}\n`
        ).join('\n');
    }

    const systemPrompt = `You are a helpful AI study assistant. Your role is to help students learn and understand their study materials better.

${materialsContext}

Your capabilities:
- Answer questions about the uploaded study materials
- Explain difficult concepts in simple terms
- Quiz the student on the material
- Summarize sections or create study guides
- Create flashcards from key points
- Connect related ideas and concepts
- Suggest what to focus on next
- Break down complex formulas or processes

Your tone should be:
- Patient and encouraging
- Clear and educational
- Supportive but challenging when appropriate
- Focused on helping the student truly understand, not just memorize

When explaining concepts:
- Use analogies and examples
- Break complex ideas into smaller parts
- Check for understanding
- Encourage critical thinking

If the student seems stuck, offer hints rather than direct answers. Celebrate progress and understanding!`;

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
        max_tokens: 1500,
      }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openaiData = await openaiResponse.json();
    const response = openaiData.choices[0].message.content;

    await supabase
      .from('study_chat_messages')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        role: 'assistant',
        content: response,
      });

    return new Response(JSON.stringify({ response }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error in study-assistant:', error);
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
