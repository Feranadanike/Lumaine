import { ReactNode, useState } from 'react';
import {
  Home,
  Droplet,
  Dumbbell,
  PiggyBank,
  BookOpen,
  Calendar,
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
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
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
      { id: 'wellness', name: 'Wellness', icon: Heart },
    ]
  },
  {
    name: 'Productivity',
    items: [
      { id: 'planner', name: 'Planner', icon: Calendar },
      { id: 'journal', name: 'Journal', icon: BookOpen },
      { id: 'notes', name: 'Quick Notes', icon: FileText },
      { id: 'hobbies', name: 'Hobbies', icon: Smile },
      { id: 'links', name: 'Saved Links', icon: Bookmark },
      { id: 'entertainment', name: 'Entertainment', icon: Film },
    ]
  },
  {
    name: 'Finance & AI',
    items: [
      { id: 'savings', name: 'Savings', icon: PiggyBank },
      { id: 'coach', name: 'Lumaine Coach', icon: Bot },
      { id: 'profile', name: 'Profile', icon: User },
    ]
  },
];

export default function Layout({ children, currentView, onViewChange }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useAuth();
  const { accentColor } = useTheme();

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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getColorClasses('light')} via-white to-slate-50`}>
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm lg:hidden">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Heart className={`h-8 w-8 ${getColorClasses('text')}`} />
              <span className="ml-2 text-xl font-bold text-slate-900">Lumaine</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white shadow-lg">
            <div className="px-4 pt-4 pb-3 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
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
              {navigationCategories.map((category) => (
                <div key={category.name}>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {category.name}
                  </h3>
                  <div className="space-y-1">
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
                              : `text-slate-600 ${getColorClasses('hover')} ${getColorClasses('text')}`
                          }`}
                        >
                          <Icon className="h-6 w-6 mr-3" />
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-base font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                >
                  <LogOut className="h-6 w-6 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="flex">
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 shadow-sm">
          <div className="flex items-center h-16 px-6 border-b border-slate-200">
            <Heart className={`h-8 w-8 ${getColorClasses('text')}`} />
            <span className="ml-2 text-xl font-bold text-slate-900">Lumaine</span>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <button
              onClick={() => onViewChange('home')}
              className={`w-full flex items-center px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 mb-6 ${
                currentView === 'home'
                  ? `bg-gradient-to-r ${getColorClasses('gradient')} text-white shadow-lg`
                  : `bg-gradient-to-r ${getColorClasses('light')} ${getColorClasses('text')} ${getColorClasses('hover')} shadow-sm`
              }`}
            >
              <Home className="h-6 w-6 mr-3" />
              Home
            </button>
            <div className="space-y-6">
            {navigationCategories.map((category) => (
              <div key={category.name}>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                  {category.name}
                </h3>
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? `${getColorClasses('bg')} text-white shadow-md`
                            : `text-slate-600 ${getColorClasses('hover')} ${getColorClasses('text')}`
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            </div>
          </div>

          <div className="p-4 border-t border-slate-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </div>
        </aside>

        <main className="flex-1 lg:pl-64">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
