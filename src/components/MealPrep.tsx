import { useEffect, useState } from 'react';
import {
  Plus,
  X,
  ChefHat,
  Calendar,
  ShoppingCart,
  Book,
  Sparkles,
  Trash2,
  Check,
  Clock,
  Utensils,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Recipe, MealPlan, GroceryList, GroceryItem, Ingredient } from '../types';

type View = 'planner' | 'recipes' | 'grocery';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function MealPrep() {
  const { user } = useAuth();
  const [view, setView] = useState<View>('planner');
  const [loading, setLoading] = useState(true);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [groceryLists, setGroceryLists] = useState<GroceryList[]>([]);
  const [selectedGroceryItems, setSelectedGroceryItems] = useState<GroceryItem[]>([]);
  const [selectedGroceryList, setSelectedGroceryList] = useState<string | null>(null);

  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [showMealPlanForm, setShowMealPlanForm] = useState(false);
  const [showGroceryForm, setShowGroceryForm] = useState(false);
  const [showAIForm, setShowAIForm] = useState(false);

  const [newRecipe, setNewRecipe] = useState({
    recipe_name: '',
    description: '',
    ingredients: [] as Ingredient[],
    instructions: '',
    prep_time_minutes: 0,
    cook_time_minutes: 0,
    servings: 1,
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    category: 'dinner',
    tags: [] as string[],
  });

  const [currentIngredient, setCurrentIngredient] = useState({
    name: '',
    amount: '',
    unit: '',
  });

  const [newMealPlan, setNewMealPlan] = useState({
    plan_date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    recipe_id: '',
    custom_meal_name: '',
    notes: '',
  });

  const [newGroceryList, setNewGroceryList] = useState({
    list_name: '',
  });

  const [newGroceryItem, setNewGroceryItem] = useState({
    item_name: '',
    amount: '',
    category: '',
  });

  const [aiParams, setAiParams] = useState({
    dietaryPreferences: '',
    fitnessGoals: '',
    calorieTarget: 2000,
    daysCount: 3,
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [recipesRes, mealPlansRes, groceryListsRes] = await Promise.all([
        supabase.from('recipes').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase
          .from('meal_plans')
          .select('*, recipe:recipes(*)')
          .eq('user_id', user?.id)
          .gte('plan_date', getStartOfWeek())
          .lte('plan_date', getEndOfWeek())
          .order('plan_date'),
        supabase
          .from('grocery_lists')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
      ]);

      if (recipesRes.data) setRecipes(recipesRes.data);
      if (mealPlansRes.data) setMealPlans(mealPlansRes.data);
      if (groceryListsRes.data) setGroceryLists(groceryListsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGroceryItems = async (listId: string) => {
    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('grocery_list_id', listId)
        .order('category');

      if (error) throw error;
      if (data) setSelectedGroceryItems(data);
    } catch (error) {
      console.error('Error loading grocery items:', error);
    }
  };

  const getStartOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const getEndOfWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() + (6 - day);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const handleGenerateMealPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setGeneratingPlan(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-meal-plan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiParams),
      });

      if (!response.ok) throw new Error('Failed to generate meal plan');

      const { meals } = await response.json();
      const startDate = new Date(getStartOfWeek());

      for (const dayMeal of meals) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayMeal.day);
        const dateStr = dayDate.toISOString().split('T')[0];

        for (const mealType of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
          const mealData = dayMeal[mealType];
          if (!mealData) continue;

          const { data: recipe } = await supabase
            .from('recipes')
            .insert({
              user_id: user.id,
              recipe_name: mealData.name,
              ingredients: mealData.ingredients,
              instructions: mealData.instructions,
              prep_time_minutes: mealData.prepTime,
              cook_time_minutes: mealData.cookTime,
              servings: mealData.servings,
              calories: mealData.calories,
              protein: mealData.protein,
              carbs: mealData.carbs,
              fats: mealData.fats,
              category: mealType,
            })
            .select()
            .single();

          if (recipe) {
            await supabase.from('meal_plans').insert({
              user_id: user.id,
              plan_date: dateStr,
              meal_type: mealType,
              recipe_id: recipe.id,
            });
          }
        }
      }

      await loadData();
      setShowAIForm(false);
      setAiParams({ dietaryPreferences: '', fitnessGoals: '', calorieTarget: 2000, daysCount: 3 });
    } catch (error) {
      console.error('Error generating meal plan:', error);
      alert('Failed to generate meal plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleAddIngredient = () => {
    if (currentIngredient.name && currentIngredient.amount) {
      setNewRecipe({
        ...newRecipe,
        ingredients: [...newRecipe.ingredients, { ...currentIngredient }],
      });
      setCurrentIngredient({ name: '', amount: '', unit: '' });
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setNewRecipe({
      ...newRecipe,
      ingredients: newRecipe.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          ...newRecipe,
        })
        .select()
        .single();

      if (error) throw error;

      setRecipes([data, ...recipes]);
      setNewRecipe({
        recipe_name: '',
        description: '',
        ingredients: [],
        instructions: '',
        prep_time_minutes: 0,
        cook_time_minutes: 0,
        servings: 1,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        category: 'dinner',
        tags: [],
      });
      setShowRecipeForm(false);
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const handleSaveMealPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          ...newMealPlan,
          recipe_id: newMealPlan.recipe_id || null,
          custom_meal_name: newMealPlan.custom_meal_name || null,
          notes: newMealPlan.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      await loadData();
      setNewMealPlan({
        plan_date: new Date().toISOString().split('T')[0],
        meal_type: 'breakfast',
        recipe_id: '',
        custom_meal_name: '',
        notes: '',
      });
      setShowMealPlanForm(false);
    } catch (error) {
      console.error('Error saving meal plan:', error);
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId);
      if (error) throw error;
      setRecipes(recipes.filter((r) => r.id !== recipeId));
    } catch (error) {
      console.error('Error deleting recipe:', error);
    }
  };

  const handleDeleteMealPlan = async (mealPlanId: string) => {
    if (!confirm('Are you sure you want to remove this meal?')) return;

    try {
      const { error } = await supabase.from('meal_plans').delete().eq('id', mealPlanId);
      if (error) throw error;
      setMealPlans(mealPlans.filter((mp) => mp.id !== mealPlanId));
    } catch (error) {
      console.error('Error deleting meal plan:', error);
    }
  };

  const handleCreateGroceryList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .insert({
          user_id: user.id,
          list_name: newGroceryList.list_name,
        })
        .select()
        .single();

      if (error) throw error;

      setGroceryLists([data, ...groceryLists]);
      setNewGroceryList({ list_name: '' });
      setShowGroceryForm(false);
    } catch (error) {
      console.error('Error creating grocery list:', error);
    }
  };

  const handleAddGroceryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroceryList) return;

    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .insert({
          grocery_list_id: selectedGroceryList,
          ...newGroceryItem,
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedGroceryItems([...selectedGroceryItems, data]);
      setNewGroceryItem({ item_name: '', amount: '', category: '' });
    } catch (error) {
      console.error('Error adding grocery item:', error);
    }
  };

  const handleToggleGroceryItem = async (itemId: string, isChecked: boolean) => {
    try {
      const { error } = await supabase
        .from('grocery_items')
        .update({ is_checked: !isChecked })
        .eq('id', itemId);

      if (error) throw error;

      setSelectedGroceryItems(
        selectedGroceryItems.map((item) => (item.id === itemId ? { ...item, is_checked: !isChecked } : item))
      );
    } catch (error) {
      console.error('Error toggling grocery item:', error);
    }
  };

  const handleGenerateGroceryList = async () => {
    if (!user) return;

    try {
      const weekMeals = mealPlans.filter(
        (mp) => mp.plan_date >= getStartOfWeek() && mp.plan_date <= getEndOfWeek()
      );

      const allIngredients: { [key: string]: { amount: string; unit: string } } = {};

      for (const meal of weekMeals) {
        if (meal.recipe && meal.recipe.ingredients) {
          for (const ing of meal.recipe.ingredients as Ingredient[]) {
            if (allIngredients[ing.name]) {
              continue;
            }
            allIngredients[ing.name] = { amount: ing.amount, unit: ing.unit };
          }
        }
      }

      const { data: list, error: listError } = await supabase
        .from('grocery_lists')
        .insert({
          user_id: user.id,
          list_name: `Week of ${getStartOfWeek()}`,
        })
        .select()
        .single();

      if (listError) throw listError;

      for (const [name, { amount, unit }] of Object.entries(allIngredients)) {
        await supabase.from('grocery_items').insert({
          grocery_list_id: list.id,
          item_name: name,
          amount: `${amount} ${unit}`,
          category: 'produce',
        });
      }

      await loadData();
      setSelectedGroceryList(list.id);
      await loadGroceryItems(list.id);
      setView('grocery');
    } catch (error) {
      console.error('Error generating grocery list:', error);
      alert('Failed to generate grocery list');
    }
  };

  const getMealForDateAndType = (date: string, type: string) => {
    return mealPlans.find((mp) => mp.plan_date === date && mp.meal_type === type);
  };

  const getWeekDates = () => {
    const start = new Date(getStartOfWeek());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading...</div>;
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-orange-500" />
            Meal Prep
          </h1>
          <p className="text-slate-600 mt-1">Plan meals, save recipes, and manage grocery lists</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 w-full lg:w-auto">
          <button
            onClick={() => setView('planner')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'planner' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-1" />
            Planner
          </button>
          <button
            onClick={() => setView('recipes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'recipes' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
            }`}
          >
            <Book className="h-4 w-4 inline mr-1" />
            Recipes
          </button>
          <button
            onClick={() => setView('grocery')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'grocery' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'
            }`}
          >
            <ShoppingCart className="h-4 w-4 inline mr-1" />
            Grocery
          </button>
        </div>
      </div>

      {view === 'planner' && (
        <>
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              onClick={handleGenerateGroceryList}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-lg"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="hidden sm:inline">Generate Grocery List</span>
              <span className="sm:hidden">Grocery</span>
            </button>
            <button
              onClick={() => setShowAIForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors shadow-lg"
            >
              <Sparkles className="h-5 w-5" />
              <span className="hidden sm:inline">AI Meal Plan</span>
              <span className="sm:hidden">AI</span>
            </button>
            <button
              onClick={() => setShowMealPlanForm(true)}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Add Meal</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Meal</th>
                    {getWeekDates().map((date, idx) => (
                      <th key={date} className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                        <div>{DAYS_OF_WEEK[idx]}</div>
                        <div className="text-xs text-slate-500">{new Date(date).getDate()}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MEAL_TYPES.map((mealType) => (
                    <tr key={mealType} className="border-b">
                      <td className="px-4 py-3 font-medium text-slate-900 capitalize">{mealType}</td>
                      {getWeekDates().map((date) => {
                        const meal = getMealForDateAndType(date, mealType);
                        return (
                          <td key={date} className="px-2 py-3 text-center">
                            {meal ? (
                              <div className="group relative">
                                <div className="text-xs text-slate-700 bg-orange-50 p-2 rounded">
                                  {meal.recipe?.recipe_name || meal.custom_meal_name}
                                  {meal.recipe && (
                                    <div className="text-xs text-slate-500 mt-1">
                                      {meal.recipe.calories}cal • {meal.recipe.protein}g protein
                                    </div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleDeleteMealPlan(meal.id)}
                                  className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400">-</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === 'recipes' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setShowRecipeForm(true)}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
              New Recipe
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {recipes.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl shadow-lg p-12 text-center">
                <Book className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No recipes yet. Add your first recipe!</p>
              </div>
            ) : (
              recipes.map((recipe) => (
                <div key={recipe.id} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">{recipe.recipe_name}</h3>
                      {recipe.description && <p className="text-sm text-slate-600 mt-1">{recipe.description}</p>}
                      <div className="flex gap-3 mt-2 text-xs text-slate-500">
                        {recipe.prep_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Prep: {recipe.prep_time_minutes}m
                          </span>
                        )}
                        {recipe.cook_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Cook: {recipe.cook_time_minutes}m
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Utensils className="h-3 w-3" />
                          {recipe.servings} servings
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  {recipe.calories && (
                    <div className="flex gap-4 mb-3 text-sm bg-orange-50 p-3 rounded-lg">
                      <span className="font-semibold">{recipe.calories} cal</span>
                      {recipe.protein && <span>P: {recipe.protein}g</span>}
                      {recipe.carbs && <span>C: {recipe.carbs}g</span>}
                      {recipe.fats && <span>F: {recipe.fats}g</span>}
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900 text-sm">Ingredients:</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {(recipe.ingredients as Ingredient[]).map((ing, idx) => (
                        <li key={idx}>
                          • {ing.amount} {ing.unit} {ing.name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-3 space-y-2">
                    <h4 className="font-semibold text-slate-900 text-sm">Instructions:</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-line">{recipe.instructions}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {view === 'grocery' && (
        <>
          <div className="flex justify-end">
            <button
              onClick={() => setShowGroceryForm(true)}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors shadow-lg"
            >
              <Plus className="h-5 w-5" />
              New List
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">My Lists</h3>
              <div className="space-y-2">
                {groceryLists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => {
                      setSelectedGroceryList(list.id);
                      loadGroceryItems(list.id);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedGroceryList === list.id
                        ? 'bg-green-100 text-green-900 font-semibold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {list.list_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl shadow-lg p-6">
              {selectedGroceryList ? (
                <>
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Items</h3>

                  <form onSubmit={handleAddGroceryItem} className="mb-4 flex gap-2">
                    <input
                      type="text"
                      value={newGroceryItem.item_name}
                      onChange={(e) => setNewGroceryItem({ ...newGroceryItem, item_name: e.target.value })}
                      required
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-400"
                      placeholder="Item name"
                    />
                    <input
                      type="text"
                      value={newGroceryItem.amount}
                      onChange={(e) => setNewGroceryItem({ ...newGroceryItem, amount: e.target.value })}
                      className="w-24 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-400"
                      placeholder="Amount"
                    />
                    <button
                      type="submit"
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </form>

                  <div className="space-y-2">
                    {selectedGroceryItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                      >
                        <button
                          onClick={() => handleToggleGroceryItem(item.id, item.is_checked)}
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center ${
                            item.is_checked
                              ? 'bg-green-500 border-green-500'
                              : 'border-slate-300 hover:border-green-500'
                          }`}
                        >
                          {item.is_checked && <Check className="h-4 w-4 text-white" />}
                        </button>
                        <div className="flex-1">
                          <span
                            className={`font-medium ${
                              item.is_checked ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {item.item_name}
                          </span>
                          {item.amount && (
                            <span className="text-sm text-slate-500 ml-2">({item.amount})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">Select a list to view items</div>
              )}
            </div>
          </div>
        </>
      )}

      {showAIForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Generate AI Meal Plan</h2>
              <button onClick={() => setShowAIForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleGenerateMealPlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dietary Preferences</label>
                <input
                  type="text"
                  value={aiParams.dietaryPreferences}
                  onChange={(e) => setAiParams({ ...aiParams, dietaryPreferences: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g., Vegetarian, gluten-free"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Fitness Goals</label>
                <input
                  type="text"
                  value={aiParams.fitnessGoals}
                  onChange={(e) => setAiParams({ ...aiParams, fitnessGoals: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                  placeholder="e.g., Build muscle, lose weight"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Daily Calorie Target</label>
                <input
                  type="number"
                  value={aiParams.calorieTarget}
                  onChange={(e) => setAiParams({ ...aiParams, calorieTarget: parseInt(e.target.value) || 2000 })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Days to Plan</label>
                <input
                  type="number"
                  value={aiParams.daysCount}
                  onChange={(e) => setAiParams({ ...aiParams, daysCount: parseInt(e.target.value) || 3 })}
                  min="1"
                  max="7"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <button
                type="submit"
                disabled={generatingPlan}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 font-medium transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPlan ? 'Generating...' : 'Generate Plan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showRecipeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-4 border-b">
              <h2 className="text-2xl font-bold text-slate-900">New Recipe</h2>
              <button onClick={() => setShowRecipeForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipe} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Recipe Name</label>
                <input
                  type="text"
                  value={newRecipe.recipe_name}
                  onChange={(e) => setNewRecipe({ ...newRecipe, recipe_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={newRecipe.description}
                  onChange={(e) => setNewRecipe({ ...newRecipe, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  rows={2}
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-slate-900">Add Ingredient</h3>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={currentIngredient.name}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={currentIngredient.amount}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, amount: e.target.value })}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                    placeholder="Amount"
                  />
                  <input
                    type="text"
                    value={currentIngredient.unit}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                    placeholder="Unit"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="w-full bg-orange-100 text-orange-700 py-2 rounded-lg hover:bg-orange-200 font-medium transition-colors"
                >
                  Add Ingredient
                </button>
              </div>

              {newRecipe.ingredients.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-slate-900">Ingredients</h3>
                  {newRecipe.ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm text-slate-700">
                        {ing.amount} {ing.unit} {ing.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Instructions</label>
                <textarea
                  value={newRecipe.instructions}
                  onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  rows={4}
                  placeholder="Step by step instructions..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    value={newRecipe.prep_time_minutes || ''}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, prep_time_minutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cook Time (min)</label>
                  <input
                    type="number"
                    value={newRecipe.cook_time_minutes || ''}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, cook_time_minutes: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Servings</label>
                  <input
                    type="number"
                    value={newRecipe.servings}
                    onChange={(e) => setNewRecipe({ ...newRecipe, servings: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={newRecipe.category}
                    onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="dessert">Dessert</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Calories</label>
                  <input
                    type="number"
                    value={newRecipe.calories || ''}
                    onChange={(e) => setNewRecipe({ ...newRecipe, calories: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Protein (g)</label>
                  <input
                    type="number"
                    value={newRecipe.protein || ''}
                    onChange={(e) => setNewRecipe({ ...newRecipe, protein: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Carbs (g)</label>
                  <input
                    type="number"
                    value={newRecipe.carbs || ''}
                    onChange={(e) => setNewRecipe({ ...newRecipe, carbs: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fats (g)</label>
                  <input
                    type="number"
                    value={newRecipe.fats || ''}
                    onChange={(e) => setNewRecipe({ ...newRecipe, fats: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div className="flex gap-3 sticky bottom-0 bg-white pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowRecipeForm(false)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 font-medium transition-colors shadow-lg"
                >
                  Save Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMealPlanForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Add Meal</h2>
              <button onClick={() => setShowMealPlanForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSaveMealPlan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newMealPlan.plan_date}
                  onChange={(e) => setNewMealPlan({ ...newMealPlan, plan_date: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Meal Type</label>
                <select
                  value={newMealPlan.meal_type}
                  onChange={(e) =>
                    setNewMealPlan({
                      ...newMealPlan,
                      meal_type: e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack',
                    })
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Recipe (Optional)</label>
                <select
                  value={newMealPlan.recipe_id}
                  onChange={(e) => setNewMealPlan({ ...newMealPlan, recipe_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">-- No Recipe --</option>
                  {recipes.map((recipe) => (
                    <option key={recipe.id} value={recipe.id}>
                      {recipe.recipe_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Or Enter Custom Meal Name
                </label>
                <input
                  type="text"
                  value={newMealPlan.custom_meal_name}
                  onChange={(e) => setNewMealPlan({ ...newMealPlan, custom_meal_name: e.target.value })}
                  disabled={!!newMealPlan.recipe_id}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400 disabled:bg-slate-100"
                  placeholder="e.g., Leftovers, Eating out"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  value={newMealPlan.notes}
                  onChange={(e) => setNewMealPlan({ ...newMealPlan, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-400"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 font-medium transition-colors shadow-lg"
              >
                Add Meal
              </button>
            </form>
          </div>
        </div>
      )}

      {showGroceryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">New Grocery List</h2>
              <button onClick={() => setShowGroceryForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateGroceryList} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">List Name</label>
                <input
                  type="text"
                  value={newGroceryList.list_name}
                  onChange={(e) => setNewGroceryList({ list_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-400"
                  placeholder="e.g., Weekly Shopping"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 font-medium transition-colors shadow-lg"
              >
                Create List
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
