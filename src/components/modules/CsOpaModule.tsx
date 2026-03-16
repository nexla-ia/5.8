import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { CsOpa } from '../../types';
import {
  RefreshCw, MessageSquare, CheckCircle, XCircle, Clock,
  TrendingUp, Search, Calendar, X, FileText, ChevronDown, ChevronUp, Users
} from 'lucide-react';

type Section = 'overview' | 'registros';

interface CsOpaModuleProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────
function isRespondeu(r: CsOpa) { return r.respondeu?.toLowerCase() === 'sim'; }
function isOsCriada(r: CsOpa) { return r.os_criada?.toLowerCase() === 'sim'; }
function isContatado(r: CsOpa) { return r['contatado?']?.toLowerCase() === 'sim'; }
function isNaoRespondeu(r: CsOpa) { return isContatado(r) && !isRespondeu(r); }
function isPendente(r: CsOpa) { return !isContatado(r) && !isRespondeu(r); }

function statusInfo(r: CsOpa): { label: string; color: string } {
  if (isOsCriada(r))    return { label: 'OS Criada',     color: 'bg-blue-100 text-blue-700 border-blue-200' };
  if (isRespondeu(r))   return { label: 'Respondeu',     color: 'bg-green-100 text-green-700 border-green-200' };
  if (isNaoRespondeu(r)) return { label: 'Não respondeu', color: 'bg-red-100 text-red-700 border-red-200' };
  return                       { label: 'Pendente',      color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── metric card ─────────────────────────────────────────────────
function MetricCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'teal';
}) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'text-blue-400'   },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'text-green-400'  },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    icon: 'text-red-400'    },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'text-yellow-400' },
    teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   icon: 'text-teal-400'   },
  }[color];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <p className={`text-3xl font-black ${colors.text}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`${colors.bg} p-2.5 rounded-lg`}>
        <Icon size={18} className={colors.icon} />
      </div>
    </div>
  );
}

// ─── evolução mensal ──────────────────────────────────────────────
function EvolucaoMensal({ data }: {
  data: { mes: string; respondeu: number; osCriada: number; naoRespondeu: number; pendente: number }[];
}) {
  if (data.length === 0) return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-1">Evolução Mensal</p>
      <p className="text-xs text-slate-400 mb-4">Contatos por mês</p>
      <p className="text-sm text-slate-400 text-center py-6">Sem dados no período</p>
    </div>
  );
  const maxTotal = Math.max(...data.map(d => d.respondeu + d.naoRespondeu + d.pendente), 1);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-1">Evolução Mensal</p>
      <p className="text-xs text-slate-400 mb-5">Contatos por mês</p>
      <div className="space-y-3">
        {data.map(d => {
          const total = d.respondeu + d.naoRespondeu + d.pendente;
          const barWidth = (total / maxTotal) * 100;
          const respPct = total > 0 ? (d.respondeu / total) * 100 : 0;
          const nresPct = total > 0 ? (d.naoRespondeu / total) * 100 : 0;
          const pendPct = total > 0 ? (d.pendente / total) * 100 : 0;
          const finalizado = d.respondeu + d.naoRespondeu;
          const taxa = finalizado > 0 ? ((d.respondeu / finalizado) * 100).toFixed(0) : '—';
          return (
            <div key={d.mes} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-12 text-right flex-shrink-0">{d.mes}</span>
              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full flex" style={{ width: `${barWidth}%` }}>
                  {respPct > 0 && <div className="h-full bg-green-400" style={{ width: `${respPct}%` }} />}
                  {nresPct > 0 && <div className="h-full bg-red-400" style={{ width: `${nresPct}%` }} />}
                  {pendPct > 0 && <div className="h-full bg-yellow-300" style={{ width: `${pendPct}%` }} />}
                </div>
              </div>
              <span className={`text-xs font-bold w-10 flex-shrink-0 ${taxa === '—' ? 'text-slate-400' : Number(taxa) >= 60 ? 'text-green-600' : 'text-red-500'}`}>
                {taxa}{taxa !== '—' ? '%' : ''}
              </span>
              <span className="text-xs text-slate-400 w-20 flex-shrink-0">{total} contatos</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Respondeu</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Não respondeu</span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-full bg-yellow-300 inline-block" />Pendente</span>
      </div>
    </div>
  );
}

// ─── top atendentes ───────────────────────────────────────────────
function TopAtendentes({ registros }: { registros: CsOpa[] }) {
  const map = new Map<string, { total: number; respondeu: number; osCriada: number }>();
  registros.forEach(r => {
    const id = r.id_atendente ?? 'Desconhecido';
    if (!map.has(id)) map.set(id, { total: 0, respondeu: 0, osCriada: 0 });
    const m = map.get(id)!;
    m.total++;
    if (isRespondeu(r)) m.respondeu++;
    if (isOsCriada(r)) m.osCriada++;
  });
  const lista = Array.from(map.entries())
    .map(([id, d]) => ({ id, ...d, taxa: d.total > 0 ? ((d.respondeu / d.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (lista.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users size={15} className="text-green-500" />
        <p className="text-sm font-semibold text-slate-700">Por Atendente</p>
      </div>
      <div className="space-y-2">
        {lista.map((a, i) => (
          <div key={a.id} className="flex items-center gap-3">
            <span className="text-xs text-slate-400 w-5 text-right">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-slate-700 truncate">ID {a.id}</span>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-[10px] text-green-600 font-bold">{a.respondeu} resp</span>
                  {a.osCriada > 0 && <span className="text-[10px] text-blue-600 font-bold">{a.osCriada} OS</span>}
                  <span className="text-[10px] text-slate-400">{a.total} total</span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-400 rounded-full" style={{ width: `${a.taxa}%` }} />
              </div>
            </div>
            <span className={`text-xs font-bold w-10 text-right flex-shrink-0 ${a.taxa >= 60 ? 'text-green-600' : 'text-red-500'}`}>
              {a.taxa.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── visão geral ──────────────────────────────────────────────────
function OverviewSection({ registros }: { registros: CsOpa[] }) {
  const total = registros.length;
  const respondeu = registros.filter(isRespondeu).length;
  const osCriada = registros.filter(isOsCriada).length;
  const naoRespondeu = registros.filter(isNaoRespondeu).length;
  const pendente = registros.filter(isPendente).length;
  const finalizado = respondeu + naoRespondeu;
  const taxaResposta = finalizado > 0 ? ((respondeu / finalizado) * 100).toFixed(1) : '—';

  // evolução mensal
  const mesMap = new Map<string, { respondeu: number; osCriada: number; naoRespondeu: number; pendente: number }>();
  registros.forEach(r => {
    const mes = r.created_at.slice(0, 7);
    if (!mesMap.has(mes)) mesMap.set(mes, { respondeu: 0, osCriada: 0, naoRespondeu: 0, pendente: 0 });
    const m = mesMap.get(mes)!;
    if (isRespondeu(r)) m.respondeu++;
    if (isOsCriada(r)) m.osCriada++;
    else if (isNaoRespondeu(r)) m.naoRespondeu++;
    else m.pendente++;
  });
  const evolucao = Array.from(mesMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, d]) => ({
      mes: new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      ...d,
    }));

  return (
    <div className="space-y-5">
      {/* métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Total Contatos" value={total} sub={`${finalizado} finalizados`} icon={MessageSquare} color="blue" />
        <MetricCard title="Responderam" value={respondeu} sub="avaliação recebida" icon={CheckCircle} color="green" />
        <MetricCard title="OS Criadas" value={osCriada} sub="avaliação registrada" icon={FileText} color="teal" />
        <MetricCard title="Não responderam" value={naoRespondeu} sub="sem retorno" icon={XCircle} color="red" />
        <MetricCard
          title="Taxa de Resposta"
          value={taxaResposta !== '—' ? `${taxaResposta}%` : '—'}
          sub="sobre finalizados"
          icon={TrendingUp}
          color={taxaResposta !== '—' && Number(taxaResposta) >= 60 ? 'green' : 'red'}
        />
      </div>

      {pendente > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <Clock size={16} className="text-yellow-500 flex-shrink-0" />
          <span className="text-sm text-yellow-700"><span className="font-bold">{pendente}</span> contatos ainda pendentes de resposta no período</span>
        </div>
      )}

      {/* evolução + atendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EvolucaoMensal data={evolucao} />
        </div>
        <TopAtendentes registros={registros} />
      </div>
    </div>
  );
}

// ─── registros ───────────────────────────────────────────────────
function RegistrosSection({ registros }: { registros: CsOpa[] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'respondeu' | 'os_criada' | 'nao_respondeu' | 'pendente'>('todos');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 30;

  const filtered = registros.filter(r => {
    if (filterStatus === 'respondeu' && !isRespondeu(r)) return false;
    if (filterStatus === 'os_criada' && !isOsCriada(r)) return false;
    if (filterStatus === 'nao_respondeu' && !isNaoRespondeu(r)) return false;
    if (filterStatus === 'pendente' && !isPendente(r)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.nome?.toLowerCase().includes(q) ||
        r.protocolo?.toLowerCase().includes(q) ||
        r.numero_cliente?.toLowerCase().includes(q) ||
        r.id_atendente?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="space-y-3">
      {/* filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input
            value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Nome, protocolo, número cliente, atendente..."
            className="bg-transparent border-none outline-none text-xs text-slate-700 flex-1"
          />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-slate-400 hover:text-red-500" /></button>}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([
            { id: 'todos', label: 'Todos' },
            { id: 'respondeu', label: 'Respondeu' },
            { id: 'os_criada', label: 'OS Criada' },
            { id: 'nao_respondeu', label: 'Não respondeu' },
            { id: 'pendente', label: 'Pendente' },
          ] as const).map(s => (
            <button key={s.id} onClick={() => { setFilterStatus(s.id); setPage(0); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${filterStatus === s.id ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-600 border-slate-200 hover:border-green-400'}`}>
              {s.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} registros</span>
      </div>

      {/* tabela */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div className="col-span-3">Cliente</div>
          <div className="col-span-2 text-center">Protocolo</div>
          <div className="col-span-2 text-center">Atendente</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Data</div>
          <div className="col-span-1" />
        </div>
        <div className="divide-y divide-slate-50">
          {paged.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10">Nenhum registro encontrado</p>
          )}
          {paged.map(r => {
            const st = statusInfo(r);
            const isOpen = expanded === r.id;
            return (
              <div key={r.id}>
                <div className="px-5 py-3 grid grid-cols-12 gap-2 items-center hover:bg-slate-50 transition-colors">
                  <div className="col-span-3 min-w-0">
                    <div className="font-medium text-slate-800 text-sm truncate">{r.nome ?? '—'}</div>
                    {r.numero_cliente && <div className="text-[10px] text-slate-400">#{r.numero_cliente}</div>}
                  </div>
                  <div className="col-span-2 text-center text-sm text-blue-600 font-medium">{r.protocolo ?? '—'}</div>
                  <div className="col-span-2 text-center text-xs text-slate-500">
                    {r.id_atendente ? `ID ${r.id_atendente}` : '—'}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="col-span-2 text-center text-xs text-slate-400">{fmtDate(r.created_at)}</div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => setExpanded(isOpen ? null : r.id)} className="text-slate-400 hover:text-slate-700 transition-colors">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    {[
                      { label: 'ID Cliente', value: r.id_cliente },
                      { label: 'Número Cliente', value: r.numero_cliente },
                      { label: 'ID Atendente', value: r.id_atendente },
                      { label: 'Protocolo', value: r.protocolo },
                      { label: 'Contatado?', value: r['contatado?'] },
                      { label: 'Respondeu', value: r.respondeu },
                      { label: 'OS Criada', value: r.os_criada },
                      { label: 'Data Inicial', value: r.data_inicial },
                      { label: 'Data Final', value: r.data_final },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{f.label}</p>
                        <p className="text-slate-700 font-medium mt-0.5">{f.value ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:border-green-400 transition-colors">
            Anterior
          </button>
          <span className="text-xs text-slate-500">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:border-green-400 transition-colors">
            Próximo
          </button>
        </div>
      )}
    </div>
  );
}

// ─── módulo principal ─────────────────────────────────────────────
export default function CsOpaModule(_props: CsOpaModuleProps) {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [registros, setRegistros] = useState<CsOpa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      let allData: CsOpa[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('5.8-cs_opa')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        from += pageSize;
      }
      setRegistros(allData);
    } catch (err) {
      console.error('Erro ao carregar CS OPA:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const periodo = registros.filter(r => {
    if (filterDateFrom && r.created_at < filterDateFrom) return false;
    if (filterDateTo && r.created_at > filterDateTo + 'T23:59:59') return false;
    return true;
  });

  const sections: { id: Section; label: string }[] = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'registros', label: 'Registros' },
  ];

  const fmtDateShort = (d: Date) => d.toISOString().slice(0, 10);
  const hoje = new Date();
  const atalhos = [
    { label: 'Todos', from: '', to: '' },
    { label: 'Este mês', from: fmtDateShort(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), to: fmtDateShort(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)) },
    { label: 'Mês anterior', from: fmtDateShort(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)), to: fmtDateShort(new Date(hoje.getFullYear(), hoje.getMonth(), 0)) },
    { label: 'Trimestre', from: fmtDateShort(new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)), to: fmtDateShort(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)) },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500">
        <RefreshCw size={20} className="animate-spin" />
        <span className="text-sm">Carregando CS OPA...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Módulo &rsaquo; <span className="text-green-600 font-medium">CS OPA</span></p>
            <h1 className="text-lg font-bold text-slate-900">{sections.find(s => s.id === activeSection)?.label}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {atalhos.map(a => (
              <button key={a.label}
                onClick={() => { setFilterDateFrom(a.from); setFilterDateTo(a.to); }}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium ${filterDateFrom === a.from && filterDateTo === a.to ? 'bg-green-500 text-white border-green-500' : 'bg-white text-slate-600 border-slate-200 hover:border-green-400 hover:text-green-600'}`}>
                {a.label}
              </button>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
              <Calendar size={13} className="text-slate-400" />
              <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-600 w-28 cursor-pointer" />
              <span className="text-slate-300">—</span>
              <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-slate-600 w-28 cursor-pointer" />
              {(filterDateFrom || filterDateTo) && (
                <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); }} className="ml-1 text-slate-400 hover:text-red-500">
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {periodo.length}{periodo.length !== registros.length ? `/${registros.length}` : ''} registros
            </span>
            <button onClick={() => loadData(true)} disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white rounded-lg text-sm font-medium transition-all">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>
        <div className="flex gap-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === s.id ? 'bg-green-50 text-green-700 border border-green-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 py-5">
        {activeSection === 'overview' && <OverviewSection registros={periodo} />}
        {activeSection === 'registros' && <RegistrosSection registros={periodo} />}
      </div>
    </div>
  );
}
