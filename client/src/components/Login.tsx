import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

export function Login() {
  const { login, isLoading } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    const success = await login(username, password);
    if (!success) {
      setError(t('auth.invalidCredentials'));
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-window">
          <div className="titlebar">
            <div className="titlebar-text">🔐 {t('auth.login')} - {t('app.title')}</div>
            <div className="titlebar-buttons">
              <button className="titlebar-button">_</button>
              <button className="titlebar-button">□</button>
              <button className="titlebar-button">×</button>
            </div>
          </div>
          
          <div className="login-content">
            <Card className="w-full max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">🏢 Totalindo</CardTitle>
                <CardDescription>
                  {t('app.title')}
                  <br />
                  Please log in to continue
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('auth.username')}</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                      placeholder={`Enter your ${t('auth.username').toLowerCase()}`}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      placeholder={`Enter your ${t('auth.password').toLowerCase()}`}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {error && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-800">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? `${t('auth.login')}...` : t('auth.loginButton')}
                  </Button>
                </form>


              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}