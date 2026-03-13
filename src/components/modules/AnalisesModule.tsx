import { useEffect, useState } from 'react';
import {
  Users, TrendingUp, AlertCircle, Menu, RefreshCw,
  CheckCircle, XCircle, FileText, BarChart3, Award, AlertTriangle, ChevronRight,
  Clock, Search, Filter, X, Settings, Plus, Pencil, Trash2, Save, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Analise, TecnicoStats, RetrabalhoAlert, TecnicoAuxiliar } from '../../types';

type Section = 'overview' | 'os' | 'tecnicos' | 'ranking' | 'alertas' | 'configuracoes';

interface Props {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

const sectionItems: { id: Section; label: string; icon: any }[] = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
  { id: 'os', label: 'Ordens de Serviço', icon: FileText },
  { id: 'tecnicos', label: 'Técnicos', icon: Users },
  { id: 'ranking', label: 'Ranking', icon: Award },
  { id: 'alertas', label: 'Alertas', icon: AlertTriangle },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

// ==================== Helpers de status ====================
// Usa o campo "final" que contém "SITUAÇÃO FINAL - aprovado/reprovado..."
// Cobre variações: "reprovado", "reproado", "aprovado"
function isAprovado(a: Analise): boolean {
  const texto = (a.final || '').toLowerCase();
  if (!texto.includes('situa')) return false;
  // Pega o trecho após o traço
  const aposTraco = texto.split('-').slice(1).join('-').trim();
  return aposTraco.startsWith('aprovado');
}

function isReprovado(a: Analise): boolean {
  const texto = (a.final || '').toLowerCase();
  if (!texto.includes('situa')) return false;
  const aposTraco = texto.split('-').slice(1).join('-').trim();
  // cobre "reprovado" e "reproado"
  return aposTraco.startsWith('reprovado') || aposTraco.startsWith('reproado');
}

function getStatus(a: Analise): 'aprovado' | 'reprovado' | null {
  if (isAprovado(a)) return 'aprovado';
  if (isReprovado(a)) return 'reprovado';
  return null;
}

// Extrai pontuação do campo final
// Ex: "taxa de acerto dos tec 80.00" ou "taxa de acerto 92" ou "nota atribuída aos técnicos é 92"
function extrairPontuacao(a: Analise): number | null {
  const texto = (a.final || '');
  // Tenta capturar número após padrões conhecidos
  const match = texto.match(/(?:taxa de acerto(?: dos t[eé]c(?:nicos)?)?|nota atribu[ií]da aos t[eé]cnicos [eé])\s+(\d+(?:[.,]\d+)?)/i);
  if (match) return parseFloat(match[1].replace(',', '.'));
  return null;
}

// Extrai o tipo de serviço: tudo até o primeiro ponto na mensagem_os
function extrairTipoServico(mensagem: string | null): string | null {
  if (!mensagem) return null;
  const atePonto = mensagem.split('.')[0].trim();
  if (!atePonto.toLowerCase().startsWith('processo')) return null;
  return atePonto.replace(/\s+/g, ' ').trim();
}

export default function AnalisesModule({ sidebarOpen, onSidebarToggle }: Props) {
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTecnico, setFilterTecnico] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [tecnicosAuxMap, setTecnicosAuxMap] = useState<Record<string, string>>({});
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      // Supabase limita 1000 por query — busca em páginas até trazer tudo
      let allData: Analise[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('5.8-analises')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        from += pageSize;
      }
      // Deduplica por id_os (ignora nulls — pode haver múltiplas análises da mesma OS)
      const seen = new Set<string>();
      const unique = allData.filter(a => {
        if (!a.id_os) return false; // ignora null
        if (seen.has(a.id_os)) return false; // ignora duplicata
        seen.add(a.id_os);
        return true;
      });
      setAnalises(unique);
    } catch (err) {
      console.error('Erro ao carregar análises:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTecnicosAux = async () => {
    const { data } = await supabase.from('5.8-tecnicos_auxiliares').select('id, nome');
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((t: TecnicoAuxiliar) => { map[t.id] = t.nome; });
      setTecnicosAuxMap(map);
    }
  };

  useEffect(() => { loadData(); loadTecnicosAux(); }, []);

  // Aplica filtro de período (global — afeta overview + OS + outros)
  const analisesPeriodo = analises.filter(a => {
    if (filterDateFrom && a.created_at < filterDateFrom) return false;
    if (filterDateTo && a.created_at > filterDateTo + 'T23:59:59') return false;
    return true;
  });

  const tecnicos = [...new Set(analisesPeriodo.map(a => a.id_tecnico).filter(Boolean))] as string[];

  const getTecnicoStats = (): TecnicoStats[] => {
    const map = new Map<string, Analise[]>();
    analisesPeriodo.forEach(a => {
      const t = a.id_tecnico || 'Desconhecido';
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(a);
    });
    return Array.from(map.entries()).map(([tecnico, os]) => {
      const totalOS = os.length;
      const aprovados = os.filter(o => isAprovado(o)).length;
      // Usa pontuação extraída do campo final, fallback para pontuacao_servico
      const pontuacoes = os.map(o => extrairPontuacao(o) ?? o.pontuacao_servico ?? null).filter((p): p is number => p !== null);
      const pontuacaoMedia = pontuacoes.length > 0 ? pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length : 0;
      const valorTotal = os.reduce((acc, o) => acc + (o.valor_servico || 0), 0);
      return { tecnico, totalOS, pontuacaoMedia, valorTotal, pontuacaoPonderada: aprovados * 10 + totalOS };
    }).sort((a, b) => b.totalOS - a.totalOS);
  };

  const getRetrabalhoAlerts = (): RetrabalhoAlert[] => {
    const alerts: RetrabalhoAlert[] = [];
    const clientesMap = new Map<string, Analise[]>();

    analisesPeriodo.forEach(a => {
      const c = a.nome_cliente?.trim();
      if (!c || c.toLowerCase() === 'empty') return; // ignora vazio
      if (!clientesMap.has(c)) clientesMap.set(c, []);
      clientesMap.get(c)!.push(a);
    });

    clientesMap.forEach((os, cliente) => {
      const sorted = [...os].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      for (let i = 0; i < sorted.length - 1; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const o1 = sorted[i], o2 = sorted[j];

          // Técnico tem que ser diferente
          if (!o1.id_tecnico || !o2.id_tecnico) continue;
          if (o1.id_tecnico === o2.id_tecnico) continue;

          // Dentro de 30 dias
          const dias = Math.floor((new Date(o2.created_at).getTime() - new Date(o1.created_at).getTime()) / 86400000);
          if (dias > 30) break; // já passou de 30 dias, próximas também vão passar

          // Mesmo tipo de serviço — extrai "Processo: X . Tarefa: Y" do início da mensagem_os
          const tipo1 = extrairTipoServico(o1.mensagem_os);
          const tipo2 = extrairTipoServico(o2.mensagem_os);
          if (!tipo1 || !tipo2) continue;
          if (tipo1.toLowerCase() !== tipo2.toLowerCase()) continue;

          alerts.push({
            cliente,
            tecnico1: o1.id_tecnico,
            tecnico2: o2.id_tecnico,
            data1: o1.created_at,
            data2: o2.created_at,
            diasEntre: dias,
            tipoServico: tipo1,
          });
        }
      }
    });

    return alerts;
  };

  const tecnicoStats = getTecnicoStats();
  const retrabalhoAlerts = getRetrabalhoAlerts();

  // Só conta OS com relato_validado reconhecido
  const totalAprovados = analisesPeriodo.filter(a => isAprovado(a)).length;
  const totalReprovados = analisesPeriodo.filter(a => isReprovado(a)).length;
  const totalAnalisadas = totalAprovados + totalReprovados;
  const totalComSinalONU = analisesPeriodo.filter(a => {
    const sinal = (a.sinal_ONU || '').trim().toLowerCase();
    return sinal === 'irregular' || sinal === 'indefinido';
  }).length;

  const analisesFiltered = analisesPeriodo.filter(a => {
    const status = getStatus(a);
    if (status === null) return false; // ignora NULL
    const matchSearch = !searchTerm ||
      (a.nome_cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.id_os || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.id_tecnico || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchTecnico = !filterTecnico || a.id_tecnico === filterTecnico;
    const matchStatus = !filterStatus || status === filterStatus;
    return matchSearch && matchTecnico && matchStatus;
  });

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection analises={analisesPeriodo} tecnicoStats={tecnicoStats} retrabalhoAlerts={retrabalhoAlerts} totalAprovados={totalAprovados} totalReprovados={totalReprovados} totalAnalisadas={totalAnalisadas} totalComSinalONU={totalComSinalONU} tecnicosAuxMap={tecnicosAuxMap} />;
      case 'os': return <OSSection analises={analisesFiltered} searchTerm={searchTerm} setSearchTerm={setSearchTerm} filterTecnico={filterTecnico} setFilterTecnico={setFilterTecnico} filterStatus={filterStatus} setFilterStatus={setFilterStatus} tecnicos={tecnicos} tecnicosAuxMap={tecnicosAuxMap} />;
      case 'tecnicos': return <TecnicosSection stats={tecnicoStats} analises={analisesPeriodo} />;
      case 'ranking': return <RankingSection stats={tecnicoStats} />;
      case 'alertas': return <AlertasSection alerts={retrabalhoAlerts} totalAnalises={analisesPeriodo.length} />;
      case 'configuracoes': return <ConfiguracoesSection tecnicosAuxMap={tecnicosAuxMap} onReload={loadTecnicosAux} analises={analises} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={onSidebarToggle} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
              <Menu size={20} className="text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Módulo</span>
                <ChevronRight size={12} className="text-slate-400" />
                <span className="text-xs font-semibold text-blue-600">Análises de OS</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">
                {sectionItems.find(s => s.id === activeSection)?.label}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Filtro de período */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
              <Calendar size={13} className="text-slate-400 flex-shrink-0" />
              <input
                type="date" value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-600 w-28 cursor-pointer"
                title="Data inicial"
              />
              <span className="text-slate-300">—</span>
              <input
                type="date" value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-600 w-28 cursor-pointer"
                title="Data final"
              />
              {(filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }}
                  className="ml-1 text-slate-400 hover:text-red-500 transition-colors" title="Limpar filtro">
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {analisesPeriodo.length}{analisesPeriodo.length !== analises.length ? `/${analises.length}` : ''} registros
            </span>
            <button onClick={() => loadData(true)} disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-all">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
            </button>
          </div>
        </div>
        <div className="flex overflow-x-auto px-4 sm:px-6 lg:px-8 gap-0.5 border-t border-slate-100">
          {sectionItems.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                }`}>
                <Icon size={14} />{item.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="relative w-14 h-14 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-slate-600 font-medium text-sm">Carregando análises...</p>
            </div>
          </div>
        ) : renderSection()}
      </main>
    </div>
  );
}

// ===================== HELPERS ANALYTICS =====================

function computeMonthlyData(analises: Analise[]) {
  const map = new Map<string, { total: number; aprovados: number; reprovados: number }>();
  analises.forEach(a => {
    const aprov = isAprovado(a), reprov = isReprovado(a);
    if (!aprov && !reprov) return;
    const d = new Date(a.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!map.has(key)) map.set(key, { total: 0, aprovados: 0, reprovados: 0 });
    const m = map.get(key)!;
    m.total++;
    if (aprov) m.aprovados++;
    if (reprov) m.reprovados++;
  });
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([key, d]) => {
    const [, month] = key.split('-');
    return {
      key, label: monthNames[parseInt(month) - 1],
      total: d.total, aprovados: d.aprovados, reprovados: d.reprovados,
      taxaAprovacao: d.total > 0 ? (d.aprovados / d.total) * 100 : 0,
      taxaReprovacao: d.total > 0 ? (d.reprovados / d.total) * 100 : 0,
    };
  });
}

const MOTIVOS_KEYWORDS = [
  { label: 'Nome/Acompanhante não informado', keys: ['nome não informado', 'nome do acompanhante', 'acompanhante não', 'nome inválido'] },
  { label: 'Telefone/Contato inválido', keys: ['telefone', 'contato inválido', 'número inválido'] },
  { label: 'Serviço externo', keys: ['serviço externo'] },
  { label: 'CTO não informado', keys: ['cto não', 'cto inválido', 'cto ausente'] },
  { label: 'PowerMeter não informado', keys: ['powermeter', 'power meter'] },
  { label: 'Sinais ópticos incompletos', keys: ['sinal óptico', 'sinais ópticos', 'onu irregular', 'sinal onu'] },
  { label: 'Metragem ausente', keys: ['metragem', 'metros não'] },
  { label: 'Cabo não informado', keys: ['cabo passado', 'cabo não'] },
  { label: 'Validação de sinal', keys: ['validação de sinal', 'sinal não validado'] },
];

function computeMotivos(analises: Analise[]) {
  const reprovadas = analises.filter(a => isReprovado(a));
  return MOTIVOS_KEYWORDS
    .map(m => ({
      label: m.label,
      count: reprovadas.filter(a => {
        const txt = ((a.final || '') + ' ' + (a.relato_reprovado || '')).toLowerCase();
        return m.keys.some(k => txt.includes(k));
      }).length,
    }))
    .filter(m => m.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

function computeDiasReprovacoes(analises: Analise[]) {
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const counts = Array(7).fill(0);
  analises.filter(a => isReprovado(a)).forEach(a => { counts[new Date(a.created_at).getDay()]++; });
  return dayNames.map((label, i) => ({ label, count: counts[i] }));
}

function computeTecnicosCombinados(analises: Analise[]) {
  const map = new Map<string, { total: number; aprovados: number; reprovados: number }>();
  const add = (id: string, aprov: boolean, reprov: boolean) => {
    if (!map.has(id)) map.set(id, { total: 0, aprovados: 0, reprovados: 0 });
    const s = map.get(id)!;
    s.total++;
    if (aprov) s.aprovados++;
    if (reprov) s.reprovados++;
  };
  analises.forEach(a => {
    const aprov = isAprovado(a), reprov = isReprovado(a);
    if (!aprov && !reprov) return;
    if (a.id_tecnico) add(a.id_tecnico, aprov, reprov);
    if (a.tecnicoauxiliar && a.tecnicoauxiliar !== a.id_tecnico) add(a.tecnicoauxiliar, aprov, reprov);
  });
  return Array.from(map.entries())
    .map(([id, s]) => ({ id, total: s.total, aprovados: s.aprovados, reprovados: s.reprovados, taxaErro: s.total > 0 ? (s.reprovados / s.total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total);
}

// ===================== OVERVIEW =====================
function OverviewSection({ analises, retrabalhoAlerts, totalAprovados, totalReprovados, totalAnalisadas, totalComSinalONU, tecnicosAuxMap }: any) {
  const taxaAprovacao = totalAnalisadas > 0 ? ((totalAprovados / totalAnalisadas) * 100).toFixed(1) : '0';
  const daysSet = new Set(analises.map((a: Analise) => a.created_at.split('T')[0]));
  const mediaOsDia = daysSet.size > 0 ? (analises.length / daysSet.size).toFixed(1) : '0';

  const monthlyData = computeMonthlyData(analises);
  const motivos = computeMotivos(analises);
  const diasReprov = computeDiasReprovacoes(analises);
  const tecnicosCombinados = computeTecnicosCombinados(analises);

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total de OS" value={analises.length} icon={FileText} color="blue" sub="registros no banco" />
        <MetricCard title="Aprovadas" value={totalAprovados} icon={CheckCircle} color="green" sub={`${taxaAprovacao}% das analisadas`} />
        <MetricCard title="Reprovadas" value={totalReprovados} icon={XCircle} color="red" sub="requerem atenção" />
        <MetricCard title="Alertas" value={retrabalhoAlerts.length + totalComSinalONU} icon={AlertCircle} color="purple" sub={`${retrabalhoAlerts.length} retrabalhos · ${totalComSinalONU} ONU`} />
        <MetricCard title="Média OS/dia" value={mediaOsDia} icon={TrendingUp} color="blue" sub={`${daysSet.size} dias com atividade`} />
      </div>

      {/* Evolução mensal + Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Evolução por Mês</h3>
          <p className="text-xs text-slate-500 mb-4">Taxa de aprovação e volume mensal</p>
          <MonthlyChart data={monthlyData} />
        </div>
        <TendenciaCard monthlyData={monthlyData} totalReprovados={totalReprovados} totalAnalisadas={totalAnalisadas} />
      </div>

      {/* Análise por Técnico */}
      <AnalisePorTecnicoTable tecnicos={tecnicosCombinados} tecnicosAuxMap={tecnicosAuxMap} />

      {/* Motivos + Dias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MotivoReprovacaoCard motivos={motivos} />
        <DiasReprovacaoCard dias={diasReprov} />
      </div>

      {/* Rankings */}
      <RankingsTecnicos tecnicos={tecnicosCombinados} tecnicosAuxMap={tecnicosAuxMap} />

      {/* Últimas análises */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Últimas Análises</h3>
          <span className="text-xs text-slate-500">Mais recentes primeiro</span>
        </div>
        <div className="divide-y divide-slate-50">
          {analises.filter((a: Analise) => getStatus(a) !== null).slice(0, 8).map((a: Analise) => (
            <AnaliseRow key={a.id} analise={a} compact tecnicosAuxMap={tecnicosAuxMap} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthlyChart({ data }: { data: ReturnType<typeof computeMonthlyData> }) {
  if (data.length === 0) return (
    <div className="h-32 flex items-center justify-center text-slate-400 text-sm">Sem dados mensais</div>
  );
  const maxTotal = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => {
        const prev = i > 0 ? data[i - 1] : null;
        const rateChange = prev ? d.taxaAprovacao - prev.taxaAprovacao : 0;
        return (
          <div key={d.key} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 w-8 flex-shrink-0 text-right">{d.label}</span>
            <div className="flex-1 relative h-6 bg-slate-100 rounded-md overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                style={{ width: `${(d.aprovados / maxTotal) * 100}%` }} />
              <div className="absolute top-0 h-full bg-red-400 transition-all"
                style={{ left: `${(d.aprovados / maxTotal) * 100}%`, width: `${(d.reprovados / maxTotal) * 100}%` }} />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 w-36 justify-end">
              <span className={`text-xs font-bold ${d.taxaAprovacao >= 90 ? 'text-green-600' : d.taxaAprovacao >= 80 ? 'text-yellow-600' : 'text-red-500'}`}>
                {d.taxaAprovacao.toFixed(1)}%
              </span>
              {prev && (
                <span className={`text-[10px] font-medium w-10 ${rateChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {rateChange >= 0 ? '▲' : '▼'}{Math.abs(rateChange).toFixed(1)}
                </span>
              )}
              <span className="text-xs text-slate-400 w-14 text-right">{d.total} OS</span>
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-green-500 rounded inline-block" /> Aprovadas</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-red-400 rounded inline-block" /> Reprovadas</span>
      </div>
    </div>
  );
}

function TendenciaCard({ monthlyData, totalReprovados, totalAnalisadas }: { monthlyData: ReturnType<typeof computeMonthlyData>; totalReprovados: number; totalAnalisadas: number }) {
  const taxaAprovGlobal = totalAnalisadas > 0 ? ((totalAnalisadas - totalReprovados) / totalAnalisadas) * 100 : 0;
  const last = monthlyData[monthlyData.length - 1];
  const prev = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;
  const diff = prev && last ? last.taxaReprovacao - prev.taxaReprovacao : 0;
  const trend = diff > 1 ? 'pior' : diff < -1 ? 'melhor' : 'estável';
  const minTaxa = monthlyData.length > 0 ? Math.min(...monthlyData.map(d => d.taxaReprovacao)) : 0;
  const maxTaxa = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.taxaReprovacao)) : 0;
  const bestMonth = monthlyData.find(d => d.taxaReprovacao === minTaxa);

  const qualColor = taxaAprovGlobal >= 90 ? 'text-green-600' : taxaAprovGlobal >= 75 ? 'text-yellow-600' : 'text-red-600';
  const qualLabel = taxaAprovGlobal >= 90 ? 'Boa qualidade' : taxaAprovGlobal >= 75 ? 'Qualidade regular' : 'Qualidade crítica';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Tendência de Qualidade</h3>
      <p className="text-xs text-slate-500 mb-4">Interpretação automática</p>
      {totalAnalisadas === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">Sem dados no período</p>
      ) : (
        <div className="space-y-3">
          {/* Resumo global sempre visível */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${qualColor}`}>{qualLabel}</span>
              <span className={`text-lg font-bold ${qualColor}`}>{taxaAprovGlobal.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${taxaAprovGlobal >= 90 ? 'bg-green-500' : taxaAprovGlobal >= 75 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${taxaAprovGlobal}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {totalAnalisadas - totalReprovados} aprovadas · {totalReprovados} reprovadas · {totalAnalisadas} total
            </p>
          </div>

          {/* Comparação mês a mês (só com 2+ meses) */}
          {prev && last && (
            <div className={`p-3 rounded-lg border text-sm ${trend === 'pior' ? 'bg-red-50 border-red-100' : trend === 'melhor' ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className={`font-semibold text-xs mb-1 ${trend === 'pior' ? 'text-red-700' : trend === 'melhor' ? 'text-green-700' : 'text-slate-600'}`}>
                {trend === 'pior' ? '⚠ Aumento de reprovações no último mês' : trend === 'melhor' ? '✓ Melhora no último mês' : '→ Estável no último mês'}
              </div>
              <p className="text-xs text-slate-600">
                {last.label}: <strong>{last.taxaReprovacao.toFixed(1)}%</strong> erro vs {prev.label}: <strong>{prev.taxaReprovacao.toFixed(1)}%</strong>
              </p>
            </div>
          )}

          {/* Melhor mês e variação (só com 2+ meses) */}
          {bestMonth && monthlyData.length > 1 && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-blue-700">Melhor mês: </span>
                {bestMonth.label} — {(100 - minTaxa).toFixed(1)}% aprovação
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Variação: {minTaxa.toFixed(1)}%–{maxTaxa.toFixed(1)}% erro — {maxTaxa - minTaxa < 5 ? 'histórico estável' : 'variação significativa'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnalisePorTecnicoTable({ tecnicos, tecnicosAuxMap }: { tecnicos: ReturnType<typeof computeTecnicosCombinados>; tecnicosAuxMap: Record<string, string> }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
        <h3 className="text-sm font-semibold text-slate-700">Análise por Técnico</h3>
        <p className="text-xs text-slate-500 mt-0.5">Considera id_tecnico e tecnicoauxiliar</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Técnico</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Relatos</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aprovados</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reprovados</th>
              <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Taxa de Erro</th>
              <th className="px-5 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">Qualidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tecnicos.map((t, i) => {
              const nome = tecnicosAuxMap[t.id] ? `${tecnicosAuxMap[t.id]} (${t.id})` : t.id;
              return (
                <tr key={t.id} className={`hover:bg-slate-50 transition-colors ${i < 3 ? 'bg-amber-50/20' : ''}`}>
                  <td className="px-5 py-2.5 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5 flex-shrink-0">{i + 1}</span>
                      <span className="truncate">{nome}</span>
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5 font-semibold text-slate-700">{t.total}</td>
                  <td className="text-center px-3 py-2.5 text-green-600 font-semibold">{t.aprovados}</td>
                  <td className="text-center px-3 py-2.5 text-red-500 font-semibold">{t.reprovados}</td>
                  <td className="text-center px-3 py-2.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      t.taxaErro === 0 ? 'bg-green-100 text-green-700' :
                      t.taxaErro <= 5 ? 'bg-blue-100 text-blue-700' :
                      t.taxaErro <= 10 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{t.taxaErro.toFixed(2)}%</span>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        t.taxaErro === 0 ? 'bg-green-500' : t.taxaErro <= 5 ? 'bg-blue-500' : t.taxaErro <= 10 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} style={{ width: `${100 - t.taxaErro}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MotivoReprovacaoCard({ motivos }: { motivos: ReturnType<typeof computeMotivos> }) {
  const maxCount = motivos[0]?.count || 1;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Principais Motivos de Reprovação</h3>
      <p className="text-xs text-slate-500 mb-4">Padrões identificados nos relatos</p>
      {motivos.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">Nenhum padrão identificado</div>
      ) : (
        <div className="space-y-3">
          {motivos.map((m, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-700 font-medium flex-1 truncate">{m.label}</span>
                <span className="text-xs font-bold text-slate-600 ml-2 flex-shrink-0">{m.count}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full"
                  style={{ width: `${(m.count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiasReprovacaoCard({ dias }: { dias: ReturnType<typeof computeDiasReprovacoes> }) {
  const maxCount = Math.max(...dias.map(d => d.count), 1);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Dias com Mais Reprovações</h3>
      <p className="text-xs text-slate-500 mb-4">Distribuição por dia da semana</p>
      <div className="space-y-2.5">
        {dias.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 w-8 flex-shrink-0">{d.label}</span>
            <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${d.count === maxCount && d.count > 0 ? 'bg-red-500' : 'bg-red-300'}`}
                style={{ width: `${(d.count / maxCount) * 100}%` }} />
            </div>
            <span className="text-xs font-semibold text-slate-600 w-6 text-right">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingsTecnicos({ tecnicos, tecnicosAuxMap }: { tecnicos: ReturnType<typeof computeTecnicosCombinados>; tecnicosAuxMap: Record<string, string> }) {
  const getNome = (id: string) => tecnicosAuxMap[id] ?? id;
  const comReprov = [...tecnicos].filter(t => t.reprovados > 0).sort((a, b) => b.reprovados - a.reprovados).slice(0, 5);
  const maiorTaxa = [...tecnicos].filter(t => t.total >= 5).sort((a, b) => b.taxaErro - a.taxaErro).slice(0, 5);
  const melhorQual = [...tecnicos].filter(t => t.total >= 5).sort((a, b) => a.taxaErro - b.taxaErro).slice(0, 5);

  const RankCard = ({ title, color, icon: Icon, items, valueKey, suffix, colorClass }: any) => (
    <div className={`bg-white rounded-xl border ${color} p-5 shadow-sm`}>
      <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${colorClass}`}>
        <Icon size={15} /> {title}
      </h3>
      {items.length === 0
        ? <p className="text-xs text-slate-400 text-center py-3">Sem dados suficientes</p>
        : <div className="space-y-2">
            {items.map((t: any, i: number) => (
              <div key={t.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-slate-400 w-4 flex-shrink-0">{i + 1}</span>
                  <span className="text-sm font-medium text-slate-700 truncate">{getNome(t.id)}</span>
                </div>
                <span className={`text-sm font-bold ml-2 flex-shrink-0 ${colorClass}`}>{t[valueKey].toFixed(valueKey === 'reprovados' ? 0 : 1)}{suffix}</span>
              </div>
            ))}
          </div>
      }
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <RankCard title="Mais Reprovações" color="border-red-100" icon={XCircle} items={comReprov} valueKey="reprovados" suffix="" colorClass="text-red-600" />
      <RankCard title="Maior Taxa de Erro" color="border-orange-100" icon={AlertCircle} items={maiorTaxa} valueKey="taxaErro" suffix="%" colorClass="text-orange-600" />
      <RankCard title="Melhor Qualidade" color="border-green-100" icon={CheckCircle} items={melhorQual} valueKey="taxaErro" suffix="%" colorClass="text-green-600" />
    </div>
  );
}

// ===================== OS =====================
// ===================== OS =====================
function OSSection({ analises, searchTerm, setSearchTerm, filterTecnico, setFilterTecnico, filterStatus, setFilterStatus, tecnicos, tecnicosAuxMap }: any) {
  const [selectedOS, setSelectedOS] = useState<Analise | null>(null);

  return (
    <div className="space-y-4">
      {selectedOS && <OSModal analise={selectedOS} onClose={() => setSelectedOS(null)} tecnicosAuxMap={tecnicosAuxMap} />}

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por cliente, OS ou técnico..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select value={filterTecnico} onChange={e => setFilterTecnico(e.target.value)}
            className="pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
            <option value="">Todos os técnicos</option>
            {tecnicos.map((t: string) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer">
          <option value="">Aprovadas e Reprovadas</option>
          <option value="aprovado">✅ Aprovado</option>
          <option value="reprovado">❌ Reprovado</option>
        </select>
        <span className="flex items-center text-xs text-slate-500 font-medium px-1">{analises.length} resultado{analises.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {analises.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">Nenhuma análise encontrada.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {analises.map((a: Analise) => (
              <AnaliseRow key={a.id} analise={a} onClick={() => setSelectedOS(a)} tecnicosAuxMap={tecnicosAuxMap} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== TÉCNICOS =====================
function TecnicosSection({ stats, analises }: { stats: TecnicoStats[]; analises: Analise[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.map((stat, i) => {
        const osDoTecnico = analises.filter((a: Analise) => a.id_tecnico === stat.tecnico);
        const aprovadas = osDoTecnico.filter((a: Analise) => isAprovado(a)).length;
        const reprovadas = osDoTecnico.filter((a: Analise) => isReprovado(a)).length;
        const analisadas = aprovadas + reprovadas;
        const taxaAprov = analisadas > 0 ? ((aprovadas / analisadas) * 100).toFixed(0) : '0';

        return (
          <div key={stat.tecnico} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-lg shadow-blue-500/20">
                {stat.tecnico.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{stat.tecnico}</h3>
                <p className="text-xs text-slate-500 mt-0.5">#{i + 1} no ranking</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-black text-slate-900">{stat.totalOS}</div>
                <div className="text-xs text-slate-500">OS total</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-lg p-2.5 text-center border border-green-100">
                <div className="text-base font-bold text-green-700">{aprovadas}</div>
                <div className="text-xs text-green-600 mt-0.5">Aprovadas</div>
              </div>
              <div className="bg-red-50 rounded-lg p-2.5 text-center border border-red-100">
                <div className="text-base font-bold text-red-600">{reprovadas}</div>
                <div className="text-xs text-red-500 mt-0.5">Reprovadas</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2.5 text-center border border-blue-100">
                <div className="text-base font-bold text-blue-700">{taxaAprov}%</div>
                <div className="text-xs text-blue-600 mt-0.5">Taxa aprov.</div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Taxa de aprovação</span><span>{taxaAprov}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${
                  parseInt(taxaAprov) >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  parseInt(taxaAprov) >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-rose-500'
                }`} style={{ width: `${taxaAprov}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ===================== RANKING =====================
function RankingSection({ stats }: { stats: TecnicoStats[] }) {
  const sorted = [...stats].sort((a, b) => b.totalOS - a.totalOS);
  return (
    <div className="space-y-3">
      {sorted.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[sorted[1], sorted[0], sorted[2]].map((stat, podiumIdx) => {
            const realIdx = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
            const configs = [
              { emoji: '🥇', border: 'border-yellow-300/50', h: 'h-32' },
              { emoji: '🥈', border: 'border-slate-300/50', h: 'h-24' },
              { emoji: '🥉', border: 'border-orange-300/50', h: 'h-20' },
            ];
            const c = configs[realIdx];
            return (
              <div key={stat.tecnico} className={`bg-white rounded-xl border ${c.border} p-4 shadow-lg ${c.h} flex flex-col items-center justify-end`}>
                <span className="text-2xl mb-1">{c.emoji}</span>
                <div className="text-xs font-bold text-slate-800 truncate w-full text-center">{stat.tecnico.split(' ')[0]}</div>
                <div className="text-lg font-black text-slate-900">{stat.totalOS}</div>
                <div className="text-[10px] text-slate-500">OS</div>
              </div>
            );
          })}
        </div>
      )}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Técnico</div>
            <div className="col-span-2 text-center">OS</div>
            <div className="col-span-2 text-center">Pontuação</div>
            <div className="col-span-3 text-center">Progresso</div>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {sorted.map((stat, idx) => (
            <div key={stat.tecnico} className={`px-5 py-3 grid grid-cols-12 gap-2 items-center hover:bg-slate-50 transition-colors ${idx < 3 ? 'bg-amber-50/20' : ''}`}>
              <div className="col-span-1 text-sm font-bold text-slate-500">{idx + 1}</div>
              <div className="col-span-4 font-semibold text-slate-800 truncate text-sm">{stat.tecnico}</div>
              <div className="col-span-2 text-center text-sm font-bold text-blue-600">{stat.totalOS}</div>
              <div className="col-span-2 text-center text-sm text-slate-700">{stat.pontuacaoMedia.toFixed(1)}</div>
              <div className="col-span-3">
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    style={{ width: `${(stat.totalOS / (sorted[0]?.totalOS || 1)) * 100}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===================== ALERTAS =====================
function AlertasSection({ alerts, totalAnalises }: { alerts: RetrabalhoAlert[]; totalAnalises: number }) {
  const taxa = totalAnalises > 0 ? ((alerts.length / totalAnalises) * 100).toFixed(1) : '0';
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-red-500" />
            <div><div className="text-2xl font-black text-red-700">{alerts.length}</div><div className="text-xs text-red-600 font-medium">Casos de Retrabalho</div></div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <TrendingUp size={24} className="text-orange-500" />
            <div><div className="text-2xl font-black text-orange-700">{taxa}%</div><div className="text-xs text-orange-600 font-medium">Taxa de Retrabalho</div></div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-amber-500" />
            <div><div className="text-2xl font-black text-amber-700">{new Set(alerts.map(a => a.cliente)).size}</div><div className="text-xs text-amber-600 font-medium">Clientes Afetados</div></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Casos Detectados</h3>
          <p className="text-xs text-slate-500 mt-0.5">Mesmo cliente atendido por técnicos diferentes em até 60 dias</p>
        </div>
        {alerts.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium text-sm">Nenhum retrabalho detectado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {alerts.map((alert, i) => (
              <div key={i} className="p-4 hover:bg-amber-50/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertCircle size={16} className="text-amber-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{alert.cliente}</div>
                      <div className="text-xs text-amber-700 font-medium mt-0.5">{alert.tipoServico}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        <span className="font-medium">{alert.tecnico1}</span> → <span className="font-medium">{alert.tecnico2}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock size={11} />{new Date(alert.data1).toLocaleDateString('pt-BR')}</span>
                        <span>→</span>
                        <span>{new Date(alert.data2).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-center">
                    <div className={`text-lg font-black ${alert.diasEntre <= 15 ? 'text-red-600' : alert.diasEntre <= 30 ? 'text-orange-600' : 'text-amber-600'}`}>{alert.diasEntre}</div>
                    <div className="text-xs text-slate-500">dias</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== COMPONENTES BASE =====================
function MetricCard({ title, value, icon: Icon, color, sub }: any) {
  const colors: any = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-500', border: 'border-blue-100', value: 'text-blue-700' },
    green: { bg: 'bg-green-50', icon: 'text-green-500', border: 'border-green-100', value: 'text-green-700' },
    red: { bg: 'bg-red-50', icon: 'text-red-500', border: 'border-red-100', value: 'text-red-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-500', border: 'border-purple-100', value: 'text-purple-700' },
  };
  const c = colors[color];
  return (
    <div className={`bg-white rounded-xl border ${c.border} p-4 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
          <p className={`text-2xl font-black ${c.value}`}>{value}</p>
          <p className="text-xs text-slate-500 mt-1">{sub}</p>
        </div>
        <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon size={18} className={c.icon} />
        </div>
      </div>
    </div>
  );
}

function AnaliseRow({ analise: a, compact = false, onClick, tecnicosAuxMap = {} }: { analise: Analise; compact?: boolean; onClick?: () => void; tecnicosAuxMap?: Record<string, string> }) {
  const status = getStatus(a);
  if (status === null) return null;

  return (
    <div
      className={`px-5 py-3.5 transition-colors ${onClick ? 'cursor-pointer hover:bg-blue-50/60' : 'hover:bg-slate-50/80'}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
          status === 'aprovado' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {status === 'aprovado'
            ? <CheckCircle size={14} className="text-green-600" />
            : <XCircle size={14} className="text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 text-sm truncate">{a.nome_cliente || '—'}</span>
            {a.id_os && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">#{a.id_os}</span>}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              status === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {status === 'aprovado' ? 'Aprovado' : 'Reprovado'}
            </span>
            {a.sinal_ONU && a.sinal_ONU !== '' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-orange-100 text-orange-700">ONU</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
            {a.id_tecnico && <span className="flex items-center gap-1"><Users size={11} />{a.id_tecnico}</span>}
            {a.tecnicoprincipal && a.tecnicoprincipal !== a.id_tecnico && <span>Principal: {a.tecnicoprincipal}</span>}
            {a.tecnicoauxiliar && <span>Auxiliar: {tecnicosAuxMap[a.tecnicoauxiliar] ?? a.tecnicoauxiliar}</span>}
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {new Date(a.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {!compact && a.final && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{a.final}</p>
          )}
        </div>
        {onClick && <ChevronRight size={16} className="text-slate-300 flex-shrink-0 mt-1" />}
      </div>
    </div>
  );
}

// ===================== MODAL OS =====================
function OSModal({ analise: a, onClose, tecnicosAuxMap }: { analise: Analise; onClose: () => void; tecnicosAuxMap: Record<string, string> }) {
  const status = getStatus(a);
  const sinalONU = (a.sinal_ONU || '').trim();
  const isAlarmONU = ['irregular', 'indefinido'].includes(sinalONU.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b border-slate-100 flex items-start justify-between gap-4 ${
          status === 'aprovado' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              status === 'aprovado' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {status === 'aprovado'
                ? <CheckCircle size={20} className="text-green-600" />
                : <XCircle size={20} className="text-red-500" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">{a.nome_cliente || '—'}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {a.id_os && <span className="text-xs bg-white text-slate-600 px-2 py-0.5 rounded font-mono border border-slate-200">#{a.id_os}</span>}
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  status === 'aprovado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {status === 'aprovado' ? 'Aprovado' : 'Reprovado'}
                </span>
                {sinalONU && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isAlarmONU ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    ONU: {sinalONU}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/80 rounded-lg transition-colors flex-shrink-0">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Infos básicas */}
          <div className="grid grid-cols-2 gap-3">
            <InfoBox label="Técnico" value={a.id_tecnico} />
            <InfoBox label="Técnico Principal" value={a.tecnicoprincipal} />
            <InfoBox label="Técnico Auxiliar" value={a.tecnicoauxiliar ? (tecnicosAuxMap[a.tecnicoauxiliar] ? `${tecnicosAuxMap[a.tecnicoauxiliar]} (${a.tecnicoauxiliar})` : a.tecnicoauxiliar) : null} />
            <InfoBox label="Caixa / Porta" value={a.caixaEporta} />
            <InfoBox label="Data" value={new Date(a.created_at).toLocaleString('pt-BR')} />
          </div>

          {/* Tipo de serviço */}
          {a.mensagem_os && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Tipo de Serviço</p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                {extrairTipoServico(a.mensagem_os) || '—'}
              </p>
            </div>
          )}

          {/* Situação Final */}
          {a.final && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Situação Final</p>
                {extrairPontuacao(a) !== null && (
                  <span className={`text-sm font-black px-3 py-1 rounded-full ${
                    (extrairPontuacao(a) ?? 0) >= 80 ? 'bg-green-100 text-green-700' :
                    (extrairPontuacao(a) ?? 0) >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {extrairPontuacao(a)?.toFixed(1)} pts
                  </span>
                )}
              </div>
              <div className={`text-sm rounded-lg px-4 py-3 border leading-relaxed whitespace-pre-wrap ${
                status === 'aprovado'
                  ? 'bg-green-50 border-green-100 text-green-900'
                  : 'bg-red-50 border-red-100 text-red-900'
              }`}>
                {a.final}
              </div>
            </div>
          )}

          {/* Mensagem OS completa */}
          {a.mensagem_os && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mensagem da OS</p>
              <div className="text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {a.mensagem_os}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== CONFIGURAÇÕES =====================
function ConfiguracoesSection({ tecnicosAuxMap, onReload, analises }: { tecnicosAuxMap: Record<string, string>; onReload: () => Promise<void>; analises: Analise[] }) {
  const [newId, setNewId] = useState('');
  const [newNome, setNewNome] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNome, setEditingNome] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const entries = Object.entries(tecnicosAuxMap).sort((a, b) => a[0].localeCompare(b[0]));

  // IDs que aparecem nas análises mas ainda não têm nome cadastrado
  const idsSemNome = [...new Set(
    analises.map(a => a.tecnicoauxiliar).filter((id): id is string => !!id && !tecnicosAuxMap[id])
  )].sort();

  const handleAdd = async () => {
    const id = newId.trim();
    const nome = newNome.trim();
    if (!id || !nome) { setError('Preencha o ID e o nome.'); return; }
    if (tecnicosAuxMap[id]) { setError('Este ID já está cadastrado.'); return; }
    setSaving(true); setError('');
    const { error: err } = await supabase.from('5.8-tecnicos_auxiliares').insert({ id, nome });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setNewId(''); setNewNome('');
    await onReload();
  };

  const handleSaveEdit = async (id: string) => {
    const nome = editingNome.trim();
    if (!nome) return;
    setSaving(true);
    await supabase.from('5.8-tecnicos_auxiliares').update({ nome }).eq('id', id);
    setSaving(false);
    setEditingId(null);
    await onReload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`Remover técnico ID ${id}?`)) return;
    await supabase.from('5.8-tecnicos_auxiliares').delete().eq('id', id);
    await onReload();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-700">Técnicos Auxiliares</h3>
          <p className="text-xs text-slate-500 mt-0.5">Mapeie o ID do técnico auxiliar para um nome legível</p>
        </div>

        {/* Adicionar novo */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text" placeholder="ID (ex: 36)" value={newId}
              onChange={e => { setNewId(e.target.value); setError(''); }}
              className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text" placeholder="Nome do técnico" value={newNome}
              onChange={e => { setNewNome(e.target.value); setError(''); }}
              className="flex-1 min-w-40 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            />
            <button
              onClick={handleAdd} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
          {idsSemNome.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1.5">IDs encontrados nas análises sem nome:</p>
              <div className="flex flex-wrap gap-1.5">
                {idsSemNome.map(id => (
                  <button key={id} onClick={() => { setNewId(id); setError(''); }}
                    className="text-xs font-mono px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded hover:bg-amber-100 transition-colors">
                    {id}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lista */}
        {entries.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">Nenhum técnico auxiliar cadastrado.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map(([id, nome]) => (
              <div key={id} className="px-5 py-3 flex items-center gap-3">
                <span className="w-16 text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded flex-shrink-0 text-center">{id}</span>
                {editingId === id ? (
                  <input
                    type="text" value={editingNome} autoFocus
                    onChange={e => setEditingNome(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(id); if (e.key === 'Escape') setEditingId(null); }}
                    className="flex-1 px-3 py-1.5 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium text-slate-800">{nome}</span>
                )}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {editingId === id ? (
                    <button onClick={() => handleSaveEdit(id)} disabled={saving}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Save size={15} />
                    </button>
                  ) : (
                    <button onClick={() => { setEditingId(id); setEditingNome(nome); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Pencil size={15} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}