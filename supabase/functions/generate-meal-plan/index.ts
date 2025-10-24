import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface MealPlanRequest {
  dietaryPreferences?: string;
  fitnessGoals?: string;
  calorieTarget?: number;
  daysCount?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { dietaryPreferences, fitnessGoals, calorieTarget, daysCount }: MealPlanRequest = await req.json();

    const meals = [
      {
        day: 0,
        breakfast: {
          name: 'Greek Yogurt Parfait',
          ingredients: [
            { name: 'Greek yogurt', amount: '1', unit: 'cup' },
            { name: 'Mixed berries', amount: '1/2', unit: 'cup' },
            { name: 'Granola', amount: '1/4', unit: 'cup' },
            { name: 'Honey', amount: '1', unit: 'tbsp' }
          ],
          instructions: '1. Layer Greek yogurt in a bowl\n2. Top with mixed berries\n3. Sprinkle granola\n4. Drizzle with honey',
          prepTime: 5,
          cookTime: 0,
          servings: 1,
          calories: 320,
          protein: 20,
          carbs: 45,
          fats: 8
        },
        lunch: {
          name: 'Grilled Chicken Salad',
          ingredients: [
            { name: 'Chicken breast', amount: '6', unit: 'oz' },
            { name: 'Mixed greens', amount: '3', unit: 'cups' },
            { name: 'Cherry tomatoes', amount: '1', unit: 'cup' },
            { name: 'Cucumber', amount: '1', unit: 'medium' },
            { name: 'Olive oil', amount: '2', unit: 'tbsp' },
            { name: 'Lemon juice', amount: '1', unit: 'tbsp' }
          ],
          instructions: '1. Grill chicken breast until cooked through\n2. Slice chicken\n3. Toss greens, tomatoes, cucumber\n4. Top with chicken\n5. Drizzle with olive oil and lemon',
          prepTime: 10,
          cookTime: 15,
          servings: 1,
          calories: 420,
          protein: 45,
          carbs: 15,
          fats: 20
        },
        dinner: {
          name: 'Salmon with Roasted Vegetables',
          ingredients: [
            { name: 'Salmon fillet', amount: '6', unit: 'oz' },
            { name: 'Broccoli', amount: '2', unit: 'cups' },
            { name: 'Bell peppers', amount: '1', unit: 'cup' },
            { name: 'Olive oil', amount: '2', unit: 'tbsp' },
            { name: 'Garlic powder', amount: '1', unit: 'tsp' },
            { name: 'Lemon', amount: '1/2', unit: 'whole' }
          ],
          instructions: '1. Preheat oven to 400°F\n2. Season salmon with garlic powder\n3. Toss vegetables with olive oil\n4. Arrange on baking sheet\n5. Bake for 18-20 minutes\n6. Squeeze lemon over salmon',
          prepTime: 10,
          cookTime: 20,
          servings: 1,
          calories: 480,
          protein: 42,
          carbs: 18,
          fats: 28
        },
        snack: {
          name: 'Apple with Almond Butter',
          ingredients: [
            { name: 'Apple', amount: '1', unit: 'medium' },
            { name: 'Almond butter', amount: '2', unit: 'tbsp' }
          ],
          instructions: '1. Slice apple\n2. Spread almond butter on slices',
          prepTime: 3,
          cookTime: 0,
          servings: 1,
          calories: 200,
          protein: 6,
          carbs: 25,
          fats: 10
        }
      },
      {
        day: 1,
        breakfast: {
          name: 'Veggie Omelette',
          ingredients: [
            { name: 'Eggs', amount: '3', unit: 'whole' },
            { name: 'Spinach', amount: '1', unit: 'cup' },
            { name: 'Mushrooms', amount: '1/2', unit: 'cup' },
            { name: 'Tomatoes', amount: '1/4', unit: 'cup' },
            { name: 'Cheese', amount: '1/4', unit: 'cup' },
            { name: 'Olive oil', amount: '1', unit: 'tsp' }
          ],
          instructions: '1. Beat eggs in a bowl\n2. Sauté vegetables in olive oil\n3. Pour eggs over vegetables\n4. Add cheese\n5. Fold and cook until set',
          prepTime: 5,
          cookTime: 10,
          servings: 1,
          calories: 340,
          protein: 26,
          carbs: 8,
          fats: 24
        },
        lunch: {
          name: 'Turkey Wrap',
          ingredients: [
            { name: 'Whole wheat tortilla', amount: '1', unit: 'large' },
            { name: 'Turkey breast', amount: '4', unit: 'oz' },
            { name: 'Lettuce', amount: '1', unit: 'cup' },
            { name: 'Tomato', amount: '1', unit: 'medium' },
            { name: 'Avocado', amount: '1/4', unit: 'whole' },
            { name: 'Mustard', amount: '1', unit: 'tbsp' }
          ],
          instructions: '1. Lay tortilla flat\n2. Layer turkey, lettuce, tomato\n3. Add sliced avocado\n4. Spread mustard\n5. Roll tightly and cut in half',
          prepTime: 8,
          cookTime: 0,
          servings: 1,
          calories: 380,
          protein: 32,
          carbs: 35,
          fats: 12
        },
        dinner: {
          name: 'Chicken Stir-Fry',
          ingredients: [
            { name: 'Chicken breast', amount: '6', unit: 'oz' },
            { name: 'Mixed vegetables', amount: '2', unit: 'cups' },
            { name: 'Brown rice', amount: '1', unit: 'cup cooked' },
            { name: 'Soy sauce', amount: '2', unit: 'tbsp' },
            { name: 'Ginger', amount: '1', unit: 'tsp' },
            { name: 'Garlic', amount: '2', unit: 'cloves' },
            { name: 'Sesame oil', amount: '1', unit: 'tbsp' }
          ],
          instructions: '1. Cut chicken into bite-sized pieces\n2. Heat sesame oil in wok\n3. Stir-fry chicken until golden\n4. Add vegetables, ginger, garlic\n5. Add soy sauce\n6. Serve over brown rice',
          prepTime: 15,
          cookTime: 15,
          servings: 1,
          calories: 520,
          protein: 45,
          carbs: 52,
          fats: 14
        },
        snack: {
          name: 'Protein Smoothie',
          ingredients: [
            { name: 'Protein powder', amount: '1', unit: 'scoop' },
            { name: 'Banana', amount: '1', unit: 'medium' },
            { name: 'Almond milk', amount: '1', unit: 'cup' },
            { name: 'Spinach', amount: '1', unit: 'cup' },
            { name: 'Ice', amount: '1', unit: 'cup' }
          ],
          instructions: '1. Add all ingredients to blender\n2. Blend until smooth\n3. Pour and enjoy',
          prepTime: 5,
          cookTime: 0,
          servings: 1,
          calories: 250,
          protein: 28,
          carbs: 32,
          fats: 3
        }
      },
      {
        day: 2,
        breakfast: {
          name: 'Overnight Oats',
          ingredients: [
            { name: 'Rolled oats', amount: '1/2', unit: 'cup' },
            { name: 'Almond milk', amount: '1', unit: 'cup' },
            { name: 'Chia seeds', amount: '1', unit: 'tbsp' },
            { name: 'Banana', amount: '1', unit: 'medium' },
            { name: 'Cinnamon', amount: '1/2', unit: 'tsp' },
            { name: 'Maple syrup', amount: '1', unit: 'tbsp' }
          ],
          instructions: '1. Mix oats, milk, chia seeds in jar\n2. Add cinnamon\n3. Refrigerate overnight\n4. Top with sliced banana and maple syrup',
          prepTime: 5,
          cookTime: 0,
          servings: 1,
          calories: 350,
          protein: 12,
          carbs: 62,
          fats: 8
        },
        lunch: {
          name: 'Tuna Salad Bowl',
          ingredients: [
            { name: 'Canned tuna', amount: '5', unit: 'oz' },
            { name: 'Mixed greens', amount: '3', unit: 'cups' },
            { name: 'Hard boiled eggs', amount: '2', unit: 'whole' },
            { name: 'Olives', amount: '1/4', unit: 'cup' },
            { name: 'Cherry tomatoes', amount: '1', unit: 'cup' },
            { name: 'Olive oil', amount: '2', unit: 'tbsp' }
          ],
          instructions: '1. Drain tuna\n2. Arrange greens in bowl\n3. Top with tuna, eggs, olives, tomatoes\n4. Drizzle with olive oil',
          prepTime: 10,
          cookTime: 0,
          servings: 1,
          calories: 440,
          protein: 42,
          carbs: 12,
          fats: 26
        },
        dinner: {
          name: 'Lean Beef Tacos',
          ingredients: [
            { name: 'Ground beef (lean)', amount: '6', unit: 'oz' },
            { name: 'Corn tortillas', amount: '3', unit: 'small' },
            { name: 'Lettuce', amount: '1', unit: 'cup' },
            { name: 'Tomatoes', amount: '1/2', unit: 'cup' },
            { name: 'Greek yogurt', amount: '2', unit: 'tbsp' },
            { name: 'Salsa', amount: '2', unit: 'tbsp' },
            { name: 'Taco seasoning', amount: '1', unit: 'tbsp' }
          ],
          instructions: '1. Brown ground beef\n2. Add taco seasoning and water\n3. Simmer until thickened\n4. Warm tortillas\n5. Fill with beef, lettuce, tomatoes\n6. Top with yogurt and salsa',
          prepTime: 10,
          cookTime: 15,
          servings: 1,
          calories: 490,
          protein: 42,
          carbs: 38,
          fats: 18
        },
        snack: {
          name: 'Cottage Cheese with Berries',
          ingredients: [
            { name: 'Cottage cheese', amount: '1', unit: 'cup' },
            { name: 'Mixed berries', amount: '1/2', unit: 'cup' }
          ],
          instructions: '1. Place cottage cheese in bowl\n2. Top with berries',
          prepTime: 2,
          cookTime: 0,
          servings: 1,
          calories: 180,
          protein: 24,
          carbs: 18,
          fats: 2
        }
      }
    ];

    const days = (daysCount && daysCount > 0 && daysCount <= 7) ? daysCount : 3;
    const selectedMeals = meals.slice(0, days);

    return new Response(JSON.stringify({ meals: selectedMeals }), {
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