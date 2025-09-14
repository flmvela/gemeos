import React, { useState } from 'react';
import { SelfContainedLayout } from './components/SelfContainedLayout';
import { WelcomePage } from './components/WelcomePage';

type CurrentView = 'welcome' | 'dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<CurrentView>('dashboard');

  const navigateToWelcome = () => setCurrentView('welcome');
  const navigateToDashboard = () => setCurrentView('dashboard');

  if (currentView === 'welcome') {
    return <WelcomePage onNavigateToDashboard={navigateToDashboard} />;
  }

  return <SelfContainedLayout onNavigateToWelcome={navigateToWelcome} />;
}