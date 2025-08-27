import { Button } from '@/components/ui/button';
import { useAuth } from './AuthContext';

export function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  return (
    <div className="titlebar">
      <div className="titlebar-text">📟 IT Inventory Management System</div>
      <div className="titlebar-info">
        {user && (
          <span className="user-info">
            👤 {user.username} ({user.role === 'admin' ? '👑 Admin' : '👤 User'})
          </span>
        )}
      </div>
      <div className="titlebar-buttons">
        {user && (
          <button 
            className="titlebar-button logout-button" 
            onClick={handleLogout}
            title="Logout"
          >
            🚪
          </button>
        )}
        <button className="titlebar-button">_</button>
        <button className="titlebar-button">□</button>
        <button className="titlebar-button">×</button>
      </div>
    </div>
  );
}