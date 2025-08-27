import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

export function Header() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleLogout = async () => {
    if (confirm(t('auth.logoutConfirm'))) {
      await logout();
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as 'en' | 'id');
  };

  return (
    <div className="titlebar">
      <div className="titlebar-text">📟 {t('app.title')}</div>
      <div className="titlebar-info">
        <div className="language-selector">
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32 h-6 text-xs bg-gray-200 border border-gray-400 text-black">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="id">🇮🇩 Indonesia (ID)</SelectItem>
              <SelectItem value="en">🇬🇧 English (EN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {user && (
          <span className="user-info ml-2">
            👤 {user.username} ({user.role === 'admin' ? `👑 ${t('auth.admin')}` : `👤 ${t('auth.user')}`})
          </span>
        )}
      </div>
      <div className="titlebar-buttons">
        {user && (
          <button 
            className="titlebar-button logout-button" 
            onClick={handleLogout}
            title={t('auth.logout')}
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