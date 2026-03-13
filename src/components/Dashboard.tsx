import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Activity, AlertCircle, Menu, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Analise, TecnicoStats, ClienteAlert, RetrabalhoAlert, ProdutividadeMes } from '../types/analises';
import OSPorCliente from './OSPorCliente';
import AlertasRetrabalho from './AlertasRetrabalho';
import PontuacaoPorTecnico from './PontuacaoPorTecnico';
import ComparativoProdutividade from './ComparativoProdutividade';
import RankingProdutividade from './RankingProdutividade';
import Sidebar from './Sidebar';

interface DashboardProps {
  onLogout: () => void;
}

const menuItems = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'produtividade', label: 'Produtividade' },
  { id: 'ranking', label: 'Ranking' },
  { id: 'alertas', label: 'Alertas' },
];

export default function Dashboard({ onLogout }: DashboardProps) {
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [tecnicosAuxMap, setTecnicosAuxMap] = useState<Record<string, string>>({});

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('5.8-analises')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalises(data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTecnicosAux = async () => {
    const { data } = await supabase.from('5.8-tecnicos_auxiliares').select('id, nome');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((t: { id: string; nome: string }) => { map[t.id] = t.nome; });
      setTecnicosAuxMap(map);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  useEffect(() => {
    loadData();
    loadTecnicosAux();
  }, []);

  const getClienteAlerts = (): ClienteAlert[] => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOS = analises.filter(a => new Date(a.created_at) >= thirtyDaysAgo);
    const clientesMap = new Map<string, { os: Analise[] }>();

    recentOS.forEach(os => {
      if (!clientesMap.has(os.nome_cliente)) {
        clientesMap.set(os.nome_cliente, { os: [] });
      }
      clientesMap.get(os.nome_cliente)!.os.push(os);
    });

    return Array.from(clientesMap.entries()).map(([cliente, data]) => ({
      cliente,
      totalOS: data.os.length,
      ultimaOS: data.os.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at,
      tecnicos: [...new Set(data.os.map(os => os.id_tecnico))]
    }));
  };

  const getRetrabalhoAlerts = (): RetrabalhoAlert[] => {
    const alerts: RetrabalhoAlert[] = [];
    const clientesMap = new Map<string, Analise[]>();

    analises.forEach(os => {
      if (!clientesMap.has(os.nome_cliente)) {
        clientesMap.set(os.nome_cliente, []);
      }
      clientesMap.get(os.nome_cliente)!.push(os);
    });

    clientesMap.forEach((osCliente, cliente) => {
      const sorted = osCliente.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      for (let i = 0; i < sorted.length - 1; i++) {
        const os1 = sorted[i];
        const os2 = sorted[i + 1];

        if (os1.id_tecnico !== os2.id_tecnico) {
          const diasEntre = Math.floor(
            (new Date(os2.created_at).getTime() - new Date(os1.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diasEntre <= 60) {
            alerts.push({
              cliente,
              tecnico1: os1.id_tecnico,
              tecnico2: os2.id_tecnico,
              data1: os1.created_at,
              data2: os2.created_at,
              diasEntre
            });
          }
        }
      }
    });

    return alerts;
  };

  const getTecnicoStats = (): TecnicoStats[] => {
    const statsMap = new Map<string, Analise[]>();

    analises.forEach(os => {
      const ids = [os.tecnicoprincipal, os.tecnicoauxiliar].filter(Boolean) as string[];
      const uniq = [...new Set(ids)];
      uniq.forEach(id => {
        if (!statsMap.has(id)) statsMap.set(id, []);
        statsMap.get(id)!.push(os);
      });
    });

    return Array.from(statsMap.entries()).map(([tecnico, oss]) => {
      const totalOS = oss.length;
      const pontuacaoTotal = oss.reduce((acc, os) => acc + (os.pontuacao_servico || 0), 0);
      const pontuacaoMedia = totalOS > 0 ? pontuacaoTotal / totalOS : 0;
      const valorTotal = oss.reduce((acc, os) => acc + (os.valor_servico || 150), 0);
      const pontuacaoPonderada = pontuacaoMedia * valorTotal;
      return { tecnico, totalOS, pontuacaoMedia, valorTotal, pontuacaoPonderada };
    });
  };

  const getProdutividadeMes = (): ProdutividadeMes[] => {
    const prodMap = new Map<string, Analise[]>();

    analises.forEach(os => {
      const mes = os.created_at.substring(0, 7);
      const key = `${mes}-${os.id_tecnico}`;

      if (!prodMap.has(key)) {
        prodMap.set(key, []);
      }
      prodMap.get(key)!.push(os);
    });

    return Array.from(prodMap.entries()).map(([key, oss]) => {
      const realMes = key.substring(0, 7);
      const realTecnico = key.substring(8);
      const pontuacaoTotal = oss.reduce((acc, os) => acc + (os.pontuacao_servico || 0), 0);
      const pontuacaoMedia = oss.length > 0 ? pontuacaoTotal / oss.length : 0;
      const valorTotal = oss.reduce((acc, os) => acc + (os.valor_servico || 150), 0);

      return {
        mes: realMes,
        tecnico: realTecnico,
        totalOS: oss.length,
        valorTotal,
        pontuacaoMedia
      };
    });
  };

  const clienteAlerts = getClienteAlerts();
  const retrabalhoAlerts = getRetrabalhoAlerts();
  const tecnicoStats = getTecnicoStats();
  const produtividadeMes = getProdutividadeMes();

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <MetricCard
                title="Total de OS"
                value={analises.length}
                icon={Activity}
                color="blue"
                trend="+12%"
              />
              <MetricCard
                title="Técnicos Ativos"
                value={tecnicoStats.length}
                icon={Users}
                color="green"
                trend="+5%"
              />
              <MetricCard
                title="Pontuação Média"
                value={analises.length > 0
                  ? (analises.reduce((sum, a) => sum + (a.pontuacao_servico || 0), 0) / analises.length).toFixed(1)
                  : '0'}
                icon={TrendingUp}
                color="orange"
                trend="+3%"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <RankingProdutividade stats={tecnicoStats} />
              <PontuacaoPorTecnico stats={tecnicoStats} tecnicosAuxMap={tecnicosAuxMap} />
            </div>

            <div className="mb-6">
              <ComparativoProdutividade data={produtividadeMes} />
            </div>
          </>
        );

      case 'clientes':
        return (
          <>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Total de Clientes</p>
                    <p className="text-3xl font-bold text-slate-900">{clienteAlerts.length}</p>
                  </div>
                  <Users className="text-blue-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Clientes Recorrentes</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {clienteAlerts.filter(c => c.totalOS > 1).length}
                    </p>
                  </div>
                  <TrendingUp className="text-green-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Média OS/Cliente</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {clienteAlerts.length > 0
                        ? (clienteAlerts.reduce((sum, c) => sum + c.totalOS, 0) / clienteAlerts.length).toFixed(1)
                        : '0'}
                    </p>
                  </div>
                  <Activity className="text-purple-500" size={32} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <OSPorCliente alerts={clienteAlerts} />
            </div>
          </>
        );

      case 'produtividade':
        return (
          <>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">OS Total</p>
                    <p className="text-3xl font-bold text-slate-900">{analises.length}</p>
                  </div>
                  <Activity className="text-blue-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Média OS/Técnico</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {tecnicoStats.length > 0
                        ? (analises.length / tecnicoStats.length).toFixed(1)
                        : '0'}
                    </p>
                  </div>
                  <Users className="text-green-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Valor Médio OS</p>
                    <p className="text-3xl font-bold text-slate-900">
                      R$ {analises.length > 0
                        ? (analises.reduce((sum, a) => sum + (a.valor_servico || 150), 0) / analises.length).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <DollarSign className="text-purple-500" size={32} />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <ComparativoProdutividade data={produtividadeMes} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PontuacaoPorTecnico stats={tecnicoStats} tecnicosAuxMap={tecnicosAuxMap} />
              <RankingProdutividade stats={tecnicoStats} />
            </div>
          </>
        );

      case 'ranking':
        return (
          <>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Ranking de Performance</h2>
                    <p className="text-blue-100">
                      Classificação baseada em pontuação ponderada e valor gerado
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-100 text-sm">Total de Técnicos</p>
                    <p className="text-5xl font-bold">{tecnicoStats.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RankingProdutividade stats={tecnicoStats} />
              <PontuacaoPorTecnico stats={tecnicoStats} tecnicosAuxMap={tecnicosAuxMap} />
            </div>
          </>
        );

      case 'alertas':
        return (
          <>
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Casos de Retrabalho</p>
                    <p className="text-3xl font-bold text-red-600">{retrabalhoAlerts.length}</p>
                  </div>
                  <AlertCircle className="text-red-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Taxa de Retrabalho</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {analises.length > 0
                        ? ((retrabalhoAlerts.length / analises.length) * 100).toFixed(1)
                        : '0'}%
                    </p>
                  </div>
                  <TrendingUp className="text-orange-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm font-medium mb-1">Clientes Afetados</p>
                    <p className="text-3xl font-bold text-amber-600">
                      {new Set(retrabalhoAlerts.map(a => a.cliente)).size}
                    </p>
                  </div>
                  <Users className="text-amber-500" size={32} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <AlertasRetrabalho alerts={retrabalhoAlerts} />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={onLogout}
      />

      <div className="lg:ml-64 min-h-screen">
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Menu size={24} className="text-slate-700" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {menuItems.find(item => item.id === activeSection)?.label || 'Dashboard'}
                  </h1>
                  <p className="text-slate-600 text-sm mt-0.5">
                    {analises.length} análises carregadas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    size={18}
                    className={refreshing ? 'animate-spin' : ''}
                  />
                  <span className="hidden sm:inline font-medium">
                    {refreshing ? 'Atualizando...' : 'Atualizar'}
                  </span>
                </button>
                <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Última atualização</p>
                    <p className="text-xs font-semibold text-slate-700">
                      {new Date().toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-slate-600 font-medium">Carregando dados...</p>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: 'blue' | 'green' | 'purple' | 'orange';
  trend?: string;
}

function MetricCard({ title, value, icon: Icon, color, trend }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    purple: 'from-purple-500 to-pink-500',
    orange: 'from-orange-500 to-red-500',
  };

  const shadowClasses = {
    blue: 'shadow-blue-500/20',
    green: 'shadow-green-500/20',
    purple: 'shadow-purple-500/20',
    orange: 'shadow-orange-500/20',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-500 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp size={14} className="text-green-500" />
              <p className="text-green-600 text-sm font-semibold">{trend}</p>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg ${shadowClasses[color]}`}>
          <Icon className="text-white" size={26} />
        </div>
      </div>
    </div>
  );
}
