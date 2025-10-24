import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
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

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('home');

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
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {currentView === 'home' && <Home onViewChange={setCurrentView} />}
      {currentView === 'profile' && <Profile />}
      {currentView === 'coach' && <AICoach />}
      {currentView === 'goals' && <Goals />}
      {currentView === 'skincare' && <Skincare />}
      {currentView === 'gym' && <Gym />}
      {currentView === 'savings' && <Finance defaultTab="savings" />}
      {currentView === 'bills' && <Finance defaultTab="bills" />}
      {currentView === 'subscriptions' && <Finance defaultTab="subscriptions" />}
      {currentView === 'journal' && <Journal />}
      {currentView === 'wellness' && <Wellness />}
      {currentView === 'planner' && <Planner />}
      {currentView === 'hobbies' && <Hobbies />}
      {currentView === 'insights' && <Insights />}
      {currentView === 'links' && <SavedLinks />}
      {currentView === 'entertainment' && <Entertainment />}
      {currentView === 'achievements' && <Achievements />}
      {currentView === 'analytics' && <Analytics />}
      {currentView === 'notes' && <Notes />}
    </Layout>
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
