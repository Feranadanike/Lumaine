import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

async function extractTextFromPDF(fileUrl: string, openaiApiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract ALL text content from this PDF document. Preserve the structure, headings, and formatting as much as possible. Include all important information such as:\n- Main topics and subtopics\n- Key concepts and definitions\n- Formulas, equations, or code snippets\n- Important facts, dates, or figures\n- Any tables or structured data\n- Diagrams or charts (describe them)\n\nBe thorough and detailed. This will be used for study purposes.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: fileUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error('OpenAI API failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '[PDF file - unable to extract text automatically. Please describe what you need help with or ask specific questions about this document.]';
  }
}

async function extractTextFromImage(fileUrl: string, openaiApiKey: string): Promise<string> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text content from this image. If it contains handwritten notes, diagrams, or study materials, describe them in detail. Include any formulas, equations, or important visual information that would help someone study this material.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: fileUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI Vision API failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Image OCR error:', error);
    return '[Image file - unable to process automatically. Please describe what you see in the image.]';
  }
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

    const { fileUrl, fileType, fileName } = await req.json();

    if (!fileUrl || !fileType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let extractedText = '';

    if (fileType === 'text/plain') {
      const response = await fetch(fileUrl);
      extractedText = await response.text();
      extractedText = extractedText.substring(0, 50000);
    } else if (fileType === 'application/pdf') {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        extractedText = '[PDF file - AI vision not configured. Please describe the content.]';
      } else {
        extractedText = await extractTextFromPDF(fileUrl, openaiApiKey);
      }
    } else if (fileType.startsWith('image/')) {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiApiKey) {
        extractedText = '[Image file - AI vision not configured. Please describe the content.]';
      } else {
        extractedText = await extractTextFromImage(fileUrl, openaiApiKey);
      }
    } else {
      extractedText = `[${fileName} - Unsupported file type. Please describe what you need help with.]`;
    }

    return new Response(
      JSON.stringify({ extractedText }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in process-study-file:', error);
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
