import { useState, useEffect } from 'react';
import Login from './components/Login';
import MainLayout from './components/MainLayout';
import type { AppModule } from './types';
import { AuthContext, type CurrentUser } from './lib/auth';

function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeModule, setActiveModule] = useState<AppModule>('analises');

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch { localStorage.removeItem('currentUser'); }
    }
  }, []);

  const handleLogin = (user: CurrentUser) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AuthContext.Provider value={currentUser}>
      <MainLayout
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onLogout={handleLogout}
      />
    </AuthContext.Provider>
  );
}

export default App;
