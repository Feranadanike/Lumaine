import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SkincareRequest {
  skinType?: string;
  concerns?: string[];
  timeOfDay: 'AM' | 'PM';
  products?: Array<{ name: string; type: string; ingredients?: string[] }>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { skinType, concerns, timeOfDay, products }: SkincareRequest = await req.json();

    let routine: any = {};

    if (timeOfDay === 'AM') {
      routine = {
        routine: [
          {
            step: 1,
            category: 'Cleanser',
            recommendation: 'Gentle morning cleanser to remove overnight oils',
            productSuggestion: products?.find((p) => p.type === 'cleanser')?.name || 'Gentle foaming cleanser',
            notes: 'Use lukewarm water and massage gently for 30 seconds',
          },
          {
            step: 2,
            category: 'Toner',
            recommendation: 'Hydrating toner to balance pH',
            productSuggestion: products?.find((p) => p.type === 'toner')?.name || 'Hydrating toner',
            notes: 'Pat gently into skin, don\'t rub',
          },
          {
            step: 3,
            category: 'Serum',
            recommendation: skinType === 'oily' ? 'Vitamin C serum for brightening' : 'Hyaluronic acid for hydration',
            productSuggestion: products?.find((p) => p.type === 'serum')?.name || 'Vitamin C serum',
            notes: 'Apply to slightly damp skin for better absorption',
          },
          {
            step: 4,
            category: 'Eye Cream',
            recommendation: 'Lightweight eye cream',
            productSuggestion: products?.find((p) => p.type === 'eye_cream')?.name || 'Caffeine eye cream',
            notes: 'Gently pat around orbital bone, avoid pulling skin',
          },
          {
            step: 5,
            category: 'Moisturizer',
            recommendation: skinType === 'oily' ? 'Oil-free gel moisturizer' : 'Hydrating cream',
            productSuggestion: products?.find((p) => p.type === 'moisturizer')?.name || 'Daily moisturizer',
            notes: 'Apply while skin is still slightly damp',
          },
          {
            step: 6,
            category: 'Sunscreen',
            recommendation: 'SPF 30+ broad spectrum sunscreen - ESSENTIAL!',
            productSuggestion: products?.find((p) => p.type === 'sunscreen')?.name || 'SPF 50 sunscreen',
            notes: 'Apply generously - reapply every 2 hours if outdoors',
          },
        ],
        tips: [
          'Always apply products from thinnest to thickest consistency',
          'Wait 30-60 seconds between each step for better absorption',
          'Sunscreen is the most important anti-aging product',
        ],
      };
    } else {
      routine = {
        routine: [
          {
            step: 1,
            category: 'Makeup Remover/Oil Cleanser',
            recommendation: 'Double cleanse - start with oil-based cleanser',
            productSuggestion: products?.find((p) => p.type === 'oil')?.name || 'Cleansing oil',
            notes: 'Massage for 1 minute to dissolve makeup and sunscreen',
          },
          {
            step: 2,
            category: 'Water-based Cleanser',
            recommendation: 'Follow with gentle foaming or cream cleanser',
            productSuggestion: products?.find((p) => p.type === 'cleanser')?.name || 'Gentle cleanser',
            notes: 'This removes any remaining residue',
          },
          {
            step: 3,
            category: 'Exfoliant (2-3x per week)',
            recommendation: concerns?.includes('acne') ? 'BHA (salicylic acid)' : 'AHA (glycolic acid)',
            productSuggestion: products?.find((p) => p.type === 'exfoliant')?.name || 'Chemical exfoliant',
            notes: 'Use only 2-3 times per week, not daily. Skip if skin feels sensitive',
          },
          {
            step: 4,
            category: 'Toner',
            recommendation: 'Hydrating or treatment toner',
            productSuggestion: products?.find((p) => p.type === 'toner')?.name || 'Hydrating toner',
            notes: 'Pat into skin - this is when skin absorbs best',
          },
          {
            step: 5,
            category: 'Treatment Serum',
            recommendation: concerns?.includes('aging') ? 'Retinol serum' : 'Niacinamide serum',
            productSuggestion: products?.find((p) => p.type === 'serum')?.name || 'Treatment serum',
            notes: 'Start slow with active ingredients - 2x per week initially',
          },
          {
            step: 6,
            category: 'Eye Cream',
            recommendation: 'Richer nighttime eye cream',
            productSuggestion: products?.find((p) => p.type === 'eye_cream')?.name || 'Peptide eye cream',
            notes: 'Use ring finger for gentlest application',
          },
          {
            step: 7,
            category: 'Moisturizer',
            recommendation: 'Richer night cream for repair',
            productSuggestion: products?.find((p) => p.type === 'moisturizer')?.name || 'Night cream',
            notes: 'Can be heavier than daytime - skin repairs at night',
          },
          {
            step: 8,
            category: 'Face Oil (optional)',
            recommendation: 'Seal everything in with a face oil',
            productSuggestion: products?.find((p) => p.type === 'oil')?.name || 'Rosehip or squalane oil',
            notes: 'Optional last step to lock in moisture',
          },
        ],
        tips: [
          'PM routine is for treatment and repair',
          'Always apply actives (retinol, acids) to dry skin',
          'Consistency is more important than using many products',
          'Listen to your skin - if it\'s irritated, simplify your routine',
        ],
      };
    }

    return new Response(JSON.stringify(routine), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});