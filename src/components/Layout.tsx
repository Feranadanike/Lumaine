import { ReactNode, useState } from 'react';
import {
  Home,
  Droplet,
  Dumbbell,
  PiggyBank,
  CreditCard,
  RefreshCw,
  BookOpen,
  Calendar,
  CalendarDays,
  Heart,
  BarChart3,
  Menu,
  X,
  LogOut,
  Target,
  User,
  Bot,
  Smile,
  Bookmark,
  Film,
  Trophy,
  TrendingUp,
  FileText,
  ChefHat,
  Wallet,
  Camera,
  Book,
  Users,
  ChevronDown,
  ChevronRight,
  Search,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import CalendarWidget from './CalendarWidget';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string, date?: string) => void;
  onSearchOpen: () => void;
}

const navigationCategories = [
  {
    name: 'Overview',
    items: [
      { id: 'insights', name: 'Insights', icon: BarChart3 },
      { id: 'analytics', name: 'Analytics', icon: TrendingUp },
      { id: 'goals', name: 'Goals', icon: Target },
      { id: 'achievements', name: 'Achievements', icon: Trophy },
    ]
  },
  {
    name: 'Health & Wellness',
    items: [
      { id: 'skincare', name: 'Skincare', icon: Droplet },
      { id: 'gym', name: 'Gym', icon: Dumbbell },
      { id: 'mealprep', name: 'Meal Prep', icon: ChefHat },
      { id: 'wellness', name: 'Wellness', icon: Heart },
    ]
  },
  {
    name: 'Productivity',
    items: [
      { id: 'planner', name: 'Planner', icon: Calendar },
      { id: 'journal', name: 'Journal', icon: BookOpen },
      { id: 'mooddiary', name: 'Mood Diary', icon: Heart },
      { id: 'notes', name: 'Quick Notes', icon: FileText },
      { id: 'wallet', name: 'Wallet', icon: Wallet },
      { id: 'hobbies', name: 'Hobbies', icon: Smile },
      { id: 'links', name: 'Saved Links', icon: Bookmark },
      { id: 'entertainment', name: 'Entertainment', icon: Film },
    ]
  },
  {
    name: 'Personal',
    items: [
      { id: 'memories', name: 'Memories', icon: Camera },
      { id: 'books', name: 'Reading List', icon: Book },
      { id: 'relationships', name: 'Relationships', icon: Users },
    ]
  },
  {
    name: 'Finance',
    items: [
      { id: 'savings', name: 'Savings', icon: PiggyBank },
      { id: 'bills', name: 'Bills', icon: CreditCard },
      { id: 'subscriptions', name: 'Subscriptions', icon: RefreshCw },
    ]
  },
  {
    name: 'AI & Profile',
    items: [
      { id: 'coach', name: 'LumiBud Coach', icon: Bot },
      { id: 'profile', name: 'Profile', icon: User },
    ]
  },
];

export default function Layout({ children, currentView, onViewChange, onSearchOpen }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Overview', 'Health & Wellness', 'Productivity', 'Personal', 'Finance', 'AI & Profile']));
  const { signOut } = useAuth();
  const { accentColor, darkMode, toggleDarkMode } = useTheme();

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
      }
      return next;
    });
  };

  const getColorClasses = (type: 'bg' | 'text' | 'hover' | 'gradient' | 'light' | 'border') => {
    const colorMap: Record<string, Record<string, string>> = {
      rose: { bg: 'bg-rose-400', text: 'text-rose-600', hover: 'hover:bg-rose-50', gradient: 'from-rose-400 to-pink-400', light: 'from-rose-50 to-pink-50', border: 'border-rose-200' },
      pink: { bg: 'bg-pink-400', text: 'text-pink-600', hover: 'hover:bg-pink-50', gradient: 'from-pink-400 to-pink-500', light: 'from-pink-50 to-pink-100', border: 'border-pink-200' },
      purple: { bg: 'bg-purple-400', text: 'text-purple-600', hover: 'hover:bg-purple-50', gradient: 'from-purple-400 to-purple-500', light: 'from-purple-50 to-purple-100', border: 'border-purple-200' },
      blue: { bg: 'bg-blue-400', text: 'text-blue-600', hover: 'hover:bg-blue-50', gradient: 'from-blue-400 to-blue-500', light: 'from-blue-50 to-blue-100', border: 'border-blue-200' },
      cyan: { bg: 'bg-cyan-400', text: 'text-cyan-600', hover: 'hover:bg-cyan-50', gradient: 'from-cyan-400 to-cyan-500', light: 'from-cyan-50 to-cyan-100', border: 'border-cyan-200' },
      teal: { bg: 'bg-teal-400', text: 'text-teal-600', hover: 'hover:bg-teal-50', gradient: 'from-teal-400 to-teal-500', light: 'from-teal-50 to-teal-100', border: 'border-teal-200' },
      green: { bg: 'bg-green-400', text: 'text-green-600', hover: 'hover:bg-green-50', gradient: 'from-green-400 to-green-500', light: 'from-green-50 to-green-100', border: 'border-green-200' },
      amber: { bg: 'bg-amber-400', text: 'text-amber-600', hover: 'hover:bg-amber-50', gradient: 'from-amber-400 to-amber-500', light: 'from-amber-50 to-amber-100', border: 'border-amber-200' },
      emerald: { bg: 'bg-emerald-400', text: 'text-emerald-600', hover: 'hover:bg-emerald-50', gradient: 'from-emerald-400 to-emerald-500', light: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200' },
      indigo: { bg: 'bg-indigo-400', text: 'text-indigo-600', hover: 'hover:bg-indigo-50', gradient: 'from-indigo-400 to-indigo-500', light: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200' },
    };
    return colorMap[accentColor]?.[type] || colorMap.rose[type];
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleDateAction = (action: string, date: string) => {
    onViewChange(action, date);
  };

  return (
    <div className={`h-screen overflow-hidden bg-gradient-to-br ${getColorClasses('light')} via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900`}>
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50 shadow-sm lg:hidden">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className={`h-8 w-8 ${getColorClasses('text')}`} />
              <span className="ml-2 text-xl font-bold text-slate-900 dark:text-white">LumiBud</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2"
              >
                {darkMode ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
              </button>
              <button
                onClick={onSearchOpen}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2"
              >
                <Search className="h-6 w-6" />
              </button>
              <CalendarWidget onDateAction={handleDateAction} />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
            <div className="px-4 pt-4 pb-3 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <button
                onClick={() => {
                  onViewChange('home');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                  currentView === 'home'
                    ? `bg-gradient-to-r ${getColorClasses('gradient')} text-white shadow-md`
                    : `bg-gradient-to-r ${getColorClasses('light')} ${getColorClasses('text')} ${getColorClasses('hover')}`
                }`}
              >
                <Home className="h-6 w-6 mr-3" />
                Home
              </button>
              {navigationCategories.map((category) => {
                const isExpanded = expandedSections.has(category.name);
                return (
                  <div key={category.name}>
                    <button
                      onClick={() => toggleSection(category.name)}
                      className="w-full flex items-center justify-between px-2 py-2 rounded-lg text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 uppercase tracking-wider"
                    >
                      <span>{category.name}</span>
                      {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="space-y-1 pl-2">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = currentView === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                onViewChange(item.id);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 ${
                                isActive
                                  ? `${getColorClasses('bg')} text-white shadow-md`
                                  : `text-slate-600 dark:text-slate-300 ${getColorClasses('hover')} dark:hover:bg-slate-800`
                              }`}
                            >
                              <Icon className="h-6 w-6 mr-3" />
                              {item.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-base font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                >
                  <LogOut className="h-6 w-6 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="flex h-full">
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center">
              <Heart className={`h-8 w-8 ${getColorClasses('text')}`} />
              <span className="ml-2 text-xl font-bold text-slate-900 dark:text-white">LumiBud</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <div className="overflow-y-auto overflow-x-hidden py-4 px-4" style={{ height: 'calc(100vh - 64px - 88px)' }}>
            <button
              onClick={() => onViewChange('home')}
              className={`w-full flex items-center px-6 py-5 rounded-2xl text-xl font-bold transition-all duration-200 mb-4 ${
                currentView === 'home'
                  ? `bg-gradient-to-r ${getColorClasses('gradient')} text-white shadow-xl`
                  : `bg-gradient-to-r ${getColorClasses('light')} ${getColorClasses('text')} ${getColorClasses('hover')} shadow-md`
              }`}
            >
              <Home className="h-9 w-9 mr-4" />
              Home
            </button>

            <button
              onClick={onSearchOpen}
              className={`w-full flex items-center px-6 py-4 rounded-2xl text-lg font-bold transition-all duration-200 mb-8 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-md group`}
            >
              <Search className="h-7 w-7 mr-4 group-hover:scale-110 transition-transform" />
              <span className="flex-1 text-left">Search</span>
              <span className="text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 dark:text-slate-300">⌘K</span>
            </button>
            <div className="space-y-3">
            {navigationCategories.map((category) => {
              const isExpanded = expandedSections.has(category.name);
              return (
                <div key={category.name}>
                  <button
                    onClick={() => toggleSection(category.name)}
                    className="w-full flex items-center justify-between px-4 py-4 rounded-xl text-base font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 uppercase tracking-wide"
                  >
                    <span>{category.name}</span>
                    {isExpanded ? <ChevronDown className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                  </button>
                  {isExpanded && (
                    <div className="mt-2 mb-3">
                    <div className="space-y-2 pl-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`w-full flex items-center px-5 py-4 rounded-xl text-lg font-bold transition-all duration-200 ${
                              isActive
                                ? `${getColorClasses('bg')} text-white shadow-lg`
                                : `text-slate-700 dark:text-slate-300 ${getColorClasses('hover')} dark:hover:bg-slate-800`
                            }`}
                          >
                            <Icon className="h-8 w-8 mr-4" />
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>

          <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-5 py-4 rounded-xl text-lg font-bold text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <LogOut className="h-8 w-8 mr-4" />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 lg:pl-64 h-full overflow-y-auto">
          <div className="min-h-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="hidden lg:flex justify-between items-center mb-4">
                <button
                  onClick={onSearchOpen}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors shadow-sm"
                >
                  <Search className="h-5 w-5" />
                  <span className="font-medium">Search</span>
                  <span className="text-xs bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-300 dark:border-slate-600">⌘K</span>
                </button>
                <CalendarWidget onDateAction={handleDateAction} />
              </div>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
