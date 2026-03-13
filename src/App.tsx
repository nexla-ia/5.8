import { useState, useEffect } from 'react';
import Login from './components/Login';
import MainLayout from './components/MainLayout';
import type { AppModule } from './types';

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeModule, setActiveModule] = useState<AppModule>('analises');

  useEffect(() => {
    const isAuth = localStorage.getItem('authenticated') === 'true';
    setAuthenticated(isAuth);
  }, []);

  const handleLogin = () => setAuthenticated(true);

  const handleLogout = () => {
    localStorage.removeItem('authenticated');
    setAuthenticated(false);
  };

  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <MainLayout
      activeModule={activeModule}
      onModuleChange={setActiveModule}
      onLogout={handleLogout}
    />
  );
}

export default App;