import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { CsIxc } from '../../types';
import {
  RefreshCw, MessageSquare, CheckCircle, XCircle, Clock,
  TrendingUp, Search, Calendar, X, Building2, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown
} from 'lucide-react';

type Section = 'overview' | 'registros';

interface CsIxcModuleProps {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

// ─── helpers de status ───────────────────────────────────────────
function isRespondeu(r: CsIxc) { return r.contato?.toLowerCase() === 'sim'; }
function isNaoRespondeu(r: CsIxc) { return !!r.finalizado_ixc && !isRespondeu(r); }
function isPendente(r: CsIxc) { return !r.finalizado_ixc && !isRespondeu(r); }
function isPositiva(r: CsIxc) { return r.avaliacao?.toLowerCase() === 'positiva'; }
function isNegativa(r: CsIxc) { return r.avaliacao?.toLowerCase() === 'negativo'; }

function getFilialLabel(id: string | null) {
  if (id === '1') return '5.8';
  if (id === '9') return 'VIP';
  return id ?? '—';
}

function statusInfo(r: CsIxc): { label: string; color: string } {
  if (isRespondeu(r)) return { label: 'Respondeu', color: 'bg-green-100 text-green-700 border-green-200' };
  if (isNaoRespondeu(r)) return { label: 'Não respondeu', color: 'bg-red-100 text-red-700 border-red-200' };
  return { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── metric card ─────────────────────────────────────────────────
function MetricCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
}) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'text-blue-400'   },
    green:  { bg: 'bg-green-50',  text: 'text-green-600',  icon: 'text-green-400'  },
    red:    { bg: 'bg-red-50',    text: 'text-red-600',    icon: 'text-red-400'    },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: 'text-yellow-400' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-400' },
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

// ─── filial card ─────────────────────────────────────────────────
function FilialCard({ filial, data }: {
  filial: string;
  data: { total: number; respondeu: number; naoRespondeu: number; pendente: number };
}) {
  const finalizado = data.respondeu + data.naoRespondeu;
  const taxa = finalizado > 0 ? ((data.respondeu / finalizado) * 100).toFixed(1) : '—';
  const isVip = filial === 'VIP';
  return (
    <div className={`bg-white rounded-xl border p-5 shadow-sm ${isVip ? 'border-purple-200' : 'border-blue-200'}`}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={16} className={isVip ? 'text-purple-500' : 'text-blue-500'} />
        <span className={`font-bold text-sm ${isVip ? 'text-purple-700' : 'text-blue-700'}`}>Filial {filial}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-2xl font-black text-slate-800">{data.total}</p>
          <p className="text-[11px] text-slate-400">Total CS</p>
        </div>
        <div>
          <p className={`text-2xl font-black ${taxa === '—' ? 'text-slate-400' : Number(taxa) >= 60 ? 'text-green-600' : 'text-red-500'}`}>{taxa}{taxa !== '—' ? '%' : ''}</p>
          <p className="text-[11px] text-slate-400">Taxa resposta</p>
        </div>
        <div>
          <p className="text-2xl font-black text-green-600">{data.respondeu}</p>
          <p className="text-[11px] text-slate-400">Responderam</p>
        </div>
        <div>
          <p className="text-2xl font-black text-red-500">{data.naoRespondeu}</p>
          <p className="text-[11px] text-slate-400">Não responderam</p>
        </div>
      </div>
      {data.pendente > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-yellow-600">
          <span className="flex items-center gap-1"><Clock size={11} /> Pendentes</span>
          <span className="font-bold">{data.pendente}</span>
        </div>
      )}
    </div>
  );
}

// ─── evolução mensal ──────────────────────────────────────────────
function EvolucaoMensal({ data }: { data: { mes: string; respondeu: number; naoRespondeu: number; pendente: number }[] }) {
  if (data.length === 0) return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-1">Evolução Mensal</p>
      <p className="text-xs text-slate-400 mb-4">Respostas por mês</p>
      <p className="text-sm text-slate-400 text-center py-6">Sem dados no período</p>
    </div>
  );
  const maxTotal = Math.max(...data.map(d => d.respondeu + d.naoRespondeu + d.pendente), 1);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <p className="text-sm font-semibold text-slate-700 mb-1">Evolução Mensal</p>
      <p className="text-xs text-slate-400 mb-5">Respostas por mês</p>
      <div className="space-y-3">
        {data.map(d => {
          const total = d.respondeu + d.naoRespondeu + d.pendente;
          const respPct = total > 0 ? (d.respondeu / total) * 100 : 0;
          const nresPct = total > 0 ? (d.naoRespondeu / total) * 100 : 0;
          const pendPct = total > 0 ? (d.pendente / total) * 100 : 0;
          const barWidth = (total / maxTotal) * 100;
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
              <span className="text-xs text-slate-400 w-16 flex-shrink-0">{total} CS</span>
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

// ─── visão geral ──────────────────────────────────────────────────
function OverviewSection({ registros }: { registros: CsIxc[] }) {
  const total = registros.length;
  const respondeu = registros.filter(isRespondeu).length;
  const naoRespondeu = registros.filter(isNaoRespondeu).length;
  const pendente = registros.filter(isPendente).length;
  const finalizado = respondeu + naoRespondeu;
  const taxaResposta = finalizado > 0 ? ((respondeu / finalizado) * 100).toFixed(1) : '—';

  const avaliados = registros.filter(r => r.avaliacao);
  const positivas = avaliados.filter(isPositiva).length;
  const negativas = avaliados.filter(isNegativa).length;
  const taxaPositiva = avaliados.length > 0 ? ((positivas / avaliados.length) * 100).toFixed(1) : '—';

  // por filial
  const porFilial = ['1', '9'].map(fid => {
    const sub = registros.filter(r => r.id_filial === fid);
    return {
      filial: getFilialLabel(fid),
      data: {
        total: sub.length,
        respondeu: sub.filter(isRespondeu).length,
        naoRespondeu: sub.filter(isNaoRespondeu).length,
        pendente: sub.filter(isPendente).length,
      },
    };
  });

  // evolução mensal
  const mesMap = new Map<string, { respondeu: number; naoRespondeu: number; pendente: number }>();
  registros.forEach(r => {
    const mes = r.created_at.slice(0, 7); // YYYY-MM
    if (!mesMap.has(mes)) mesMap.set(mes, { respondeu: 0, naoRespondeu: 0, pendente: 0 });
    const m = mesMap.get(mes)!;
    if (isRespondeu(r)) m.respondeu++;
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total CS" value={total} sub={`${finalizado} finalizados`} icon={MessageSquare} color="blue" />
        <MetricCard title="Responderam" value={respondeu} sub="contato confirmado" icon={CheckCircle} color="green" />
        <MetricCard title="Não responderam" value={naoRespondeu} sub="finalizado sem retorno" icon={XCircle} color="red" />
        <MetricCard title="Pendentes" value={pendente} sub="aguardando resposta" icon={Clock} color="yellow" />
      </div>

      {/* avaliação IA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Avaliados pela IA" value={avaliados.length} sub={`de ${total} atendimentos`} icon={TrendingUp} color="purple" />
        <MetricCard title="Avaliação Positiva" value={positivas} sub="resolvidos com sucesso" icon={ThumbsUp} color="green" />
        <MetricCard title="Avaliação Negativa" value={negativas} sub="requerem atenção" icon={ThumbsDown} color="red" />
        <MetricCard
          title="Taxa Positiva"
          value={taxaPositiva !== '—' ? `${taxaPositiva}%` : '—'}
          sub="sobre avaliados"
          icon={TrendingUp}
          color={taxaPositiva !== '—' && Number(taxaPositiva) >= 60 ? 'green' : 'red'}
        />
      </div>

      {/* por filial + evolução */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EvolucaoMensal data={evolucao} />
        </div>
        <div className="space-y-4">
          {porFilial.map(f => <FilialCard key={f.filial} filial={f.filial} data={f.data} />)}
        </div>
      </div>
    </div>
  );
}

// ─── registros ───────────────────────────────────────────────────
function RegistrosSection({ registros }: { registros: CsIxc[] }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'respondeu' | 'nao_respondeu' | 'pendente'>('todos');
  const [filterFilial, setFilterFilial] = useState<'todos' | '1' | '9'>('todos');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const PER_PAGE = 30;

  const filtered = registros.filter(r => {
    if (filterFilial !== 'todos' && r.id_filial !== filterFilial) return false;
    if (filterStatus === 'respondeu' && !isRespondeu(r)) return false;
    if (filterStatus === 'nao_respondeu' && !isNaoRespondeu(r)) return false;
    if (filterStatus === 'pendente' && !isPendente(r)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.nome?.toLowerCase().includes(q) ||
        r.id_os?.toLowerCase().includes(q) ||
        r.numero_cliente?.toLowerCase().includes(q) ||
        r.cpf_cnpj?.toLowerCase().includes(q)
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
            placeholder="Nome, OS, número cliente..."
            className="bg-transparent border-none outline-none text-xs text-slate-700 flex-1"
          />
          {search && <button onClick={() => setSearch('')}><X size={12} className="text-slate-400 hover:text-red-500" /></button>}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['todos', 'respondeu', 'nao_respondeu', 'pendente'] as const).map(s => (
            <button key={s} onClick={() => { setFilterStatus(s); setPage(0); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${filterStatus === s ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
              {s === 'todos' ? 'Todos' : s === 'respondeu' ? 'Respondeu' : s === 'nao_respondeu' ? 'Não respondeu' : 'Pendente'}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(['todos', '1', '9'] as const).map(f => (
            <button key={f} onClick={() => { setFilterFilial(f); setPage(0); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${filterFilial === f ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-400'}`}>
              {f === 'todos' ? 'Todas filiais' : f === '1' ? '5.8' : 'VIP'}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400 ml-auto">{filtered.length} registros</span>
      </div>

      {/* tabela */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
          <div className="col-span-3">Cliente</div>
          <div className="col-span-2 text-center">OS Vinculada</div>
          <div className="col-span-1 text-center">Filial</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Avaliação IA</div>
          <div className="col-span-1 text-center">Data</div>
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
                  <div className="col-span-2 text-center text-sm text-blue-600 font-medium">{r.id_os ?? '—'}</div>
                  <div className="col-span-1 flex justify-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.id_filial === '1' ? 'bg-blue-100 text-blue-700' : r.id_filial === '9' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                      {getFilialLabel(r.id_filial)}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {r.avaliacao ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${isPositiva(r) ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {isPositiva(r) ? <ThumbsUp size={10} /> : <ThumbsDown size={10} />}
                        {isPositiva(r) ? 'Positiva' : 'Negativa'}
                      </span>
                    ) : <span className="text-xs text-slate-300">—</span>}
                  </div>
                  <div className="col-span-1 text-center text-xs text-slate-400">{fmtDate(r.created_at)}</div>
                  <div className="col-span-1 flex justify-end">
                    <button onClick={() => setExpanded(isOpen ? null : r.id)} className="text-slate-400 hover:text-slate-700 transition-colors">
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-4 text-xs">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'ID Cliente', value: r.id_cliente },
                        { label: 'CPF/CNPJ', value: r.cpf_cnpj },
                        { label: 'Contato', value: r.contato },
                        { label: 'Finalizado IXC', value: r.finalizado_ixc },
                        { label: 'OS Vinculada', value: r.id_os },
                        { label: 'Número Cliente', value: r.numero_cliente },
                        { label: 'Concluído com Sucesso', value: r.concluido_sucesso },
                        { label: 'Avaliação', value: r.avaliacao },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{f.label}</p>
                          <p className="text-slate-700 font-medium mt-0.5">{f.value ?? '—'}</p>
                        </div>
                      ))}
                    </div>
                    {r.mensagem_final && (
                      <div className="border-t border-slate-200 pt-3">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Relatório da IA</p>
                        <p className="text-slate-700 leading-relaxed bg-white rounded-lg border border-slate-200 p-3">{r.mensagem_final}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:border-blue-400 transition-colors">
            Anterior
          </button>
          <span className="text-xs text-slate-500">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:border-blue-400 transition-colors">
            Próximo
          </button>
        </div>
      )}
    </div>
  );
}

// ─── módulo principal ─────────────────────────────────────────────
export default function CsIxcModule(_props: CsIxcModuleProps) {
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [registros, setRegistros] = useState<CsIxc[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      let allData: CsIxc[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('5.8-cs_ixc')
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
      console.error('Erro ao carregar CS IXC:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // filtro de período
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
        <span className="text-sm">Carregando CS IXC...</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Módulo &rsaquo; <span className="text-purple-600 font-medium">CS IXC</span></p>
            <h1 className="text-lg font-bold text-slate-900">{sections.find(s => s.id === activeSection)?.label}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* atalhos */}
            {atalhos.map(a => (
              <button key={a.label}
                onClick={() => { setFilterDateFrom(a.from); setFilterDateTo(a.to); }}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors font-medium ${filterDateFrom === a.from && filterDateTo === a.to ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-slate-600 border-slate-200 hover:border-purple-400 hover:text-purple-600'}`}>
                {a.label}
              </button>
            ))}
            {/* datas */}
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
              className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-lg text-sm font-medium transition-all">
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Atualizar
            </button>
          </div>
        </div>
        {/* tabs */}
        <div className="flex gap-1">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === s.id ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* conteúdo */}
      <div className="px-6 py-5">
        {activeSection === 'overview' && <OverviewSection registros={periodo} />}
        {activeSection === 'registros' && <RegistrosSection registros={periodo} />}
      </div>
    </div>
  );
}
