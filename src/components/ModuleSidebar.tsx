import { X, Menu, LogOut, Bot, MessageSquare, Phone, Wifi, Zap } from 'lucide-react';
import type { AppModule } from '../types';

interface ModuleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeModule: AppModule;
  onModuleChange: (module: AppModule) => void;
  onLogout: () => void;
}

const modules = [
  {
    id: 'analises' as AppModule,
    label: 'Análises de OS',
    description: 'IA analisa OS dos técnicos',
    icon: Bot,
    color: 'from-blue-500 to-cyan-500',
    activeBg: 'from-blue-500/20 to-cyan-500/20',
    activeBorder: 'border-blue-500/40',
    activeText: 'text-blue-400',
    dot: 'bg-blue-400',
    badge: 'ativo',
    badgeColor: 'bg-blue-500/20 text-blue-300',
  },
  {
    id: 'cs-ixc' as AppModule,
    label: 'CS IXC',
    description: 'Atendimento pós-OS (IXC)',
    icon: MessageSquare,
    color: 'from-purple-500 to-pink-500',
    activeBg: 'from-purple-500/20 to-pink-500/20',
    activeBorder: 'border-purple-500/40',
    activeText: 'text-purple-400',
    dot: 'bg-purple-400',
    badge: 'ativo',
    badgeColor: 'bg-purple-500/20 text-purple-400',
  },
  {
    id: 'cs-opa' as AppModule,
    label: 'CS OPA',
    description: 'Atendimento pós-OS (OPA)',
    icon: Phone,
    color: 'from-green-500 to-emerald-500',
    activeBg: 'from-green-500/20 to-emerald-500/20',
    activeBorder: 'border-green-500/40',
    activeText: 'text-green-400',
    dot: 'bg-green-400',
    badge: 'ativo',
    badgeColor: 'bg-green-500/20 text-green-400',
  },
  {
    id: 'erro-rede' as AppModule,
    label: 'Erro na Rede',
    description: 'Monitor de falhas + notificações',
    icon: Wifi,
    color: 'from-red-500 to-orange-500',
    activeBg: 'from-red-500/20 to-orange-500/20',
    activeBorder: 'border-red-500/40',
    activeText: 'text-red-400',
    dot: 'bg-red-400',
    badge: 'ativo',
    badgeColor: 'bg-red-500/20 text-red-300',
  },
  {
    id: 'fluxos-n8n' as AppModule,
    label: 'Fluxos N8N',
    description: 'Controle de automações',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    activeBg: 'from-yellow-500/20 to-orange-500/20',
    activeBorder: 'border-yellow-500/40',
    activeText: 'text-yellow-400',
    dot: 'bg-yellow-400',
    badge: 'ativo',
    badgeColor: 'bg-yellow-500/20 text-yellow-300',
  },
];

export default function ModuleSidebar({
  isOpen,
  onToggle,
  activeModule,
  onModuleChange,
  onLogout,
}: ModuleSidebarProps) {
  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col w-72
          bg-slate-950 border-r border-slate-800/80
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Topo */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-white text-lg font-black tracking-tight">5.8</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-base leading-tight">Automações</h2>
                <p className="text-slate-500 text-xs mt-0.5">Sistema de Monitoramento</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden text-slate-500 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Label seção */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">
            Módulos
          </span>
        </div>

        {/* Menu módulos */}
        <nav className="flex-1 px-3 pb-3 space-y-1.5 overflow-y-auto">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;

            return (
              <button
                key={mod.id}
                onClick={() => onModuleChange(mod.id)}
                className={`
                  w-full flex items-center gap-3.5 px-3.5 py-3.5 rounded-xl
                  transition-all duration-200 group text-left
                  ${isActive
                    ? `bg-gradient-to-r ${mod.activeBg} border ${mod.activeBorder}`
                    : 'border border-transparent hover:bg-slate-900/80 hover:border-slate-800'
                  }
                `}
              >
                {/* Ícone */}
                <div
                  className={`
                    w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isActive
                      ? `bg-gradient-to-br ${mod.color} shadow-lg`
                      : 'bg-slate-800 group-hover:bg-slate-700'
                    }
                  `}
                >
                  <Icon
                    size={18}
                    className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}
                  />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm truncate ${
                        isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                      }`}
                    >
                      {mod.label}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${mod.badgeColor}`}>
                      {mod.badge}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 truncate ${isActive ? 'text-slate-400' : 'text-slate-600 group-hover:text-slate-500'}`}>
                    {mod.description}
                  </p>
                </div>

                {/* Dot ativo */}
                {isActive && (
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${mod.dot} animate-pulse`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Rodapé */}
        <div className="p-3 border-t border-slate-800/80">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
          >
            <LogOut size={18} className="group-hover:scale-110 transition-transform flex-shrink-0" />
            <span className="font-medium text-sm">Sair do sistema</span>
          </button>
        </div>
      </aside>

      {/* Botão hamburguer mobile */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-all duration-200 lg:hidden border border-slate-700"
      >
        <Menu size={20} />
      </button>
    </>
  );
}