import './App.css';
import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Inventory } from '@/components/Inventory';
import { Purchases } from '@/components/Purchases';
import { Locations } from '@/components/Locations';
import { LocationHistory } from '@/components/LocationHistory';
import { Reports } from '@/components/Reports';
import { Settings } from '@/components/Settings';

// Navigation items
const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'inventory', label: 'Inventaris', icon: '📦' },
  { id: 'purchases', label: 'Pembelian', icon: '🛒' },
  { id: 'locations', label: 'Lokasi', icon: '📍' },
  { id: 'location-history', label: 'Riwayat Lokasi', icon: '📋' },
  { id: 'reports', label: 'Laporan', icon: '📊' },
  { id: 'settings', label: 'Pengaturan', icon: '⚙️' },
];

function App() {
  const [activeView, setActiveView] = useState<string>('dashboard');

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

  return (
    <div className="app-container">
      <div className="titlebar">
        <div className="titlebar-text">📟 IT Inventory Management System</div>
        <div className="titlebar-buttons">
          <button className="titlebar-button">_</button>
          <button className="titlebar-button">□</button>
          <button className="titlebar-button">×</button>
        </div>
      </div>
      
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

export default App;