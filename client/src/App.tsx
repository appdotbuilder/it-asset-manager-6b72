import './App.css';
import { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { LanguageProvider, useLanguage } from '@/components/LanguageContext';
import { Login } from '@/components/Login';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Inventory } from '@/components/Inventory';
import { Purchases } from '@/components/Purchases';
import { Locations } from '@/components/Locations';
import { LocationHistory } from '@/components/LocationHistory';
import { Reports } from '@/components/Reports';
import { Settings } from '@/components/Settings';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<string>('dashboard');

  // Navigation items with translations
  const navigationItems = [
    { id: 'dashboard', label: t('navigation.dashboard'), icon: '🏠' },
    { id: 'inventory', label: t('navigation.inventory'), icon: '📦' },
    { id: 'purchases', label: t('navigation.purchases'), icon: '🛒' },
    { id: 'locations', label: t('navigation.locations'), icon: '📍' },
    { id: 'location-history', label: t('navigation.locationHistory'), icon: '📋' },
    { id: 'reports', label: t('navigation.reports'), icon: '📊' },
    { id: 'settings', label: t('navigation.settings'), icon: '⚙️' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'purchases':
        return <Purchases />;
      case 'locations':
        return <Locations />;
      case 'location-history':
        return <LocationHistory />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="titlebar">
          <div className="titlebar-text">📟 {t('app.title')}</div>
        </div>
        <div className="loading-screen">
          <div className="loading-content">
            <div>🔄 {t('app.loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Header />
      
      <div className="app-content">
        <Sidebar
          items={navigationItems}
          activeItem={activeView}
          onItemClick={setActiveView}
        />
        
        <main className="main-content">
          <div className="content-window">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;