import { BarChart3, Users, TrendingUp, AlertTriangle, Award, Menu, X, LogOut } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'produtividade', label: 'Produtividade', icon: TrendingUp },
  { id: 'ranking', label: 'Ranking', icon: Award },
  { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
];

export default function Sidebar({ isOpen, onToggle, activeSection, onSectionChange, onLogout }: SidebarProps) {
  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          border-r border-slate-700/50 z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <span className="text-white text-lg font-bold">5.8</span>
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Dashboard</h2>
                <p className="text-slate-400 text-xs">Análises v2.0</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSectionChange(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }
                `}
              >
                <Icon
                  size={20}
                  className={`
                    transition-transform duration-200
                    ${isActive ? 'text-blue-400' : 'group-hover:scale-110'}
                  `}
                />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Menu hamburguer - mobile/desktop */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg shadow-lg transition-all duration-200 lg:hidden"
      >
        <Menu size={24} />
      </button>
    </>
  );
}
