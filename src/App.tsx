import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import GlobalSearch from './components/GlobalSearch';
import Home from './components/Home';
import Profile from './components/Profile';
import AICoach from './components/AICoach';
import Goals from './components/Goals';
import Skincare from './components/Skincare';
import Gym from './components/Gym';
import Finance from './components/Finance';
import Journal from './components/Journal';
import Wellness from './components/Wellness';
import Planner from './components/Planner';
import Hobbies from './components/Hobbies';
import Insights from './components/Insights';
import SavedLinks from './components/SavedLinks';
import Entertainment from './components/Entertainment';
import Achievements from './components/Achievements';
import Analytics from './components/Analytics';
import Notes from './components/Notes';
import MealPrep from './components/MealPrep';
import MoodDiary from './components/MoodDiary';
import Wallet from './components/Wallet';
import Memories from './components/Memories';
import Books from './components/Books';
import Relationships from './components/Relationships';
import Routines from './components/Routines';
import SmartInsights from './components/SmartInsights';
import StudySpace from './components/StudySpace';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleViewChange = (view: string, date?: string) => {
    setCurrentView(view);
    setSelectedDate(date);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  console.log('AppContent render - loading:', loading, 'user:', !!user);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-slate-600 text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <>
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleViewChange}
      />
      <Layout
        currentView={currentView}
        onViewChange={handleViewChange}
        onSearchOpen={() => setSearchOpen(true)}
      >
      {currentView === 'home' && <Home onViewChange={(view) => handleViewChange(view)} />}
      {currentView === 'routines' && <Routines />}
      {currentView === 'profile' && <Profile />}
      {currentView === 'coach' && <AICoach />}
      {currentView === 'goals' && <Goals initialDate={selectedDate} />}
      {currentView === 'skincare' && <Skincare initialDate={selectedDate} />}
      {currentView === 'gym' && <Gym initialDate={selectedDate} />}
      {currentView === 'mealprep' && <MealPrep initialDate={selectedDate} />}
      {currentView === 'savings' && <Finance defaultTab="savings" />}
      {currentView === 'bills' && <Finance defaultTab="bills" />}
      {currentView === 'subscriptions' && <Finance defaultTab="subscriptions" />}
      {currentView === 'journal' && <Journal initialDate={selectedDate} />}
      {currentView === 'wellness' && <Wellness />}
      {currentView === 'planner' && <Planner initialDate={selectedDate} />}
      {currentView === 'hobbies' && <Hobbies />}
      {currentView === 'insights' && <Insights />}
      {currentView === 'links' && <SavedLinks />}
      {currentView === 'entertainment' && <Entertainment />}
      {currentView === 'achievements' && <Achievements />}
      {currentView === 'analytics' && <Analytics />}
      {currentView === 'notes' && <Notes />}
      {currentView === 'mooddiary' && <MoodDiary initialDate={selectedDate} />}
      {currentView === 'wallet' && <Wallet />}
      {currentView === 'memories' && <Memories />}
      {currentView === 'books' && <Books />}
      {currentView === 'relationships' && <Relationships />}
      {currentView === 'smartinsights' && <SmartInsights />}
      {currentView === 'studyspace' && <StudySpace />}
      </Layout>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
