import { useState } from 'react';
import type { AppModule } from '../types';
import ModuleSidebar from './ModuleSidebar';
import AnalisesModule from './modules/AnalisesModule';
import CsIxcModule from './modules/CsIxcModule';
import CsOpaModule from './modules/CsOpaModule';
import ComingSoon from './ComingSoon';

interface MainLayoutProps {
  activeModule: AppModule;
  onModuleChange: (module: AppModule) => void;
  onLogout: () => void;
}

export default function MainLayout({ activeModule, onModuleChange, onLogout }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'analises':
        return <AnalisesModule sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />;
      case 'cs-ixc':
        return <CsIxcModule sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />;
      case 'cs-opa':
        return <CsOpaModule sidebarOpen={sidebarOpen} onSidebarToggle={() => setSidebarOpen(!sidebarOpen)} />;
      case 'erro-rede':
        return <ComingSoon title="Erro na Rede" description="Monitor de clientes com problemas de rede + disparo de notificações" color="red" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 flex">
      <ModuleSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeModule={activeModule}
        onModuleChange={(mod) => {
          onModuleChange(mod);
          setSidebarOpen(false);
        }}
        onLogout={onLogout}
      />
      <div className="flex-1 lg:ml-72 min-h-screen">
        {renderModule()}
      </div>
    </div>
  );
}