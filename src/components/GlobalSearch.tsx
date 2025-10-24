import { useState, useEffect, useCallback } from 'react';
import {
  Search, X, Calendar, Target, Heart, Book, FileText, DollarSign,
  Dumbbell, Film, Bookmark, ChefHat, Users, Home, Droplet, PiggyBank,
  CreditCard, RefreshCw, BookOpen, Smile, BarChart3, Trophy, TrendingUp,
  Bot, User as UserIcon, Camera, Wallet
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const navigationItems = [
  { id: 'home', name: 'Home', icon: Home },
  { id: 'insights', name: 'Insights', icon: BarChart3 },
  { id: 'analytics', name: 'Analytics', icon: TrendingUp },
  { id: 'goals', name: 'Goals', icon: Target },
  { id: 'achievements', name: 'Achievements', icon: Trophy },
  { id: 'skincare', name: 'Skincare', icon: Droplet },
  { id: 'gym', name: 'Gym', icon: Dumbbell },
  { id: 'mealprep', name: 'Meal Prep', icon: ChefHat },
  { id: 'wellness', name: 'Wellness', icon: Heart },
  { id: 'planner', name: 'Planner', icon: Calendar },
  { id: 'journal', name: 'Journal', icon: BookOpen },
  { id: 'mooddiary', name: 'Mood Diary', icon: Heart },
  { id: 'notes', name: 'Quick Notes', icon: FileText },
  { id: 'wallet', name: 'Wallet', icon: Wallet },
  { id: 'hobbies', name: 'Hobbies', icon: Smile },
  { id: 'links', name: 'Saved Links', icon: Bookmark },
  { id: 'entertainment', name: 'Entertainment', icon: Film },
  { id: 'memories', name: 'Memories', icon: Camera },
  { id: 'books', name: 'Reading List', icon: Book },
  { id: 'relationships', name: 'Relationships', icon: Users },
  { id: 'savings', name: 'Savings', icon: PiggyBank },
  { id: 'bills', name: 'Bills', icon: CreditCard },
  { id: 'subscriptions', name: 'Subscriptions', icon: RefreshCw },
  { id: 'coach', name: 'LumiBud Coach', icon: Bot },
  { id: 'profile', name: 'Profile', icon: UserIcon },
];

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description?: string;
  date?: string;
  icon: React.ElementType;
  view: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, date?: string) => void;
}

export default function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchAllData = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const allResults: SearchResult[] = [];
    const lowerQuery = searchQuery.toLowerCase();

    navigationItems.forEach(item => {
      if (item.name.toLowerCase().includes(lowerQuery)) {
        allResults.push({
          id: item.id,
          type: 'Page',
          title: item.name,
          description: 'Navigate to this page',
          icon: item.icon,
          view: item.id,
        });
      }
    });

    if (!user) {
      setResults(allResults);
      setLoading(false);
      return;
    }

    try {
      const searches = [
        supabase.from('journal_entries').select('*').eq('user_id', user.id).or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`).limit(5),
        supabase.from('goals').select('*').eq('user_id', user.id).or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`).limit(5),
        supabase.from('daily_planner').select('*').eq('user_id', user.id).limit(10),
        supabase.from('hobbies').select('*').eq('user_id', user.id).ilike('hobby_name', `%${searchQuery}%`).limit(5),
        supabase.from('entertainment_items').select('*').eq('user_id', user.id).or(`title.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`).limit(5),
        supabase.from('saved_links').select('*').eq('user_id', user.id).or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`).limit(5),
        supabase.from('recipes').select('*').eq('user_id', user.id).or(`recipe_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`).limit(5),
        supabase.from('workout_sessions').select('*').eq('user_id', user.id).ilike('workout_name', `%${searchQuery}%`).limit(5),
        supabase.from('books').select('*').eq('user_id', user.id).or(`title.ilike.%${searchQuery}%,author.ilike.%${searchQuery}%`).limit(5),
        supabase.from('social_relationships').select('*').eq('user_id', user.id).ilike('person_name', `%${searchQuery}%`).limit(5),
        supabase.from('savings_goals').select('*').eq('user_id', user.id).ilike('goal_name', `%${searchQuery}%`).limit(5),
        supabase.from('bills').select('*').eq('user_id', user.id).ilike('bill_name', `%${searchQuery}%`).limit(5),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).ilike('service_name', `%${searchQuery}%`).limit(5),
      ];

      const [
        journals,
        goals,
        plans,
        hobbies,
        entertainment,
        savedLinks,
        recipes,
        workouts,
        books,
        relationships,
        savings,
        bills,
        subscriptions
      ] = await Promise.all(searches);

      if (journals.data) {
        journals.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Journal',
            title: item.title || 'Untitled Entry',
            description: item.content?.substring(0, 100),
            date: item.entry_date,
            icon: Book,
            view: 'journal',
          });
        });
      }

      if (goals.data) {
        goals.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Goal',
            title: item.title,
            description: item.description,
            date: item.target_date,
            icon: Target,
            view: 'goals',
          });
        });
      }

      if (plans.data) {
        plans.data.forEach((item: any) => {
          const tasksText = JSON.stringify(item.tasks || []).toLowerCase();
          if (tasksText.includes(searchQuery.toLowerCase())) {
            allResults.push({
              id: item.id,
              type: 'Plan',
              title: `Plan for ${new Date(item.plan_date).toLocaleDateString()}`,
              date: item.plan_date,
              icon: Calendar,
              view: 'planner',
            });
          }
        });
      }

      if (hobbies.data) {
        hobbies.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Hobby',
            title: item.hobby_name,
            description: item.hobby_type,
            icon: Heart,
            view: 'hobbies',
          });
        });
      }

      if (entertainment.data) {
        entertainment.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.notes,
            icon: Film,
            view: 'entertainment',
          });
        });
      }

      if (savedLinks.data) {
        savedLinks.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Link',
            title: item.title || item.url,
            description: item.description,
            icon: Bookmark,
            view: 'links',
          });
        });
      }

      if (recipes.data) {
        recipes.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Recipe',
            title: item.recipe_name,
            description: item.description,
            icon: ChefHat,
            view: 'mealprep',
          });
        });
      }

      if (workouts.data) {
        workouts.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Workout',
            title: item.workout_name,
            date: item.workout_date,
            icon: Dumbbell,
            view: 'gym',
          });
        });
      }

      if (books.data) {
        books.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Book',
            title: item.title,
            description: item.author,
            icon: Book,
            view: 'books',
          });
        });
      }

      if (relationships.data) {
        relationships.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Relationship',
            title: item.person_name,
            description: item.relationship_type,
            icon: Users,
            view: 'relationships',
          });
        });
      }

      if (savings.data) {
        savings.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Savings Goal',
            title: item.goal_name,
            description: `$${item.current_amount} / $${item.target_amount}`,
            icon: DollarSign,
            view: 'savings',
          });
        });
      }

      if (bills.data) {
        bills.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Bill',
            title: item.bill_name,
            description: `$${item.amount} - Due day ${item.due_day}`,
            icon: DollarSign,
            view: 'bills',
          });
        });
      }

      if (subscriptions.data) {
        subscriptions.data.forEach((item: any) => {
          allResults.push({
            id: item.id,
            type: 'Subscription',
            title: item.service_name,
            description: `$${item.amount} - ${item.billing_cycle}`,
            icon: DollarSign,
            view: 'subscriptions',
          });
        });
      }

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query) {
        searchAllData(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, searchAllData]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleResultClick = (result: SearchResult) => {
    onNavigate(result.view, result.date);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search pages, journals, goals, workouts, recipes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder-slate-400"
            autoFocus
          />
          {loading && (
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && query && !loading && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              No results found
            </div>
          )}
          {results.length === 0 && !query && (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              Start typing to search...
            </div>
          )}
          {results.map((result, index) => {
            const Icon = result.icon;
            return (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className={`w-full flex items-start gap-4 p-4 text-left transition-colors ${
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-slate-700'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                      {result.type}
                    </span>
                    {result.date && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {new Date(result.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white mb-1 truncate">
                    {result.title}
                  </div>
                  {result.description && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {result.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs">↑↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs">Enter</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs">Esc</kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
