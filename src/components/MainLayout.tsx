import { useState } from 'react';
import type { AppModule } from '../types';
import ModuleSidebar from './ModuleSidebar';
import AnalisesModule from './modules/AnalisesModule';
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
        return <ComingSoon title="CS IXC" description="Dashboard de atendimento ao cliente via sistema IXC" color="purple" />;
      case 'cs-opa':
        return <ComingSoon title="CS OPA" description="Dashboard de atendimento ao cliente via sistema OPA" color="green" />;
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